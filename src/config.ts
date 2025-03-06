import fs from 'fs';
import path from 'path';
import { exists, readFile } from './utils/file-utils.js';

/**
 * Interface for server configuration
 */
export interface ServerConfig {
  port: number;
  host: string;
  [key: string]: any;
}

/**
 * Interface for build configuration
 */
export interface BuildConfig {
  outDir: string;
  minify: boolean;
  sourcemap: boolean;
  [key: string]: any;
}

/**
 * Interface for components configuration
 */
export interface ComponentsConfig {
  dir: string;
  extension: string;
  [key: string]: any;
}

/**
 * Interface for routes configuration
 */
export interface RoutesConfig {
  dir: string;
  [key: string]: any;
}

/**
 * Interface for static files configuration
 */
export interface StaticConfig {
  dir: string;
  prefix: string;
  [key: string]: any;
}

/**
 * Interface for ElysiumJS configuration
 */
export interface ElysiumConfig {
  server: ServerConfig;
  build: BuildConfig;
  components: ComponentsConfig;
  routes: RoutesConfig;
  static: StaticConfig;
  [key: string]: any;
}

/**
 * Default configuration for ElysiumJS
 */
const defaultConfig: ElysiumConfig = {
  // Server configuration
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    minify: true,
    sourcemap: false
  },
  
  // Component configuration
  components: {
    dir: 'app/components',
    extension: '.els'
  },
  
  // Routes configuration
  routes: {
    dir: 'app/routes'
  },
  
  // Static files configuration
  static: {
    dir: 'public',
    prefix: '/public'
  }
};

/**
 * Load and merge configuration from file
 * @param rootDir - Root directory of the project
 * @returns Merged configuration
 */
export function loadConfig(rootDir: string): ElysiumConfig {
  const configPath = path.join(rootDir, 'elysium.config.js');
  
  // Check if config file exists
  if (exists(configPath)) {
    try {
      // Import config file
      const userConfig = require(configPath);
      
      // Merge with default config
      return mergeConfig(defaultConfig, userConfig);
    } catch (error: any) {
      console.warn(`Error loading config file: ${error.message}`);
    }
  }
  
  // Return default config if no config file found
  return { ...defaultConfig };
}

/**
 * Merge two configuration objects
 * @param defaultConfig - Default configuration
 * @param userConfig - User configuration
 * @returns Merged configuration
 */
function mergeConfig(defaultConfig: ElysiumConfig, userConfig: Partial<ElysiumConfig>): ElysiumConfig {
  const result = { ...defaultConfig };
  
  // Merge top-level properties
  for (const [key, value] of Object.entries(userConfig)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Merge nested objects
      result[key] = mergeConfig(result[key] || {}, value);
    } else {
      // Replace primitive values
      result[key] = value;
    }
  }
  
  return result;
}

export default {
  loadConfig,
  defaultConfig
};
