import fs from 'fs';
import path from 'path';

/**
 * Interface for parsed component
 */
export interface ParsedComponent {
  name: string;
  fileName: string;
  component: Component | null;
}

/**
 * Interface for component
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
  [key: string]: any;
}

/**
 * Parse an .els component file and extract its definition
 * @param filePath - Path to the component file
 * @returns The parsed component object
 */
export function parseComponentFile(filePath: string): ParsedComponent | null {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract component name from file path
    const fileName = path.basename(filePath, '.els');
    const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    
    // Extract export statement
    const exportMatch = content.match(/export\s+([A-Za-z0-9_]+)\s*=/);
    
    if (!exportMatch) {
      console.warn(`No export found in component file: ${filePath}`);
      return null;
    }
    
    const exportedName = exportMatch[1];
    
    // Extract component definition
    const definitionStart = content.indexOf('=') + 1;
    const definition = content.substring(definitionStart).trim();
    
    // Evaluate component definition
    const componentObj = evaluateComponentDefinition(definition);
    
    return {
      name: exportedName,
      fileName,
      component: componentObj
    };
  } catch (error) {
    console.error(`Error parsing component file ${filePath}:`, error);
    return null;
  }
}

/**
 * Safely evaluate the component definition string to an object
 * @param definition - Component definition string
 * @returns Evaluated component object
 */
function evaluateComponentDefinition(definition: string): Component | null {
  try {
    // Create a safe evaluation context
    const safeEval = new Function(`
      return ${definition};
    `);
    
    return safeEval() as Component;
  } catch (error) {
    console.error('Error evaluating component definition:', error);
    return null;
  }
}

/**
 * Parse props from a component tag's attributes string
 * @param propsStr - String containing the component attributes
 * @returns Parsed props object
 */
export function parseProps(propsStr: string): ComponentProps {
  const props: ComponentProps = {};
  
  // Match all attributes
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\{[^}]*\})))?/g;
  let match;
  
  while ((match = attrRegex.exec(propsStr)) !== null) {
    const [, name, doubleQuoted, singleQuoted, objectValue] = match;
    
    if (objectValue) {
      // Handle object values (JSON-like)
      try {
        // Clean the object string (remove curly braces)
        const cleanObject = objectValue.replace(/^\{|\}$/g, '').trim();
        props[name] = JSON.parse(`{${cleanObject}}`);
      } catch (error) {
        console.warn(`Error parsing object prop ${name}:`, error);
        props[name] = objectValue;
      }
    } else {
      // Handle string values
      props[name] = doubleQuoted || singleQuoted || true;
    }
  }
  
  return props;
}

export default {
  parseComponentFile,
  parseProps
};
