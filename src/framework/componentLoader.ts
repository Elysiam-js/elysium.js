import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { pathToFileURL } from 'url';

interface ComponentProps {
  children?: string;
  [key: string]: any;
}

interface Component {
  render: (props: ComponentProps) => string;
  styles?: string;
}

export class ComponentLoader {
  private static components: Map<string, string> = new Map();
  private static exportedComponents: Map<string, Component> = new Map();
  
  static async loadComponent(componentPath: string): Promise<string> {
    if (this.components.has(componentPath)) {
      return this.components.get(componentPath)!;
    }

    try {
      const content = readFileSync(componentPath, 'utf-8');
      this.components.set(componentPath, content);
      return content;
    } catch (error) {
      throw new Error(`Failed to load component: ${componentPath}`);
    }
  }

  static async loadExportedComponent(componentName: string, directory: string): Promise<Component | null> {
    // Check if component is already loaded
    if (this.exportedComponents.has(componentName)) {
      return this.exportedComponents.get(componentName)!;
    }

    // Try to find the component file
    const componentPath = join(directory, 'components', `${componentName.toLowerCase()}.els`);
    if (!existsSync(componentPath)) {
      return null;
    }

    try {
      // Load the component file content
      const content = readFileSync(componentPath, 'utf-8');
      
      // Transform the .els content into valid JavaScript
      // Remove 'export' keyword and create a proper module.exports
      const transformedContent = content
        .replace(/export\s+([A-Za-z0-9_]+)\s*=/, 'const $1 =')
        .trim() + '\n\nmodule.exports = { ' + componentName + ' };';
      
      console.log(`Loading component ${componentName}:\n${transformedContent}`);
      
      // Create a temporary file to evaluate the component
      const tempFilePath = join(directory, 'temp', `${componentName}.js`);
      const dirPath = dirname(tempFilePath);
      
      // Ensure directory exists
      if (!existsSync(dirPath)) {
        const { mkdir } = await import('fs/promises');
        await mkdir(dirPath, { recursive: true });
      }
      
      // Write transformed content to temp file
      const { writeFile } = await import('fs/promises');
      await writeFile(tempFilePath, transformedContent, 'utf-8');
      
      // Import the component
      const fileUrl = pathToFileURL(tempFilePath).href;
      const module = await import(fileUrl + '?update=' + Date.now());
      
      // Get the exported component
      const component = module[componentName];
      if (component && typeof component.render === 'function') {
        console.log(`Component ${componentName} loaded successfully with styles:`, component.styles ? 'yes' : 'no');
        this.exportedComponents.set(componentName, component);
        return component;
      }
      
      console.error(`Component ${componentName} does not have a render function`);
      return null;
    } catch (error) {
      console.error(`Failed to load exported component: ${componentName}`, error);
      return null;
    }
  }

  static async scanComponents(directory: string): Promise<void> {
    const files = readdirSync(directory, { recursive: true });
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.els')) {
        const fullPath = join(directory, file);
        await this.loadComponent(fullPath);
        
        // Try to load exported components
        const componentName = basename(file, '.els');
        const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        await this.loadExportedComponent(capitalizedName, directory);
      }
    }
  }

  static async mount(html: string, directory: string): Promise<string> {
    console.log('Starting mount process with directory:', directory);
    
    // First, ensure we have a proper HTML structure
    let result = html;
    if (!result.includes('<head>')) {
      console.log('No head tag found, adding basic HTML structure');
      result = result.replace('<html', '<html>\n<head>\n</head>');
    }
    
    // Track all component styles to add them at once
    const componentStyles = new Map<string, string>();
    
    // Pre-scan the document for all components to collect their styles
    const componentScanRegex = /<([A-Z][a-zA-Z0-9]*)([^>]*?)(?:\/?>|>[\s\S]*?<\/\1>)/g;
    const componentMatches = [...result.matchAll(componentScanRegex)];
    
    console.log(`Pre-scanning found ${componentMatches.length} components`);
    
    // Load all components and collect their styles first
    for (const [_, componentName] of componentMatches) {
      const component = await this.loadExportedComponent(componentName, directory);
      if (component?.styles && !componentStyles.has(componentName)) {
        console.log(`Pre-collecting styles for component: ${componentName}`);
        componentStyles.set(componentName, component.styles);
      }
    }
    
    // Inject all styles into head before processing components
    if (componentStyles.size > 0) {
      const allStyles = Array.from(componentStyles.values()).join('\n');
      console.log(`Injecting styles for ${componentStyles.size} components:`, 
        Array.from(componentStyles.keys()));
      
      const styleTag = `<style>\n${allStyles}\n</style>`;
      result = result.replace('</head>', `${styleTag}\n</head>`);
    }
    
    // First, handle traditional component tags
    result = result.replace(/<component\s+src="([^"]+)"[^>]*>/g, (match, src) => {
      console.log('Found traditional component tag with src:', src);
      try {
        const componentContent = this.components.get(src);
        if (!componentContent) {
          throw new Error(`Component not found: ${src}`);
        }
        return componentContent;
      } catch (error) {
        console.error(`Error mounting component ${src}:`, error);
        return `<!-- Error loading component ${src} -->`;
      }
    });
    
    // Then, handle JSX-like component syntax
    // Updated regex to better match component tags
    const componentRegex = /<([A-Z][a-zA-Z0-9]*)([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
    console.log('Searching for components with regex:', componentRegex);
    
    let match;
    while ((match = componentRegex.exec(result)) !== null) {
      const [fullMatch, componentName, attributesStr, children] = match;
      console.log(`Found component: ${componentName}`, {
        fullMatch,
        attributesStr: attributesStr.trim(),
        hasChildren: !!children
      });
      
      const component = await this.loadExportedComponent(componentName, directory);
      
      if (component) {
        console.log(`Successfully loaded component: ${componentName}`);
        
        // Store component styles if present (only once per component type)
        if (component.styles && !componentStyles.has(componentName)) {
          console.log(`Collecting styles for component: ${componentName}`);
          componentStyles.set(componentName, component.styles);
        }
        
        // Parse attributes
        const props: ComponentProps = {};
        const attributeRegex = /([a-zA-Z0-9]+)(?:="([^"]*)"|\'([^\']*)\')?/g;
        let attrMatch;
        while ((attrMatch = attributeRegex.exec(attributesStr)) !== null) {
          const [_, name, value1, value2] = attrMatch;
          props[name] = value1 || value2 || true;
          console.log(`Parsed prop for ${componentName}:`, { name, value: props[name] });
        }
        
        // Add children if present
        if (children) {
          props.children = children.trim();
        }
        
        // Render the component
        const rendered = component.render(props);
        console.log(`Rendered ${componentName}:`, rendered.slice(0, 100) + '...');
        
        // Replace the component in the HTML
        result = result.replace(fullMatch, rendered);
      } else {
        console.error(`Failed to load component: ${componentName}`);
      }
    }
    
    // Styles have already been injected at the beginning
    
    return result;
  }
}
