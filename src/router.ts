import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { Elysia } from 'elysia';

/**
 * Interface for router options
 */
export interface RouterOptions {
  rootDir: string;
  [key: string]: any;
}

/**
 * Interface for route handler
 */
type ElysiaHandler = (context: { request: Request; [key: string]: any }) => any;

export interface RouteHandler {
  get?: ElysiaHandler;
  post?: ElysiaHandler;
  put?: ElysiaHandler;
  delete?: ElysiaHandler;
  [key: string]: ElysiaHandler | undefined;
}

export class Router {
  public app: Elysia;
  public options: RouterOptions;
  public routes: Map<string, RouteHandler | ElysiaHandler>;

  constructor(app: Elysia, options: RouterOptions = { rootDir: process.cwd() }) {
    this.app = app;
    this.options = options;
    this.routes = new Map();
  }

  async scanRoutes(): Promise<void> {
    const { rootDir } = this.options;
    
    try {
      // Find all route files
      const routeFiles = await glob('app/routes/**/*.{js,ts}', {
        cwd: rootDir,
        absolute: true
      });

      // Process each route file
      for (const filePath of routeFiles) {
        await this.registerRouteFile(filePath);
      }

      console.log(`🛣️ Registered ${this.routes.size} routes`);
    } catch (error) {
      console.error('Error scanning routes:', error);
    }
  }

  async registerRouteFile(filePath: string): Promise<void> {
    try {
      // Get route path from file path
      const routePath = this.getRoutePathFromFile(filePath);
      
      // Import route module
      const routeModule = await import(filePath);
      const routeHandler = routeModule.default;
      
      if (typeof routeHandler !== 'function' && typeof routeHandler !== 'object') {
        console.warn(`Invalid route handler in ${filePath}`);
        return;
      }
      
      // Register route
      this.routes.set(routePath, routeHandler);
      
      // Register route with Elysia
      this.registerWithElysia(routePath, routeHandler);
      
      console.log(`📍 Registered route: ${routePath}`);
    } catch (error) {
      console.error(`Error registering route ${filePath}:`, error);
    }
  }

  getRoutePathFromFile(filePath: string): string {
    const { rootDir } = this.options;
    
    // Remove root directory and 'app/routes' prefix
    let routePath = filePath
      .replace(path.join(rootDir, 'app/routes'), '')
      .replace(/\\/g, '/'); // Normalize path separators
    
    // Remove file extension
    routePath = routePath.replace(/\.(js|ts)$/, '');
    
    // Handle index routes
    routePath = routePath.replace(/\/index$/, '/');
    
    // Handle root route
    if (routePath === '') {
      routePath = '/';
    }
    
    // Handle dynamic routes
    routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
    
    return routePath;
  }

  registerWithElysia(routePath: string, handler: RouteHandler | ElysiaHandler): void {
    // If handler is a function, treat it as a GET handler
    if (typeof handler === 'function') {
      this.app.get(routePath, handler);
      return;
    }
    
    // Register GET handler
    if (handler.get) {
      this.app.get(routePath, handler.get);
    }
    
    // Register POST handler
    if (handler.post) {
      this.app.post(routePath, handler.post);
    }
    
    // Register PUT handler
    if (handler.put) {
      this.app.put(routePath, handler.put);
    }
    
    // Register DELETE handler
    if (handler.delete) {
      this.app.delete(routePath, handler.delete);
    }
  }
}

export default Router;
