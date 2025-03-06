/**
 * Example API route
 * This demonstrates how to create a simple API endpoint
 */
export default {
  // GET request handler
  get: async ({ request }) => {
    return {
      message: "Hello from ElysiumJS!",
      timestamp: new Date().toISOString()
    };
  },
  
  // POST request handler
  post: async ({ request, body }) => {
    const data = await request.json();
    
    return {
      message: "Data received!",
      data,
      timestamp: new Date().toISOString()
    };
  }
};
