from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import yaml
import json
import shutil
from pathlib import Path
import subprocess
import logging
from datetime import datetime
import openai
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create async version of subprocess.exec
async def execAsync(command: str):
    """Execute a shell command asynchronously"""
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"Command failed with exit code {process.returncode}: {stderr.decode()}")
        
    return stdout.decode()

# Configure OpenAI
if not os.getenv('OPENAI_API_KEY'):
    raise ValueError("OPENAI_API_KEY environment variable is required")

openai.api_key = os.getenv('OPENAI_API_KEY')

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # This ensures DELETE method is allowed
    allow_headers=["*"],
)

# Constants
FRONTEND_SRC_PATH = os.getenv('FRONTEND_SRC_PATH', '/app/src')
GATEWAY_SERVICES_PATH = '/app/gateway/services.json'

# Pydantic models to match frontend structure
class Input(BaseModel):
    type: str
    description: str
    format: Optional[List[str]] = []

class Rule(BaseModel):
    type: str
    description: str
    criteria: Optional[List[str]] = []

class Output(BaseModel):
    name: str
    type: str
    description: str
    format: Optional[str] = ''

class AnalyzerStructure(BaseModel):
    inputs: List[Input]
    rules: List[Rule]
    outputs: List[Output]

class SystemPrompt(BaseModel):
    role: str
    content: str
    description: str

class AnalyzerConfig(BaseModel):
    name: str
    analyzerType: str
    structure: AnalyzerStructure
    systemPrompt: SystemPrompt
    userPrompt: str

class CreateAnalyzerResponse(BaseModel):
    success: bool
    analyzer: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    details: Optional[str] = None

def update_registry(component_name: str, route_name: str, config: AnalyzerConfig, base_path: Path):
    """Update the analyzers registry with the new analyzer"""
    try:
        # Update path to match frontend structure
        registry_path = base_path / "app" / "analyzers" / "registry.json"
        logger.info(f"Registry path: {registry_path}")
        
        # Ensure directory exists
        registry_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Read existing registry or create new
        if registry_path.exists():
            logger.info("Reading existing registry")
            try:
                with open(registry_path, 'r') as f:
                    registry = json.load(f)
                logger.info(f"Existing registry content: {registry}")
            except Exception as e:
                logger.error(f"Error reading registry: {e}")
                registry = {}
        else:
            logger.info("Creating new registry")
            registry = {}

        # Add new analyzer to registry
        registry[route_name] = {
            "name": config.name,
            "componentName": component_name,
            "configPath": f"config/analyzers/{route_name}.json",
            "pythonPath": f"analyticscode/{route_name}/main.py"
        }
        
        logger.info(f"Updated registry content: {registry}")

        # Write updated registry
        try:
            with open(registry_path, 'w') as f:
                json.dump(registry, f, indent=2)
            logger.info(f"Successfully wrote to registry file")
        except Exception as e:
            logger.error(f"Error writing to registry: {e}")
            raise
            
        logger.info(f"Updated registry with {route_name}")
        
    except Exception as e:
        logger.error(f"Error updating registry: {e}")
        logger.error("Full traceback: ", exc_info=True)
        raise

@app.post("/create-analyzer")
async def create_analyzer(config: AnalyzerConfig):
    try:
        logger.info(f"Creating analyzer: {config.name}")
        
        component_name = f"{config.name.replace(' ', '')}Analyzer"
        route_name = component_name.lower()
        base_path = Path(os.getenv('FRONTEND_SRC_PATH', '/app/src'))

        # Format prompt with AI
        logger.info("Getting formatted prompt...")
        formatted_prompt = await format_prompt_with_ai(config)
        
        # Generate Python files
        logger.info("Generating Python files...")
        generate_python_code(component_name, route_name, config, base_path)
        logger.info("All files created successfully")

        # Update registry
        logger.info("Updating analyzer registry...")
        update_registry(component_name, route_name, config, base_path)
        logger.info("Registry updated successfully")

        # The watch-services.js will handle Docker operations
        return {
            "success": True,
            "analyzer": {
                "name": config.name,
                "componentName": component_name,
                "routeName": route_name,
                "analyzerType": config.analyzerType,
                "structure": config.structure.dict(),
                "systemPrompt": config.systemPrompt.dict(),
                "userPrompt": config.userPrompt
            }
        }

    except Exception as e:
        logger.error(f"Error creating analyzer: {str(e)}")
        if 'component_name' in locals() and 'route_name' in locals() and 'base_path' in locals():
            cleanup_files(component_name, route_name, base_path)
        raise HTTPException(status_code=500, detail=str(e))

