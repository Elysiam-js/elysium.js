import { Elysia } from 'elysia';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ComponentManager } from './component-manager.js';
import { Router } from './router.js';
import { MiddlewareManager } from './middleware-manager.js';
import { PluginManager, createPlugin, PluginDefinition, PluginOptions } from './plugin-manager.js';
import { setupDevServer } from './dev-server.js';
import { setupBuildProcess } from './build.js';
import { loadConfig } from './config.js';
import { exists, readFile, getContentType } from './utils/file-utils.js';
import { formatError, ElysiumError } from './utils/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Interface for ElysiumJS options
 */
export interface ElysiumJSOptions {
  root?: string;
  port?: number;
  mode?: 'development' | 'production';
  [key: string]: any;
}

/**
 * Interface for ElysiumJS configuration
 */
export interface ElysiumConfig {
  server: {
    port: number;
    host: string;
    [key: string]: any;
  };
  static: {
    dir: string;
    prefix: string;
    [key: string]: any;
  };
  mode: 'development' | 'production';
  [key: string]: any;
}

export class ElysiumJS {
  public rootDir: string;
  public config: ElysiumConfig;
  public app: Elysia;
  public componentManager: ComponentManager;
  public router: Router;
  public middlewareManager: MiddlewareManager;
  public pluginManager: PluginManager;

