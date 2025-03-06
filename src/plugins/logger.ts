/**
 * Logger Plugin for ElysiumJS
 * Provides enhanced logging capabilities for the framework
 */

import { Elysia } from 'elysia';
import { createPlugin, PluginDefinition, PluginOptions } from '../plugin-manager.js';
import fs from 'fs';
import path from 'path';

/**
 * Interface for logger options
 */
export interface LoggerOptions extends PluginOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logToFile?: boolean;
  logFilePath?: string;
  logFormat?: 'text' | 'json';
  timestamp?: boolean;
  replaceConsole?: boolean;
}

/**
 * Interface for log data
 */
export interface LogData {
  [key: string]: any;
}

/**
 * Interface for logger functions
 */
export interface Logger {
  debug: (message: string, data?: LogData) => void;
  info: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
  error: (message: string, data?: LogData) => void;
  originalConsole?: Console;
}

/**
 * Interface for log levels
 */
interface LogLevels {
  [key: string]: number;
}

/**
 * Create a logger plugin for ElysiumJS
 * @param options - Plugin options
 * @returns Plugin object
 */
export function createLoggerPlugin(options: LoggerOptions = {}): PluginDefinition {
  const defaultOptions: LoggerOptions = {
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logToFile: false,
    logFilePath: './logs/elysium.log',
    logFormat: 'text', // 'text', 'json'
    timestamp: true
  };

  const pluginOptions: LoggerOptions = { ...defaultOptions, ...options };
  
  // Create log directory if logging to file
  if (pluginOptions.logToFile) {
    const logDir = path.dirname(pluginOptions.logFilePath!);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Log levels and their numeric values
  const LOG_LEVELS: LogLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // Current log level numeric value
  const currentLogLevel = LOG_LEVELS[pluginOptions.logLevel || 'info'] || 1;

  /**
   * Format a log message
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data to log
   * @returns Formatted log message
   */
  function formatLogMessage(level: string, message: string, data: LogData = {}): string {
    const timestamp = pluginOptions.timestamp ? `[${new Date().toISOString()}] ` : '';
    
    if (pluginOptions.logFormat === 'json') {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data
      });
    }
    
    let formattedMessage = `${timestamp}[${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(data).length > 0) {
      formattedMessage += '\n' + JSON.stringify(data, null, 2);
    }
    
    return formattedMessage;
  }

  /**
   * Write a log message to file
   * @param message - Log message
   */
  function writeToFile(message: string): void {
    if (pluginOptions.logToFile && pluginOptions.logFilePath) {
      fs.appendFileSync(pluginOptions.logFilePath, message + '\n');
    }
  }

  /**
   * Create a logger function for a specific level
   * @param level - Log level
   * @returns Logger function
   */
  function createLogger(level: string): (message: string, data?: LogData) => void {
    return (message: string, data: LogData = {}) => {
      if (LOG_LEVELS[level] >= currentLogLevel) {
        const formattedMessage = formatLogMessage(level, message, data);
        
        // Log to console
        (console as any)[level](formattedMessage);
        
        // Log to file if enabled
        writeToFile(formattedMessage);
      }
    };
  }

  // Create the logger object
  const logger: Logger = {
    debug: createLogger('debug'),
    info: createLogger('info'),
    warn: createLogger('warn'),
    error: createLogger('error')
  };

  return createPlugin({
    name: 'logger',
    version: '0.1.0',
    description: 'Enhanced logging capabilities for ElysiumJS',
    
    init(app: Elysia, options: LoggerOptions) {
      // Replace console methods with our logger
      if (options.replaceConsole) {
        const originalConsole = { ...console };
        
        console.debug = logger.debug;
        console.info = logger.info;
        console.log = logger.info;
        console.warn = logger.warn;
        console.error = logger.error;
        
        // Store original console methods
        logger.originalConsole = originalConsole;
      }
      
      // Add logger to app context
      app.derive(() => {
        return { logger };
      });
      
      logger.info('Logger plugin initialized', { options: pluginOptions });
    },
    
    hooks: {
      beforeInit: ({ app }) => {
        logger.debug('ElysiumJS initialization started');
      },
      
      afterInit: ({ app }) => {
        logger.info('ElysiumJS initialization completed');
      },
      
      beforeRequest: ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        logger.debug(`Request started: ${request.method} ${url.pathname}`);
      },
      
      afterRequest: ({ request, response }: { request: Request; response: Response }) => {
        const url = new URL(request.url);
        logger.debug(`Request completed: ${request.method} ${url.pathname}`, {
          status: response.status
        });
      }
    },
    
    // Expose logger methods
    logger
  });
}

export default createLoggerPlugin;