async def register_with_gateway(config: AnalyzerConfig, component_name: str, route_name: str):
    """Register the new analyzer service with the gateway"""
    try:
        services_path = Path(GATEWAY_SERVICES_PATH)
        services = []
        
        # Load existing services
        if services_path.exists():
            with open(services_path) as f:
                services = json.load(f)

        # Add new service
        new_service = {
            "name": route_name,
            "url": f"http://{route_name}:8000",
            "health_check": "/health",
            "routes": [
                {
                    "path": f"/api/{route_name}",
                    "methods": ["POST"],
                    "target": "/analyze"
                }
            ]
        }

        # Update services list
        services.append(new_service)

        # Write updated services back to file
        with open(services_path, 'w') as f:
            json.dump(services, f, indent=2)

        logger.info(f"Registered analyzer {route_name} with gateway")

    except Exception as e:
        logger.error(f"Failed to register with gateway: {e}")
        raise

async def generate_files(config: AnalyzerConfig, component_name: str, route_name: str, base_path: Path):
    """Generate all necessary files for the analyzer"""
    try:
        # Create directories if they don't exist
        directories = [
            base_path / "components" / "analyzers",
            base_path / "config" / "analyzers",
            base_path / "analyticscode" / route_name
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

        # Generate files
        await generate_component_file(config, component_name, base_path)
        await generate_config_file(config, route_name, base_path)
        await generate_python_files(config, route_name, base_path)
        await update_registry(config, component_name, route_name, base_path)
        await update_docker_compose(route_name)

    except Exception as e:
        logger.error(f"Error generating files: {str(e)}")
        cleanup_files(component_name, route_name, base_path)
        raise

async def generate_component_file(config: AnalyzerConfig, component_name: str, base_path: Path):
    """Generate the React component file"""
    component_path = base_path / "components" / "analyzers" / f"{component_name}.tsx"
    
    # Component template code here...
    component_content = f"""
import React from 'react';
import {{ AnalyzerProps }} from '../../types/analyzer';

interface {component_name}Result {{
  {generate_typescript_interfaces(config.structure.outputs)}
}}

const {component_name}: React.FC<AnalyzerProps> = ({{
  spreadsheet,
  onAnalysisComplete,
  renderCustomButton
}}) => {{
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAnalysis = async () => {{
    setIsAnalyzing(true);
    setError(null);
    try {{
      const response = await fetch('/api/{route_name}', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ spreadsheet }})
      }});

      if (!response.ok) {{
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }}
      
      const result = await response.json() as {component_name}Result;
      onAnalysisComplete(result, "{config.name}");
    }} catch (error) {{
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    }} finally {{
      setIsAnalyzing(false);
    }}
  }};

  return (
    <div>
      {{renderCustomButton ? 
        renderCustomButton(handleAnalysis, isAnalyzing) : 
        <button 
          onClick={{handleAnalysis}} 
          disabled={{isAnalyzing}}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {{isAnalyzing ? 'Analyzing...' : '{config.name}'}}
        </button>
      }}
      {{error && <div className="text-red-500 mt-2">{{error}}</div>}}
    </div>
  );
}};

export default {component_name};
"""
    
    with open(component_path, 'w') as f:
        f.write(component_content)

async def format_prompt_with_ai(config: AnalyzerConfig):
    """Format the analysis prompt using OpenAI"""
    try:
        # Convert Pydantic model to dict before using
        structure_dict = config.structure.dict()
        
        # Use synchronous call without await
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an AI prompt formatter specializing in data analysis. Format this prompt considering:
                    1. Input fields: {structure_dict['inputs']}
                    2. Analysis rules: {structure_dict['rules']}
                    3. Required outputs: {structure_dict['outputs']}
                    4. Analyzer type: {config.analyzerType}
                    
                    Format the prompt to be clear and specific about the analysis requirements."""
                },
                {
                    "role": "user",
                    "content": f"Format this analysis prompt: {config.userPrompt}"
                }
            ],
            temperature=0.1,
        )

        formatted_prompt = response.choices[0].message['content']
        return formatted_prompt

    except Exception as e:
        logger.error(f"Error formatting prompt: {e}")
        logger.error("Full traceback: ", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error formatting prompt: {str(e)}")

def extract_python_code(content: str) -> Optional[str]:
    """Extract Python code from markdown-formatted text"""
    import re
    python_code_regex = r"```python\n([\s\S]*?)```"
    match = re.search(python_code_regex, content)
    return match.group(1).strip() if match else None

async def generate_python_files(config: AnalyzerConfig, route_name: str, base_path: Path):
    """Generate Python implementation files"""
    try:
        # Get AI-formatted prompt and outputs
        formatted_prompt, outputs = await format_prompt_with_ai(config)
        
        # Extract Python code from formatted prompt
        python_implementation = extract_python_code(formatted_prompt)
        if not python_implementation:
            raise ValueError("Failed to generate Python implementation")

        analytics_path = base_path / "analyticscode" / route_name
        
        # Generate main.py with FastAPI implementation
        main_py_content = generate_fastapi_wrapper(
            python_implementation,
            config.name,
            outputs
        )
        
        with open(analytics_path / "main.py", "w") as f:
            f.write(main_py_content)

        # Generate other necessary files
        generate_requirements(analytics_path)
        generate_dockerfile(analytics_path)
        
    except Exception as e:
        logger.error(f"Error generating Python files: {str(e)}")
        raise

def generate_fastapi_wrapper(implementation: str, analyzer_name: str, outputs: List[Dict[str, Any]]) -> str:
    """Generate the FastAPI wrapper code"""
    return f"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

{implementation}

@app.post("/analyze")
async def analyze_endpoint(request: dict):
    try:
        # Convert input data to DataFrame
        df = pd.DataFrame(request["spreadsheet"])
        
        # Run analysis
        result = analyze_data(df)
        
        return {{
            "status": "success",
            "results": result,
            "metadata": {{
                "analyzer": "{analyzer_name}",
                "version": "1.0.0"
            }}
        }}
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {{"status": "healthy"}}
"""

# Add other necessary functions like generate_config_file, generate_python_files, etc. 

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check OpenAI API key
        openai_status = "ok" if os.getenv('OPENAI_API_KEY') else "missing"
        
        # Check source path
        src_path = os.getenv('FRONTEND_SRC_PATH', '/app/src')
        src_path_status = "ok" if os.path.exists(src_path) else "missing"
        
        return {
            "status": "healthy",
            "service": "backend",
            "timestamp": datetime.now().isoformat(),
            "checks": {
                "openai_api": openai_status,
                "src_path": src_path_status
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Analyzer Backend Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "create_analyzer": "/create-analyzer"
        }
    } 

def cleanup_files(component_name: str, route_name: str, base_path: Path):
    """Clean up analyzer files and registry entry"""
    try:
        # Ensure route_name is properly formatted if not provided
        if not route_name:
            route_name = component_name.lower()
        route_name = route_name.lower()

        logger.info(f"Starting cleanup for analyzer: {component_name} ({route_name})")
        logger.info(f"Base path: {base_path}")

        # 1. Clean up analyzer code directory
        analytics_code_path = base_path / "app" / "analyticscode" / route_name
        logger.info(f"Checking analytics code path: {analytics_code_path}")
        if analytics_code_path.exists():
            logger.info(f"Found analyzer code directory at: {analytics_code_path}")
            try:
                shutil.rmtree(analytics_code_path)
                logger.info(f"Successfully removed analyzer code directory")
            except Exception as e:
                logger.error(f"Error removing analyzer code directory: {e}")
                raise

        # 2. Clean up other files
        files_to_cleanup = [
            base_path / "app" / "components" / "analyzers" / f"{component_name}.tsx",  # React component
            base_path / "app" / "config" / "analyzers" / f"{route_name}.json",        # Config file
        ]

        for file_path in files_to_cleanup:
            logger.info(f"Checking file: {file_path}")
            if file_path.exists():
                try:
                    file_path.unlink()
                    logger.info(f"Successfully removed file: {file_path}")
                except Exception as e:
                    logger.error(f"Error removing file {file_path}: {e}")
                    raise

        # 3. Update registry
        registry_path = base_path / "app" / "analyzers" / "registry.json"
        logger.info(f"Checking registry at: {registry_path}")
        if registry_path.exists():
            try:
                # Read current registry
                with open(registry_path, 'r') as f:
                    registry = json.load(f)
                    logger.info(f"Current registry contents: {registry}")
                
                # Remove analyzer entry if exists
                if route_name in registry:
                    removed_entry = registry.pop(route_name)
                    logger.info(f"Removing entry from registry: {removed_entry}")
                    
                    # Write updated registry
                    with open(registry_path, 'w') as f:
                        json.dump(registry, f, indent=2)
                    logger.info(f"Successfully updated registry")
                else:
                    logger.warning(f"No entry found in registry for {route_name}")
            except Exception as e:
                logger.error(f"Error updating registry: {e}")
                raise

        # 4. Update docker-compose services
        docker_compose_path = Path('/app/docker-compose.yml')
        logger.info(f"Checking docker-compose at: {docker_compose_path}")
        if docker_compose_path.exists():
            try:
                with open(docker_compose_path, 'r') as f:
                    compose_config = yaml.safe_load(f)
                
                if route_name in compose_config.get('services', {}):
                    del compose_config['services'][route_name]
                    logger.info(f"Removed service {route_name} from docker-compose.yml")
                    
                    with open(docker_compose_path, 'w') as f:
                        yaml.dump(compose_config, f)
                    logger.info("Successfully updated docker-compose.yml")
                else:
                    logger.warning(f"No service found in docker-compose.yml for {route_name}")
            except Exception as e:
                logger.error(f"Error updating docker-compose.yml: {e}")

        logger.info(f"Cleanup completed for analyzer: {component_name}")
        return True

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        logger.error("Full error traceback:", exc_info=True)
        raise Exception(f"Cleanup failed: {str(e)}")

def generate_typescript_interfaces(outputs: List[Dict[str, Any]]) -> str:
    """Generate TypeScript interfaces from output configuration using JSON mappings"""
    try:
        # Load type mappings from JSON
        type_mappings_path = Path(__file__).parent.parent / "config" / "type_mappings.json"
        with open(type_mappings_path) as f:
            mappings = json.load(f)
            type_mapping = mappings["typeScriptMappings"]

        # Generate interface properties
        interface_props = []
        for output in outputs:
            ts_type = type_mapping.get(output["type"].lower(), "any")
            interface_props.append(f"{output['name']}: {ts_type};")

        return "\n  ".join(interface_props)

    except Exception as e:
        logger.error(f"Error generating TypeScript interfaces: {e}")
        return "// Error generating interfaces" 

def generate_type_conversion_code(inputs: List[Dict[str, Any]]) -> str:
    """Generate code for type conversion based on input configuration"""
    conversion_code = []
    for input_config in inputs:
        if input_config.type.lower() == 'number':
            conversion_code.append(
                "if '{col}' in df.columns:\n"
                "    df['{col}'] = pd.to_numeric(df['{col}'], errors='coerce')"
            )
        elif input_config.type.lower() == 'date':
            conversion_code.append(
                "if '{col}' in df.columns:\n"
                "    df['{col}'] = pd.to_datetime(df['{col}'], errors='coerce')"
            )
    return "\n".join(conversion_code)

def generate_analysis_code(rules: List[Dict[str, Any]]) -> str:
    """Generate analysis code based on rules configuration"""
    analysis_code = []
    for rule in rules:
        if rule.type.lower() == 'calculation':
            analysis_code.append(f"""
# Calculation rule: {rule.description}
try:
    results['calculation'] = df.describe().to_dict()
except Exception as calc_error:
    logger.error(f'Calculation error: {{calc_error}}')
    results['calculation_error'] = str(calc_error)
""")
    
    if not analysis_code:
        return "results['default'] = df.describe().to_dict()"
    
    return "\n".join(analysis_code)

def generate_python_code(component_name: str, route_name: str, config: AnalyzerConfig, base_path: Path):
    """Generate Python implementation for the analyzer"""
    try:
        analytics_dir = base_path / "app" / "analyticscode" / route_name
        
        # Create main.py with detailed implementation
        main_py_content = f'''import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
import pandas as pd
from datetime import datetime
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PandasJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, pd.Series):
            return list(obj)
        if isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        return super().default(obj)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    spreadsheet: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)

class AnalysisResponse(BaseModel):
    results: Dict[str, Any]
    metadata: Dict[str, Any]

    class Config:
        json_encoders = {{
            pd.Series: lambda x: list(x),
            pd.Timestamp: lambda x: x.isoformat()
        }}

def convert_to_dataframe(data: Dict[str, Any]) -> pd.DataFrame:
    """Convert input data to pandas DataFrame."""
    try:
        logger.info(f"Converting input data to DataFrame. Data structure: {{list(data.keys())}}")
        
        if isinstance(data, dict) and "rows" in data:
            rows_data = data["rows"]
            
            if isinstance(rows_data, list) and rows_data and "cells" in rows_data[0]:
                headers = [cell['value'] for cell in rows_data[0]['cells']]
                processed_rows = []
                for row in rows_data[1:]:
                    row_values = [cell['value'] for cell in row['cells']]
                    processed_rows.append(row_values)
                
                df = pd.DataFrame(processed_rows, columns=headers)
                df.columns = df.columns.str.strip()
                
                # Handle data types based on input configuration
                {generate_type_conversion_code(config.structure.inputs)}
                
                return df
            
        raise ValueError("Invalid data structure")
        
    except Exception as e:
        logger.error(f"Failed to convert data to DataFrame: {{str(e)}}")
        raise ValueError(f"Failed to convert data to DataFrame: {{str(e)}}")

def analyze_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyzes data according to configured rules."""
    try:
        results = {{}}
        
        # Implement analysis based on configured rules
        {generate_analysis_code(config.structure.rules)}
        
        return results
    except Exception as e:
        return {{"error": f"Analysis error: {{str(e)}}"}}

@app.get("/info")
async def get_info():
    """Get information about the analyzer service."""
    return {{
        "name": "{config.name}",
        "status": "running",
        "version": "1.0.0"
    }}

@app.get("/health")
async def health_check():
    return {{
        "status": "healthy",
        "service": "{route_name}",
        "timestamp": datetime.now().isoformat()
    }}

@app.post("/analyze")
async def analyze_endpoint(request: AnalysisRequest) -> AnalysisResponse:
    try:
        logger.info("Analyze endpoint called")
        df = convert_to_dataframe(request.spreadsheet)
        results = analyze_data(df)
        
        return AnalysisResponse(
            results=results,
            metadata={{
                "analyzer": "{component_name}",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
                "columns": list(df.columns),
                "row_count": len(df)
            }}
        )
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {{str(e)}}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail={{
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

        # Create requirements.txt
        requirements_txt = """fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
python-dateutil==2.8.2
pandas==2.1.1
numpy==1.24.3
scikit-learn==1.3.0
matplotlib==3.7.1
python-multipart==0.0.6
httpx==0.24.1
"""

        # Create Dockerfile
        dockerfile_content = """FROM python:3.9-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make sure the files are readable and executable
RUN chmod -R 755 /app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""

        # Create Makefile
        makefile_content = """.PHONY: setup run clean

setup:
\tpython -m venv venv
\t. venv/bin/activate && pip install -r requirements.txt

run:
\t. venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

clean:
\trm -rf venv
\tfind . -type f -name "*.pyc" -delete
\tfind . -type d -name "__pycache__" -delete

init: setup
"""

        # Create README.md with proper model serialization
        readme_content = f"""# {config.name} Analyzer API

## Description
{config.systemPrompt.description}

## Analysis Logic
{config.userPrompt}

## Setup

1. Initialize the environment:
   ```bash
   make init
   ```

2. Run the API:
   ```bash
   make run
   ```

## API Endpoints

POST /analyze
- Input: {json.dumps([input.dict() for input in config.structure.inputs], indent=2)}
- Output: {json.dumps([output.dict() for output in config.structure.outputs], indent=2)}

## Development

- Clean environment: `make clean`
- Rebuild environment: `make setup`
- Start server: `make run`

The API will be available at http://localhost:8000
"""

        # Create .gitignore
        gitignore_content = """venv/
__pycache__/
*.pyc
.env
.DS_Store
"""

        # Write all files
        analytics_dir.mkdir(parents=True, exist_ok=True)
        
        files_to_write = {
            "main.py": main_py_content,
            "requirements.txt": requirements_txt,
            "Dockerfile": dockerfile_content,
            "Makefile": makefile_content,
            "README.md": readme_content,
            ".gitignore": gitignore_content
        }
        
        for filename, content in files_to_write.items():
            with open(analytics_dir / filename, "w") as f:
                f.write(content)

        logger.info(f"Generated Python implementation in {analytics_dir}")
        return True

    except Exception as e:
        logger.error(f"Error generating Python code: {e}")
        raise 

@app.delete("/delete-analyzer/{analyzer_name}", response_model=dict)
async def delete_analyzer(analyzer_name: str):
    """Delete an analyzer and its associated files"""
    try:
        logger.info(f"Deleting analyzer: {analyzer_name}")
        base_path = Path(os.getenv('FRONTEND_SRC_PATH', '/app/src'))
        logger.info(f"Using base path: {base_path}")
        
        component_name = f"{analyzer_name}Analyzer"
        route_name = f"{analyzer_name.lower()}Analyzer"
        
        logger.info(f"Component name: {component_name}")
        logger.info(f"Route name: {route_name}")
        
        cleanup_success = cleanup_files(component_name, route_name, base_path)
        
        if cleanup_success:
            return {
                "success": True,
                "message": f"Successfully deleted analyzer {analyzer_name}",
                "details": {
                    "component": component_name,
                    "route": route_name,
                    "base_path": str(base_path)
                }
            }
        else:
            raise Exception("Cleanup did not complete successfully")
            
    except Exception as e:
        logger.error(f"Error deleting analyzer: {e}")
        logger.error("Full error traceback:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 