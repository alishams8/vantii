import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as YAML from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { name, componentName } = await request.json();
    const registryPath = path.join(process.cwd(), 'src', 'app', 'analyzers', 'registry.json');
    const localStoragePath = path.join(process.cwd(), 'localStorage.json');
    const analyticsCodePath = path.join(process.cwd(), 'src', 'app', 'analyticscode');
    const componentsAnalyzersPath = path.join(process.cwd(), 'src', 'app', 'components', 'analyzers');
    const analyzersPath = path.join(process.cwd(), 'src', 'app', 'config', 'analyzers');

    // Create the registry key format (lowercase name + analyzer)
    const registryKey = name.toLowerCase() + 'analyzer';

    // Stop and remove the Docker service first
    try {
      console.log(`Stopping Docker service: ${registryKey}`);
      // Stop the specific service
      await execAsync(`docker-compose stop ${registryKey}`);
      console.log(`Service ${registryKey} stopped`);

      // Remove the container
      await execAsync(`docker-compose rm -f ${registryKey}`);
      console.log(`Service ${registryKey} container removed`);

      // Remove the image (optional, but helps keep system clean)
      const imageNameBase = registryKey.replace(/[^a-zA-Z0-9]/g, '');
      await execAsync(`docker rmi $(docker images | grep ${imageNameBase} | awk '{print $3}')`)
        .catch(err => console.log('No existing image to remove'));
      
      console.log(`Docker service ${registryKey} cleanup completed`);
    } catch (error) {
      console.error('Error cleaning up Docker service:', error);
      // Continue with deletion even if Docker cleanup fails
    }

    // Remove from localStorage.json
    if (fs.existsSync(localStoragePath)) {
      const localStorageContent = fs.readFileSync(localStoragePath, 'utf8');
      try {
        let analyzers = JSON.parse(localStorageContent);
        analyzers = analyzers.filter((analyzer: any) => 
          analyzer.name.toLowerCase() !== name.toLowerCase()
        );
        fs.writeFileSync(localStoragePath, JSON.stringify(analyzers, null, 2));
        console.log(`Deleted analyzer ${name} from localStorage.json`);
      } catch (error) {
        console.error('Error updating localStorage.json:', error);
      }
    }

    // Remove service from docker-compose.yml
    try {
      const composePath = path.join(process.cwd(), 'docker-compose.yml');
      if (fs.existsSync(composePath)) {
        const composeContent = fs.readFileSync(composePath, 'utf8');
        const compose = YAML.parse(composeContent);

        if (compose.services && compose.services[registryKey]) {
          delete compose.services[registryKey];
          fs.writeFileSync(composePath, YAML.stringify(compose));
          console.log(`Removed service ${registryKey} from docker-compose.yml`);
        }
      }
    } catch (error) {
      console.error('Error updating docker-compose.yml:', error);
    }

    // Update registry
    if (fs.existsSync(registryPath)) {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      let registry = JSON.parse(registryContent);
      
      if (registry[registryKey]) {
        delete registry[registryKey];
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
        console.log(`Deleted analyzer ${registryKey} from registry`);
      }
    }

    // Delete JSON files from analyzers directory
    const analyzerJsonFiles = fs.readdirSync(analyzersPath)
      .filter(file => 
        file.toLowerCase().includes(name.toLowerCase()) && 
        file.endsWith('.json') && 
        file !== 'registry.json'
      );

    for (const jsonFile of analyzerJsonFiles) {
      const jsonFilePath = path.join(analyzersPath, jsonFile);
      if (fs.existsSync(jsonFilePath)) {
        fs.unlinkSync(jsonFilePath);
        console.log(`Deleted analyzer JSON file: ${jsonFilePath}`);
      }
    }

    // Delete the analyzer folder from analyticscode directory
    const analyzerFolderPath = path.join(analyticsCodePath, registryKey);
    if (fs.existsSync(analyzerFolderPath)) {
      fs.rmSync(analyzerFolderPath, { recursive: true, force: true });
      console.log(`Deleted analyzer folder: ${analyzerFolderPath}`);
    }

    // Delete analyzer component file
    const componentFileName = `${registryKey}.tsx`;
    const componentFilePath = path.join(componentsAnalyzersPath, componentFileName);
    if (fs.existsSync(componentFilePath)) {
      fs.unlinkSync(componentFilePath);
      console.log(`Deleted analyzer component: ${componentFilePath}`);
    }

    // Restart remaining analyzer services
    try {
      console.log('Restarting remaining analyzer services...');
      const { stdout: services } = await execAsync('docker-compose ps --services');
      const remainingAnalyzers = services
        .trim()
        .split('\n')
        .filter(service => service.includes('analyzer'))
        .filter(Boolean);

      if (remainingAnalyzers.length > 0) {
        const servicesString = remainingAnalyzers.join(' ');
        await execAsync(`docker-compose up -d ${servicesString}`);
        console.log('Remaining analyzer services restarted successfully');
      } else {
        console.log('No remaining analyzer services to restart');
      }
    } catch (error) {
      console.error('Error restarting remaining services:', error);
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully deleted analyzer ${name} and its associated files and service`
    });
  } catch (error) {
    console.error('Error in delete-analyzer:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 