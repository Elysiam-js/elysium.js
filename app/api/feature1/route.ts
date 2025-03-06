import { Elysia } from 'elysia';

export default new Elysia()
  .get('/', () => {
    return `
      <div>
        <h3>Dynamic Components</h3>
        <p>Elysium's .els components are modular, reusable HTML snippets that can include their own styles and behaviors.</p>
        <ul>
          <li>Scoped CSS</li>
          <li>Easy imports</li>
          <li>Component composition</li>
        </ul>
      </div>
    `;
  });
