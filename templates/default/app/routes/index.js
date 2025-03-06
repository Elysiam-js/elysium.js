/**
 * Home route handler
 * This is the main entry point for the application
 */
export default {
  // GET request handler
  get: async ({ request, html }) => {
    return html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elysium App</title>
        <link rel="stylesheet" href="/app/global.css">
      </head>
      <body>
        <!-- Using the Header component with props -->
        <Header title="Elysium Framework" links='[{"text":"Home","href":"/"},{"text":"Components","href":"#components"},{"text":"Docs","href":"/docs"},{"text":"GitHub","href":"https://github.com"}]'></Header>

        <main>
          <section class="hero">
            <h1>Welcome to Elysium</h1>
            <p>A modern fullstack framework with HTMX and Elysia.js</p>
            <div class="cta">
              <Button size="large" color="primary" hx-get="/api/hello" hx-swap="outerHTML">Get Started</Button>
            </div>
          </section>

          <section id="components" class="component-showcase">
            <h2>Component Showcase</h2>
            
            <h3>Button Variants</h3>
            <div class="button-showcase">
              <Button size="small">Small Button</Button>
              <Button>Default Button</Button>
              <Button size="large">Large Button</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="success">Success</Button>
              <Button color="danger">Danger</Button>
              <Button color="outline">Outline</Button>
              <Button disabled="true">Disabled</Button>
            </div>
          </section>
        </main>
      </body>
      </html>
    `);
  }
};
