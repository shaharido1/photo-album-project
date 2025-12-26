/**
 * Server entry point - starts the Express server
 *
 * For testing, import from app.ts directly to avoid starting the server.
 */

import { app } from './app.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
