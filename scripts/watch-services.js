const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');

// Watch for changes in registry.json
const registryPath = path.join(process.cwd(), 'src', 'app', 'analyzers', 'registry.json');
const composePath = path.join(process.cwd(), 'docker-compose.yml');
const analyticsCodePath = path.join(process.cwd(), 'src', 'app', 'analyticscode');

// Function to add service to docker-compose
function addServiceToCompose(analyzer, compose) {
  compose.services[analyzer] = {
    build: {
      context: `src/app/analyticscode/${analyzer}`,
      dockerfile: 'Dockerfile'
    },
    networks: ['analyzer-network'],
    volumes: [
      `./src/app/analyticscode/${analyzer}:/app:ro`
    ],
    environment: [
      `SERVICE_NAME=${analyzer}`,
      'SERVICE_PORT=8000',
      'PYTHONPATH=/app'
    ],
    user: '${DOCKER_UID}:${DOCKER_GID}',
    restart: 'unless-stopped',
    healthcheck: {
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"],
      interval: "30s",
      timeout: "10s",
      retries: 3,
      start_period: "20s"
    }
  };
  return compose;
}

// Function to verify analyzer files with timeout
async function verifyAnalyzerFiles(analyzerPath, timeout = 30000) {
  const requiredFiles = ['Dockerfile', 'main.py', 'requirements.txt'];
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const allFilesExist = requiredFiles.every(file => {
      const exists = fs.existsSync(path.join(analyzerPath, file));
      if (!exists) {
        console.log(`Waiting for ${file} in ${analyzerPath}... (${Math.round((timeout - (Date.now() - startTime))/1000)}s remaining)`);
      }
      return exists;
    });

    if (allFilesExist) {
      console.log(`All required files found for ${path.basename(analyzerPath)}`);
      
      // Read and update docker-compose.yml
      try {
        const composeContent = fs.readFileSync(composePath, 'utf8');
        let compose = yaml.parse(composeContent);
        const analyzer = path.basename(analyzerPath);
        
        compose = addServiceToCompose(analyzer, compose);
        fs.writeFileSync(composePath, yaml.stringify(compose));
        console.log(`Added ${analyzer} to docker-compose.yml`);
        
        return true;
      } catch (error) {
        console.error('Error updating docker-compose.yml:', error);
        return false;
      }
    }

    // Wait for 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Timeout waiting for files in ${analyzerPath}`);
  return false;
}

// Function to start specific service
function startService(serviceName) {
  return new Promise((resolve, reject) => {
    console.log(`Starting service: ${serviceName}`);
    exec(`docker-compose up -d --build ${serviceName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting ${serviceName}:`, error);
        reject(error);
        return;
      }
      console.log(`Service ${serviceName} started:`, stdout);
      if (stderr) console.error(`${serviceName} stderr:`, stderr);
      resolve(stdout);
    });
  });
}

// Function to sync docker-compose with registry
function syncDockerComposeWithRegistry(registry, compose) {
  const CORE_SERVICES = ['gateway', 'backend'];
  const registeredAnalyzers = Object.keys(registry);
  // Filter out core services when checking current services
  const currentServices = Object.keys(compose.services)
    .filter(s => !CORE_SERVICES.includes(s));
  
  const servicesToRemove = currentServices.filter(service => !registeredAnalyzers.includes(service));
  const servicesToAdd = registeredAnalyzers.filter(analyzer => !currentServices.includes(analyzer));

  console.log('Registered analyzers:', registeredAnalyzers);
  console.log('Current services (excluding core):', currentServices);
  console.log('Services to remove:', servicesToRemove);
  console.log('Services to add:', servicesToAdd);

  return { servicesToRemove, servicesToAdd };
}

// Function to stop and remove a service
function stopAndRemoveService(serviceName) {
  return new Promise((resolve, reject) => {
    console.log(`Stopping and removing service: ${serviceName}`);
    // Chain commands to ensure complete cleanup
    const commands = [
      `docker-compose stop ${serviceName}`,
      `docker-compose rm -f ${serviceName}`,
      // Force remove any containers with the service name
      `docker ps -q -f name=${serviceName} | xargs -r docker rm -f`,
      // Remove any related images
      `docker images -q *${serviceName}* | xargs -r docker rmi -f`
    ].join(' && ');

    exec(commands, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error stopping ${serviceName}:`, error);
        reject(error);
        return;
      }
      console.log(`Service ${serviceName} stopped and removed:`, stdout);
      if (stderr) console.error(`${serviceName} stderr:`, stderr);
      resolve(stdout);
    });
  });
}

console.log('Watching for analyzer registry changes...');

const watcher = chokidar.watch(registryPath, {
  persistent: true,
  ignoreInitial: true
});

let debounceTimer;

watcher.on('change', async (filePath) => {
  console.log('Registry changed. Checking analyzers...');
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      const registry = JSON.parse(registryContent);
      
      const composeContent = fs.readFileSync(composePath, 'utf8');
      const compose = yaml.parse(composeContent);

      const { servicesToRemove, servicesToAdd } = syncDockerComposeWithRegistry(registry, compose);

      // Remove services
      for (const service of servicesToRemove) {
        if (compose.services[service]) {
          try {
            // First stop and remove the service
            await stopAndRemoveService(service);
            // Then remove it from the compose file
            delete compose.services[service];
            console.log(`Removed service ${service} from docker-compose.yml`);
            // Write updated compose file
            fs.writeFileSync(composePath, yaml.stringify(compose));
          } catch (error) {
            console.error(`Error removing service ${service}:`, error);
          }
        }
      }

      // Add new services
      for (const analyzer of servicesToAdd) {
        const analyzerPath = path.join(analyticsCodePath, analyzer);
        console.log(`Checking files for ${analyzer} at ${analyzerPath}`);
        
        if (fs.existsSync(analyzerPath)) {
          console.log(`Waiting for all required files for ${analyzer}...`);
          await verifyAnalyzerFiles(analyzerPath);
        }
      }

      // Start services that were successfully added
      for (const service of servicesToAdd) {
        try {
          await startService(service);
        } catch (error) {
          console.error(`Failed to start ${service}:`, error);
        }
      }

    } catch (error) {
      console.error('Error processing registry changes:', error);
    }
  }, 1000);
});

// Handle script termination
process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
}); 