/**
 * Error handling utilities for ElysiumJS
 */

import chalk from 'chalk';

/**
 * Interface for error details
 */
export interface ErrorDetails {
  [key: string]: any;
}

/**
 * Custom error class for ElysiumJS framework
 */
export class ElysiumError extends Error {
  name: string;
  code: string;
  details: ErrorDetails;

  constructor(message: string, code: string, details: ErrorDetails = {}) {
    super(message);
    this.name = 'ElysiumError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Format an error for console output
 * @param error - The error to format
 * @returns Formatted error message
 */
export function formatError(error: Error): string {
  if (error instanceof ElysiumError) {
    return formatElysiumError(error);
  }
  
  return `${chalk.red('Error:')} ${error.message}\n${chalk.gray(error.stack)}`;
}

/**
 * Format an ElysiumError for console output
 * @param error - The error to format
 * @returns Formatted error message
 */
function formatElysiumError(error: ElysiumError): string {
  let output = `${chalk.red(`[${error.code}]`)} ${error.message}\n`;
  
  if (Object.keys(error.details).length > 0) {
    output += chalk.yellow('Details:') + '\n';
    
    for (const [key, value] of Object.entries(error.details)) {
      output += `  ${chalk.yellow(key)}: ${value}\n`;
    }
  }
  
  output += chalk.gray(error.stack);
  
  return output;
}

/**
 * Create a component not found error
 * @param componentName - Name of the component
 * @returns Error object
 */
export function componentNotFoundError(componentName: string): ElysiumError {
  return new ElysiumError(
    `Component '${componentName}' not found`,
    'COMPONENT_NOT_FOUND',
    { componentName }
  );
}

/**
 * Create a route not found error
 * @param path - Route path
 * @returns Error object
 */
export function routeNotFoundError(path: string): ElysiumError {
  return new ElysiumError(
    `Route '${path}' not found`,
    'ROUTE_NOT_FOUND',
    { path }
  );
}

/**
 * Create a file not found error
 * @param filePath - Path to the file
 * @returns Error object
 */
export function fileNotFoundError(filePath: string): ElysiumError {
  return new ElysiumError(
    `File '${filePath}' not found`,
    'FILE_NOT_FOUND',
    { filePath }
  );
}

/**
 * Create a configuration error
 * @param message - Error message
 * @param details - Additional error details
 * @returns Error object
 */
export function configError(message: string, details: ErrorDetails = {}): ElysiumError {
  return new ElysiumError(
    message,
    'CONFIG_ERROR',
    details
  );
}

export default {
  ElysiumError,
  formatError,
  componentNotFoundError,
  routeNotFoundError,
  fileNotFoundError,
  configError
};
