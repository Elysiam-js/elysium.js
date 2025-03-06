/**
 * Plugin Manager for ElysiumJS
 * Handles registration and execution of plugins
 */

import type { Elysia } from 'elysia';
import { ElysiumError } from './utils/error-handler.js';

/**
 * Interface for plugin options
 */
export interface PluginOptions {
  [key: string]: any;
}

/**
 * Interface for plugin hooks
 */
export interface PluginHooks {
  beforeInit?: (context: { app: Elysia }) => Promise<void> | void;
  afterInit?: (context: { app: Elysia }) => Promise<void> | void;
  beforeRouteRegistration?: (context: { router: any }) => Promise<void> | void;
  afterRouteRegistration?: (context: { router: any }) => Promise<void> | void;
  beforeComponentRegistration?: (context: { componentManager: any }) => Promise<void> | void;
  afterComponentRegistration?: (context: { componentManager: any }) => Promise<void> | void;
  beforeRequest?: (context: { request: Request }) => Promise<void> | void;
  afterRequest?: (context: { request: Request; response: Response }) => Promise<void> | void;
  [hookName: string]: ((context: any) => Promise<void> | void) | undefined;
}

/**
 * Interface for plugin definition
 */
export interface PluginDefinition {
  name?: string;
  version?: string;
  description?: string;
  init?: (app: Elysia, options: PluginOptions) => void | Promise<void>;
  hooks?: PluginHooks;
  [key: string]: any;
}

/**
 * Interface for stored plugin
 */
export interface StoredPlugin {
  plugin: PluginDefinition;
  options: PluginOptions;
}

/**
 * Type for hook functions
 */
export type HookFunction = (context: any) => Promise<void> | void;

/**
 * Interface for hooks collection
 */
export interface HooksCollection {
  [hookName: string]: HookFunction[];
}

export class PluginManager {
  private app: Elysia;
  public plugins: Map<string, StoredPlugin>;
  private hooks: HooksCollection;

  constructor(app: Elysia) {
    this.app = app;
    this.plugins = new Map();
    this.hooks = {
      beforeInit: [],
      afterInit: [],
      beforeRouteRegistration: [],
      afterRouteRegistration: [],
      beforeComponentRegistration: [],
      afterComponentRegistration: [],
      beforeRequest: [],
      afterRequest: []
    };
  }

  /**
   * Register a plugin
   * @param name - Plugin name
   * @param plugin - Plugin object
   * @param options - Plugin options
   * @returns This instance for chaining
   */
  async register(name: string, plugin: PluginDefinition, options: PluginOptions = {}): Promise<PluginManager> {
    if (this.plugins.has(name)) {
      throw new ElysiumError(
        `Plugin '${name}' is already registered`,
        'PLUGIN_ALREADY_REGISTERED',
        { name }
      );
    }

    // Store plugin with options
    this.plugins.set(name, { plugin, options });

    // Register hooks if provided
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        if (this.hooks[hookName] && hookFn) {
          this.hooks[hookName].push(hookFn);
        }
      }
    }

    // Initialize plugin if it has an init method
    if (typeof plugin.init === 'function') {
      try {
        const result = plugin.init(this.app, options);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        throw new ElysiumError(
          `Failed to initialize plugin '${name}'`,
          'PLUGIN_INIT_ERROR',
          { name, error: error instanceof Error ? error.message : String(error) }
        );
      }
    }

    return this;
  }

  /**
   * Get a registered plugin
   * @param name - Plugin name
   * @returns Plugin object or null if not found
   */
  getPlugin(name: string): PluginDefinition | null {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.plugin : null;
  }

  /**
   * Check if a plugin is registered
   * @param name - Plugin name
   * @returns True if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Execute hooks for a specific hook point
   * @param hookName - Name of the hook to execute
   * @param context - Context object to pass to hook functions
   * @returns Promise that resolves when all hooks are executed
   */
  async executeHook(hookName: string, context: any = {}): Promise<void> {
    if (!this.hooks[hookName]) {
      return;
    }

    for (const hook of this.hooks[hookName]) {
      await hook({ ...context, app: this.app });
    }
  }

  /**
   * Get all registered plugins
   * @returns Map of registered plugins
   */
  getAllPlugins(): Map<string, StoredPlugin> {
    return this.plugins;
  }
}

/**
 * Create a plugin for ElysiumJS
 * @param pluginDef - Plugin definition
 * @returns Plugin object
 */
export function createPlugin(pluginDef: Partial<PluginDefinition>): PluginDefinition {
  const defaultPlugin: PluginDefinition = {
    name: 'unnamed-plugin',
    version: '0.0.1',
    description: '',
    init: () => {},
    hooks: {}
  };

  return { ...defaultPlugin, ...pluginDef };
}

export default PluginManager;
