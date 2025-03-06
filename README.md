# ElysiumJS

A modern fullstack framework combining HTMX and Elysia.js for building dynamic web applications with minimal JavaScript.

## Features

- **Component-Based Architecture**: Create reusable UI components with the `.els` format
- **HTMX Integration**: Leverage the power of HTMX for dynamic content without writing JavaScript
- **Elysia.js Backend**: Fast and type-safe backend powered by Elysia.js and Bun
- **Zero-Config Development**: Start developing immediately with sensible defaults
- **Production-Ready Builds**: Optimize your application for production with a single command

## Getting Started

### Create a New Project

```bash
# Install ElysiumJS globally
bun install -g elysium-js

# Create a new project
elysium create my-app
cd my-app

# Install dependencies
bun install

# Start development server
bun dev
```

### Project Structure

```
my-app/
├── app/
│   ├── components/     # UI components (.els files)
│   ├── global.css      # Global styles
│   └── index.html      # Main HTML file
├── public/             # Static assets
└── package.json        # Project configuration
```

## Component System

ElysiumJS uses a component-based architecture with `.els` files. Each component consists of:

1. A render function that returns HTML
2. Optional styles for the component

### Example Component

```javascript
// app/components/button.els
export Button = {
  render: (props) => {
    const { 
      size = 'medium',
      color = 'primary',
      disabled,
      children
    } = props;
    
    const classes = [
      'els-button',
      `els-button-${size}`,
      `els-button-${color}`,
      disabled ? 'els-button-disabled' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <button class="${classes}" ${disabled ? 'disabled' : ''}>
        ${children || 'Button'}
      </button>
    `;
  },
  
  styles: `
    .els-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .els-button-primary {
      background-color: #3b82f6;
      color: white;
    }
    
    /* Additional styles... */
  `
}
```

### Using Components

Once defined, components can be used directly in your HTML files:

```html
<Button size="large" color="primary">Click Me</Button>

<Card title="My Card">
  <p>This is the card content</p>
  <Button>Learn More</Button>
</Card>
```

## CLI Commands

- `elysium create [name]` - Create a new project
- `elysium dev` - Start development server
- `elysium build` - Build for production
- `elysium start` - Start production server

## License

MIT
