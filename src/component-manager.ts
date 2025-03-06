import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { parseComponentFile, parseProps } from './utils/component-parser.js';
import { readFile, exists, ensureDir } from './utils/file-utils.js';

/**
 * Interface for component definition
 */
export interface Component {
  render: (props: ComponentProps) => string;
  styles?: string;
  [key: string]: any;
}

/**
 * Interface for component props
 */
export interface ComponentProps {
  children?: string;
  [key: string]: any;
}

/**
 * Interface for parsed component
 */
export interface ParsedComponent {
  name: string;
  component: Component;
}

export class ComponentManager {
  public rootDir: string;
  public components: Map<string, Component>;
  public styles: Map<string, string>;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.components = new Map();
    this.styles = new Map();
  }

  async scanComponents(): Promise<void> {
    try {
      // Find all .els component files
      const componentFiles = await glob('app/components/**/*.els', {
        cwd: this.rootDir,
        absolute: true
      });

      // Process each component file
      for (const filePath of componentFiles) {
        await this.loadComponent(filePath);
      }

      console.log(`🧩 Loaded ${this.components.size} components`);
    } catch (error) {
      console.error('Error scanning components:', error);
    }
  }

  async loadComponent(filePath: string): Promise<void> {
    try {
      // Parse component file using the utility
      const parsedComponent = parseComponentFile(filePath);
      
      if (parsedComponent && parsedComponent.name && parsedComponent.component) {
        const { name, component } = parsedComponent;
        
        // Store component
        this.components.set(name, component);
        
        // Store component styles if available
        if (component.styles) {
          this.styles.set(name, component.styles);
        }
        
        console.log(`📦 Loaded component: ${name}`);
      }
    } catch (error) {
      console.error(`Error loading component ${filePath}:`, error);
    }
  }

  processHtml(html: string): string {
    // Add component styles link
    html = this.injectStylesLink(html);
    
    // Process all component tags
    for (const [name, component] of this.components.entries()) {
      html = this.replaceComponentTags(html, name, component);
    }
    
    return html;
  }

  injectStylesLink(html: string): string {
    // Check if styles link already exists
    if (html.includes('href="/elysium/styles.css"')) {
      return html;
    }
    
    // Check if HTMX is included
    if (!html.includes('src="/public/htmx.min.js"')) {
      html = html.replace('</head>', '  <script src="/public/htmx.min.js"></script>\n</head>');
    }
    
    // Add styles link before closing head tag
    return html.replace('</head>', '  <link rel="stylesheet" href="/elysium/styles.css">\n</head>');
  }

  replaceComponentTags(html: string, componentName: string, component: Component): string {
    const tagRegex = new RegExp(`<${componentName}([^>]*)(?:>(.*?)<\/${componentName}>|\\s*\\/?>)`, 'gs');
    
    return html.replace(tagRegex, (match, propsStr = '', children = '') => {
      // Parse props
      const props = this.parseProps(propsStr);
      
      // Add children to props
      if (children.trim()) {
        props.children = children.trim();
      }
      
      // Render component
      return component.render(props);
    });
  }

  parseProps(propsStr: string): ComponentProps {
    // Use the utility function for parsing props
    return parseProps(propsStr);
  }

  getAllStyles(): string {
    // Combine all component styles
    return Array.from(this.styles.values()).join('\n\n');
  }
}

// Fix for CommonJS/ESM compatibility
export default ComponentManager;
