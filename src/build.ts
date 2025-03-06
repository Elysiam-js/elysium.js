import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { ElysiumJS } from './index.js';

/**
 * Interface for build process result
 */
export interface BuildResult {
  outputDir: string;
}

/**
 * Set up the build process for production deployment
 * @param server - ElysiumJS server instance
 * @returns Promise that resolves with the build result
 */
export async function setupBuildProcess(server: ElysiumJS): Promise<BuildResult> {
  const { rootDir } = server.componentManager;
  const outputDir = path.join(rootDir, 'dist');
  
  console.log('🏗️ Building project...');
  
  // Create output directory
  fs.ensureDirSync(outputDir);
  
  // Process HTML files
  await processHtmlFiles(server, rootDir, outputDir);
  
  // Copy static assets
  await copyStaticAssets(server, rootDir, outputDir);
  
  console.log('✅ Build completed successfully!');
  
  return {
    outputDir
  };
}

/**
 * Process HTML files by replacing component tags
 * @param server - ElysiumJS server instance
 * @param rootDir - Root directory of the project
 * @param outputDir - Output directory for processed files
 */
async function processHtmlFiles(server: ElysiumJS, rootDir: string, outputDir: string): Promise<void> {
  // Find all HTML files
  const htmlFiles = globSync('app/**/*.html', {
    cwd: rootDir,
    ignore: ['app/components/**']
  });
  
  for (const filePath of htmlFiles) {
    const inputPath = path.join(rootDir, filePath);
    const outputPath = path.join(outputDir, filePath.replace(/^app\//, ''));
    
    // Create directory if it doesn't exist
    fs.ensureDirSync(path.dirname(outputPath));
    
    // Read HTML file
    const content = fs.readFileSync(inputPath, 'utf-8');
    
    // Process components
    const processedContent = server.componentManager.processHtml(content);
    
    // Write processed HTML file
    fs.writeFileSync(outputPath, processedContent);
    
    console.log(`📝 Processed HTML file: ${filePath}`);
  }
}

/**
 * Copy static assets to the output directory
 * @param server - ElysiumJS server instance
 * @param rootDir - Root directory of the project
 * @param outputDir - Output directory for static assets
 */
async function copyStaticAssets(server: ElysiumJS, rootDir: string, outputDir: string): Promise<void> {
  // Copy CSS files
  const cssFiles = globSync('app/**/*.css', {
    cwd: rootDir,
    ignore: ['app/components/**']
  });
  
  for (const filePath of cssFiles) {
    const inputPath = path.join(rootDir, filePath);
    const outputPath = path.join(outputDir, filePath.replace(/^app\//, ''));
    
    // Create directory if it doesn't exist
    fs.ensureDirSync(path.dirname(outputPath));
    
    // Copy CSS file
    fs.copyFileSync(inputPath, outputPath);
    
    console.log(`📝 Copied CSS file: ${filePath}`);
  }
  
  // Copy public directory
  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    fs.copySync(publicDir, path.join(outputDir, 'public'));
    console.log('📝 Copied public directory');
  }
  
  // Create component styles file
  const stylesContent = server.componentManager.getAllStyles();
  fs.ensureDirSync(path.join(outputDir, 'elysium'));
  fs.writeFileSync(path.join(outputDir, 'elysium/styles.css'), stylesContent);
  console.log('📝 Created component styles file');
}

export default setupBuildProcess;
