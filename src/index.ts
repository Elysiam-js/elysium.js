import { ElysiumRouter } from './framework/router';
import { join } from 'path';

const startServer = async () => {
  console.log('🚀 Starting Elysium server...');
  
  const router = new ElysiumRouter({
    pagesDir: join(process.cwd(), 'app'),
    apiDir: join(process.cwd(), 'app/api'),
    rootDir: process.cwd()
  });

  const app = await router.initialize();
  
  app.listen(3000, () => {
    console.log('🌟 Elysium server is running at http://localhost:3000');
    console.log('✨ JSX-like components are ready to use!');
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start Elysium server:', error);
  process.exit(1);
});