  constructor(options: ElysiumJSOptions = {}) {
    this.rootDir = options.root || process.cwd();
    
    // Load configuration
    this.config = { ...loadConfig(this.rootDir), mode: 'development' };
    
    // Override config with options
    this.config = {
      ...this.config,
      server: {
        ...this.config.server,
        port: options.port || 3001,
        host: 'localhost'
      },
      mode: options.mode || 'development'
    };
    
    // Initialize Elysia app
    this.app = new Elysia();

    // Add error handling
    this.app.onError(({ code, error }) => {
      console.error(formatError(error));
      
      if (code === 'VALIDATION') {
        return new Response(JSON.stringify({
          error: error.message,
          code: code,
          details: error.validator?.Errors(error.value)?.First()?.message
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (error instanceof ElysiumError) {
        return new Response(JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      return new Response(JSON.stringify({
        error: error.message,
        code: code
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
    
    // Initialize component manager
    this.componentManager = new ComponentManager(this.rootDir);
    
    // Initialize router
    this.router = new Router(this.app, {
      rootDir: this.rootDir
    });
    
    // Initialize middleware manager
    this.middlewareManager = new MiddlewareManager(this.app);
    
    // Initialize plugin manager
    this.pluginManager = new PluginManager(this.app);
    
    console.log(`🌟 ElysiumJS initializing in ${this.config.mode} mode`);
  }

  async init(): Promise<ElysiumJS> {
    try {
      // Execute beforeInit hooks
      await this.pluginManager.executeHook('beforeInit', { app: this });
      
      // Set up default middleware
      this.setupDefaultMiddleware();
      
      // Execute beforeComponentRegistration hooks
      await this.pluginManager.executeHook('beforeComponentRegistration', { 
        componentManager: this.componentManager 
      });
      
      // Initialize component manager
      await this.componentManager.scanComponents();
      
      // Execute afterComponentRegistration hooks
      await this.pluginManager.executeHook('afterComponentRegistration', { 
        componentManager: this.componentManager 
      });
      
      // Set up static file serving
      this.setupStaticFiles();
      
      // Execute beforeRouteRegistration hooks
      await this.pluginManager.executeHook('beforeRouteRegistration', { 
        router: this.router 
      });
      
      // Scan and register routes
      await this.router.scanRoutes();
      
      // Execute afterRouteRegistration hooks
      await this.pluginManager.executeHook('afterRouteRegistration', { 
        router: this.router 
      });
      
      // Set up default routes
      this.setupDefaultRoutes();
      
      // Execute afterInit hooks
      await this.pluginManager.executeHook('afterInit', { app: this });
      
      return this;
    } catch (error) {
      console.error(formatError(error as Error));
      throw error;
    }
  }
  
  /**
   * Set up default middleware for the application
   */
  setupDefaultMiddleware(): void {
    // Add request logging middleware in development mode
    if (this.config.mode === 'development') {
      this.middlewareManager.use((app) => {
        app.onRequest(({ request }) => {
          const url = new URL(request.url);
          console.log(`${request.method} ${url.pathname}`);
        });
        return app;
      });
    }
    
    // Add CORS middleware
    this.middlewareManager.use((app) => {
      app.onRequest(({ request, set }) => {
        set.headers['Access-Control-Allow-Origin'] = '*';
        set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204 });
        }
      });
      return app;
    });
    
    // Add HTML helper to the context
    this.app.derive(({ request }) => {
      return {
        html: (content: string) => {
          // Process components in HTML content
          const processedContent = this.componentManager.processHtml(content);
          
          return new Response(processedContent, {
            headers: {
              'Content-Type': 'text/html'
            }
          });
        }
      };
    });
    
    console.log('🔌 Default middleware configured');
  }

  setupStaticFiles(): void {
    // Set up public directory for static files
    const publicDir = path.join(this.rootDir, 'public');
    
    // Create public directory if it doesn't exist
    if (!exists(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Copy HTMX to public directory if it doesn't exist
    const htmxPath = path.join(publicDir, 'htmx.min.js');
    if (!exists(htmxPath)) {
      const sourceHtmx = path.join(__dirname, '../node_modules/htmx.org/dist/htmx.min.js');
      // If htmx.org is not installed, use a bundled version
      const bundledHtmx = path.join(__dirname, '../assets/htmx.min.js');
      
      if (exists(sourceHtmx)) {
        fs.copyFileSync(sourceHtmx, htmxPath);
      } else if (exists(bundledHtmx)) {
        fs.copyFileSync(bundledHtmx, htmxPath);
      } else {
        console.warn('HTMX library not found. Please install htmx.org or provide it manually.');
      }
    }
    
    // Create elysium directory for framework assets
    const elysiumDir = path.join(publicDir, 'elysium');
    if (!exists(elysiumDir)) {
      fs.mkdirSync(elysiumDir, { recursive: true });
    }
    
    // Serve static files from public directory
    this.app.get('/*', ({ request }) => {
      const url = new URL(request.url);
      const filePath = path.join(publicDir, url.pathname);
      
      if (exists(filePath) && fs.statSync(filePath).isFile()) {
        return new Response(fs.readFileSync(filePath), {
          headers: {
            'Content-Type': getContentType(filePath)
          }
        });
      }
      
      // If the path doesn't match a file, let it fall through to other routes
      return;
    });
    
    console.log(`📁 Static files configured at /public`);
  }

  setupDefaultRoutes(): void {
    // Add component styles endpoint
    this.app.get('/elysium/styles.css', () => {
      const styles = this.componentManager.getAllStyles();
      
      return new Response(styles, {
        headers: {
          'Content-Type': 'text/css'
        }
      });
    });
    
    // Add framework info endpoint
    this.app.get('/elysium/info', () => {
      return {
        name: 'ElysiumJS',
        version: '0.1.0',
        mode: this.config.mode,
        components: Array.from(this.componentManager.components.keys()),
        routes: Array.from(this.router.routes.keys()),
        plugins: Array.from(this.pluginManager.plugins.keys()),
        middlewares: this.middlewareManager.getAll().length
      };
    });
    
    // Fallback route for serving index.html if no route matches
    this.app.get('*', ({ request }) => {
      // Check if route is handled by the router
      if (this.router.routes.has(new URL(request.url).pathname)) {
        return;
      }
      
      // Try to serve index.html from public directory
      const indexPath = path.join(this.rootDir, 'public/index.html');
      
      if (exists(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const processedContent = this.componentManager.processHtml(content);
        return new Response(processedContent, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response('Page not found', { status: 404 });
    });
    
    console.log('🛣️ Default routes configured');
  }

  start(): Promise<any> {
    const { port, host } = this.config.server;
    
    console.log(`🚀 ElysiumJS server starting at http://${host}:${port}`);
    const server = this.app.listen({
      port,
      hostname: host
    });
    return Promise.resolve(server);
  }

  /**
   * Register a middleware function
   * @param middleware - Middleware function
   * @returns This instance for chaining
   */
  use(middleware: (app: Elysia) => Elysia): ElysiumJS {
    this.middlewareManager.use(middleware);
    return this;
  }

  /**
   * Register multiple middleware functions
   * @param middlewares - Array of middleware functions
   * @returns This instance for chaining
   */
  useMany(middlewares: ((app: Elysia) => Elysia)[]): ElysiumJS {
    for (const middleware of middlewares) {
      this.use(middleware);
    }
    return this;
  }
  
  /**
   * Register a plugin
   * @param name - Plugin name
   * @param plugin - Plugin object
   * @param options - Plugin options
   * @returns This instance for chaining
   */
  async registerPlugin(name: string, plugin: PluginDefinition, options: PluginOptions = {}): Promise<ElysiumJS> {
    await this.pluginManager.register(name, plugin, options);
    return this;
  }
  
  /**
   * Check if a plugin is registered
   * @param name - Plugin name
   * @returns True if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.hasPlugin(name);
  }
  
  /**
   * Get a registered plugin
   * @param name - Plugin name
   * @returns Plugin object or null if not found
   */
  getPlugin(name: string): PluginDefinition | null {
    return this.pluginManager.getPlugin(name);
  }

  static async dev(options: ElysiumJSOptions = {}): Promise<ElysiumJS> {
    try {
      const server = new ElysiumJS({
        ...options,
        mode: 'development'
      });
      
      await server.init();
      
      // Set up development server with hot reloading
      setupDevServer(server);
      
      return server.start();
    } catch (error) {
      console.error(formatError(error as Error));
      throw error;
    }
  }

  static async build(options: ElysiumJSOptions = {}): Promise<ElysiumJS> {
    try {
      const server = new ElysiumJS({
        ...options,
        mode: 'production'
      });
      
      await server.init();
      
      // Set up build process
      await setupBuildProcess(server);
      
      return server;
    } catch (error) {
      console.error(formatError(error as Error));
      throw error;
    }
  }
}

export default ElysiumJS;
