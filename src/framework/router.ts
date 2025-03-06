import { Elysia } from 'elysia';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { ComponentLoader } from './componentLoader';

export class ElysiumRouter {
  private app: Elysia;
  private pagesDir: string;
  private apiDir: string;
  private rootDir: string;

  constructor(options: { pagesDir: string; apiDir: string; rootDir?: string }) {
    this.app = new Elysia();
    this.pagesDir = options.pagesDir;
    this.apiDir = options.apiDir;
    this.rootDir = options.rootDir || process.cwd();
  }

  private async loadPageRoutes() {
    const files = readdirSync(this.pagesDir, { recursive: true });
    
    for (const file of files) {
      if (typeof file !== 'string') continue;
      
      if (file.endsWith('.html')) {
        const fullPath = join(this.pagesDir, file);
        const routePath = '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '');
        
        this.app.get(routePath, async () => {
          let content = readFileSync(fullPath, 'utf-8');
          // Mount components with JSX-like syntax
          content = await ComponentLoader.mount(content, this.rootDir);
          return new Response(content, {
            headers: { 'Content-Type': 'text/html' }
          });
        });
      }
    }
  }

  private async loadApiRoutes() {
    const files = readdirSync(this.apiDir, { recursive: true });
    
    for (const file of files) {
      if (typeof file !== 'string') continue;
      
      if (file.endsWith('route.ts')) {
        const fullPath = join(this.apiDir, file);
        const routePath = '/api/' + dirname(file);
        
        try {
          const route = await import(fullPath);
          if (route.default instanceof Elysia) {
            this.app.group(routePath, app => route.default);
          }
        } catch (error) {
          console.error(`Error loading API route ${fullPath}:`, error);
        }
      }
    }
  }

  async initialize() {
    // Ensure temp directory exists for component processing
    const tempDir = join(this.rootDir, 'temp');
    if (!existsSync(tempDir)) {
      const { mkdir } = await import('fs/promises');
      await mkdir(tempDir, { recursive: true });
    }
    
    // Load all components
    await ComponentLoader.scanComponents(this.rootDir);
    await this.loadPageRoutes();
    await this.loadApiRoutes();
    
    // Serve static files
    this.app.get('/public/*', ({ params }) => {
      const path = params['*'];
      try {
        const content = readFileSync(join(process.cwd(), 'public', path));
        return new Response(content);
      } catch {
        return new Response('Not found', { status: 404 });
      }
    });

    // Serve HTMX library
    this.app.get('/public/htmx.min.js', () => {
      try {
        const htmxPath = require.resolve('htmx.org/dist/htmx.min.js');
        const content = readFileSync(htmxPath);
        return new Response(content, {
          headers: { 'Content-Type': 'application/javascript' }
        });
      } catch (error) {
        console.error('Failed to serve HTMX:', error);
        return new Response('HTMX not found', { status: 404 });
      }
    });

    return this.app;
  }
}
