import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

/**
 * Interface for file find options
 */
export interface FindOptions {
  absolute?: boolean;
  [key: string]: any;
}

/**
 * Find files matching a pattern in a directory
 * @param pattern - Glob pattern to match
 * @param cwd - Directory to search in
 * @param options - Additional options
 * @returns Array of matching file paths
 */
export async function findFiles(pattern: string, cwd: string, options: FindOptions = {}): Promise<string[]> {
  return glob(pattern, {
    cwd,
    absolute: options.absolute || false,
    ...options
  });
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath - Path to the directory
 */
export function ensureDir(dirPath: string): void {
  fs.ensureDirSync(dirPath);
}

/**
 * Read a file and return its contents
 * @param filePath - Path to the file
 * @param encoding - File encoding (default: utf-8)
 * @returns File contents
 */
export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  return fs.readFileSync(filePath, encoding);
}

/**
 * Write content to a file, creating directories if necessary
 * @param filePath - Path to the file
 * @param content - Content to write
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

/**
 * Copy a file or directory
 * @param src - Source path
 * @param dest - Destination path
 */
export function copy(src: string, dest: string): void {
  fs.copySync(src, dest);
}

/**
 * Check if a file or directory exists
 * @param filePath - Path to check
 * @returns True if the path exists
 */
export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get the content type for a file based on its extension
 * @param filePath - Path to the file
 * @returns Content type
 */
export function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

export default {
  findFiles,
  ensureDir,
  readFile,
  writeFile,
  copy,
  exists,
  getContentType
};
