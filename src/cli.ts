#!/usr/bin/env bun

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { ElysiumJS } from './index.js';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

/**
 * Load all route files from the routes directory
 * @param targetDir - Project directory
 */
async function loadRoutes(targetDir: string) {
  const routesDir = path.join(targetDir, 'routes');
  
  // Create routes directory if it doesn't exist
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir, { recursive: true });
    return;
  }
  
  // Find all route files
  const routeFiles = await glob('**/*.{ts,js}', {
    cwd: routesDir
  });
  
  if (routeFiles.length > 0) {
    console.log(chalk.blue('Found routes:'));
    routeFiles.forEach(file => {
      const route = file.replace(/\.(ts|js)$/, '');
      console.log(chalk.cyan(`  /${route}`));
    });
  }
}

/**
 * Interface for create command options
 */
interface CreateCommandOptions {
  template: string;
}

/**
 * Interface for server command options
 */
interface ServerCommandOptions {
  port: string;
}

program
  .name('elysium')
  .description('ElysiumJS - A modern fullstack framework with HTMX and Elysia.js')
  .version('0.1.0');

// Create new project
program
  .command('create')
  .description('Create a new ElysiumJS project')
  .argument('<name>', 'Project name')
  .option('-t, --template <template>', 'Template to use', 'default')
  .action(async (name: string, options: CreateCommandOptions) => {
    // Validate project name
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.error(chalk.red('Error: Project name can only contain lowercase letters, numbers, and hyphens'));
      process.exit(1);
    }
    const targetDir = path.resolve(process.cwd(), name);
    
    // Check if directory exists
    if (fs.existsSync(targetDir)) {
      console.error(chalk.red(`Error: Directory ${name} already exists`));
      process.exit(1);
    }
    
    // Create project directory
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy template files
    const templateDir = path.resolve(__dirname, '../templates', options.template);
    
    if (!fs.existsSync(templateDir)) {
      console.error(chalk.red(`Error: Template ${options.template} not found`));
      process.exit(1);
    }
    
    console.log();
    console.log(chalk.blue(`🚀 Creating new ElysiumJS project in ${targetDir}...`));
    console.log();
    
    try {
      // Copy template files
      console.log(chalk.blue('Copying template files...'));
      fs.copySync(templateDir, targetDir);
      
      // Create package.json
      console.log(chalk.blue('Creating package.json...'));
      const packageJson = {
        name: name,
        version: '0.1.0',
        private: true,
        type: "module",
        scripts: {
          dev: "bun run src/cli.ts dev",
          build: "bun run src/cli.ts build",
          start: "bun run src/cli.ts start"
        },
        dependencies: {
          "elysium-js": "latest",
          "htmx.org": "^1.9.10"
        },
        devDependencies: {
          "bun-types": "latest",
          "typescript": "^5.3.3"
        }
      };
      
      // Write package.json
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Replace project name in template files
      console.log(chalk.blue('Customizing project files...'));
      const projectTitle = name.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const filesToUpdate = [
        path.join(targetDir, 'app/index.html'),
        path.join(targetDir, 'public/index.html')
      ];
      
      for (const file of filesToUpdate) {
        if (fs.existsSync(file)) {
          let content = fs.readFileSync(file, 'utf-8');
          content = content.replace(/{{PROJECT_NAME}}/g, projectTitle);
          fs.writeFileSync(file, content);
          console.log(chalk.gray(`  Updated ${path.relative(targetDir, file)}`));
        }
      }
      
      // Create necessary directories
      console.log(chalk.blue('Setting up project structure...'));
      const dirs = [
        path.join(targetDir, 'public'),
        path.join(targetDir, 'routes'),
        path.join(targetDir, 'components')
      ];
      
      dirs.forEach(dir => {
        const relativePath = path.relative(targetDir, dir);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(chalk.gray(`  Created ${relativePath}/`));
        }
      });
      
      // Load routes
      await loadRoutes(targetDir);
      
      console.log();
      console.log(chalk.green('✅ Project created successfully!'));
      console.log();
      
      console.log('📁 Project structure:');
      console.log(chalk.cyan('  app/      - Application source files'));
      console.log(chalk.cyan('  public/   - Static assets and client-side files'));
      console.log(chalk.cyan('  routes/   - API routes and endpoints'));
      console.log(chalk.cyan('  components/- Reusable UI components'));
      console.log();
      
      console.log('🎯 Available scripts:');
      console.log(chalk.cyan('  bun run dev    - Start development server'));
      console.log(chalk.cyan('  bun run build  - Build for production'));
      console.log(chalk.cyan('  bun run start  - Start production server'));
      console.log();
      
      console.log('👉 To get started:');
      console.log(chalk.cyan(`  1. cd ${name}`));
      console.log(chalk.cyan('  2. bun install'));
      console.log(chalk.cyan('  3. bun run dev'));
      console.log();
      
      console.log('📚 Documentation:');
      console.log(chalk.cyan('  • Edit app/index.html to customize your landing page'));
      console.log(chalk.cyan('  • Add new routes in the routes/ directory'));
      console.log(chalk.cyan('  • Create reusable components in components/'));
      console.log();
      
      console.log(chalk.green('Happy coding! 🚀'));
    } catch (error) {
      console.log();
      console.error(chalk.red('❌ Error creating project:'));
      if (error instanceof Error) {
        console.error(chalk.red(`  ${error.message}`));
      } else {
        console.error(chalk.red('  An unknown error occurred'));
      }
      console.log();
      console.log('Try:');
      console.log(chalk.cyan('  • Checking if you have write permissions in the target directory'));
      console.log(chalk.cyan('  • Using a different project name'));
      console.log(chalk.cyan('  • Running the command with sudo if needed'));
      process.exit(1);
    }
  });

// Development server
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options: ServerCommandOptions) => {
    try {
      const port = parseInt(options.port);
      console.log(chalk.blue(`Starting development server on port ${port}...`));
      await ElysiumJS.dev({
        port,
        root: process.cwd()
      });
    } catch (error) {
      console.error(chalk.red('Error starting development server:'), error);
      process.exit(1);
    }
  });

// Build project
program
  .command('build')
  .description('Build project for production')
  .action(async () => {
    try {
      await ElysiumJS.build({
        root: process.cwd()
      });
      
      console.log(chalk.green('✅ Build completed successfully!'));
    } catch (error) {
      console.error(chalk.red('Error building project:'), error);
      process.exit(1);
    }
  });

// Start production server
program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options: ServerCommandOptions) => {
    try {
      const port = parseInt(options.port);
      console.log(chalk.blue(`Starting production server on port ${port}...`));
      const server = new ElysiumJS({
        port,
        root: process.cwd(),
        mode: 'production'
      });
      
      await server.init();
      await server.start();
    } catch (error) {
      console.error(chalk.red('Error starting production server:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);
