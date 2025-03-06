import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { ElysiumJS } from './index.js';

/**
 * Interface for dev server watchers
 */
export interface DevServerWatchers {
  componentWatcher: chokidar.FSWatcher;
  htmlWatcher: chokidar.FSWatcher;
  cssWatcher: chokidar.FSWatcher;
  close: () => void;
}

/**
 * Set up development server with file watchers for hot reloading
 * @param server - ElysiumJS server instance
 * @returns Object containing file watchers
 */
export function setupDevServer(server: ElysiumJS): DevServerWatchers {
  const { rootDir } = server.componentManager;
  
  // Watch for changes in component files
  const componentWatcher = chokidar.watch('app/components/**/*.els', {
    cwd: rootDir,
    ignoreInitial: true
  });
  
  componentWatcher.on('add', async (filePath) => {
    console.log(`🔄 Component added: ${filePath}`);
    await server.componentManager.loadComponent(path.join(rootDir, filePath));
  });
  
  componentWatcher.on('change', async (filePath) => {
    console.log(`🔄 Component changed: ${filePath}`);
    await server.componentManager.loadComponent(path.join(rootDir, filePath));
  });
  
  componentWatcher.on('unlink', (filePath) => {
    // Get component name from file path
    const componentName = path.basename(filePath, '.els');
    
    // Remove component from manager
    server.componentManager.components.delete(componentName);
    server.componentManager.styles.delete(componentName);
    
    console.log(`🔄 Component removed: ${componentName}`);
  });
  
  // Watch for changes in HTML files
  const htmlWatcher = chokidar.watch('app/**/*.html', {
    cwd: rootDir,
    ignoreInitial: true
  });
  
  htmlWatcher.on('change', (filePath) => {
    console.log(`🔄 HTML file changed: ${filePath}`);
  });
  
  // Watch for changes in CSS files
  const cssWatcher = chokidar.watch('app/**/*.css', {
    cwd: rootDir,
    ignoreInitial: true
  });
  
  cssWatcher.on('change', (filePath) => {
    console.log(`🔄 CSS file changed: ${filePath}`);
  });
  
  console.log('🔍 Watching for file changes...');
  
  return {
    componentWatcher,
    htmlWatcher,
    cssWatcher,
    close: () => {
      componentWatcher.close();
      htmlWatcher.close();
      cssWatcher.close();
    }
  };
}

export default setupDevServer;
