/**
 * Middleware Manager for ElysiumJS
 * Handles registration and execution of middleware
 */

import { Elysia } from 'elysia';

/**
 * Interface for middleware options
 */
export interface MiddlewareOptions {
  [key: string]: any;
}

/**
 * Interface for middleware item
 */
type ElysiaMiddleware = (app: Elysia) => Elysia;

export interface MiddlewareItem {
  middleware: ElysiaMiddleware;
  options: MiddlewareOptions;
}

export class MiddlewareManager {
  private app: Elysia;
  private middlewares: MiddlewareItem[];

  constructor(app: Elysia) {
    this.app = app;
    this.middlewares = [];
  }

  /**
   * Register a middleware function
   * @param middleware - Middleware function
   * @param options - Middleware options
   * @returns This instance for chaining
   */
  use(middleware: ElysiaMiddleware, options: MiddlewareOptions = {}): MiddlewareManager {
    this.middlewares.push({ middleware, options });
    
    // Register with Elysia
    this.app.use(middleware);
    
    return this;
  }

  /**
   * Register multiple middleware functions
   * @param middlewares - Array of middleware functions
   * @returns This instance for chaining
   */
  useMany(middlewares: ElysiaMiddleware[]): MiddlewareManager {
    for (const middleware of middlewares) {
      this.use(middleware);
    }
    
    return this;
  }

  /**
   * Get all registered middlewares
   * @returns Array of registered middlewares
   */
  getAll(): MiddlewareItem[] {
    return this.middlewares;
  }
}

export default MiddlewareManager;
