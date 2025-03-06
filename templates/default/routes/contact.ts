import { Elysia } from 'elysia';

export default (app: Elysia) => {
  app.post('/api/contact', ({ body }) => {
    // Here you can add your contact form handling logic
    // For example, sending emails, storing in database, etc.
    console.log('Contact form submission:', body);
    
    // For demonstration, we'll just return a success message
    return {
      message: 'Thank you for your message! We will get back to you soon.',
      success: true
    };
  });
  
  return app;
};
