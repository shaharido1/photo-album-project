/**
 * Unit Test Environment Setup
 * This runs BEFORE any modules are imported
 */

// Use local storage for all tests
process.env.USE_LOCAL_STORAGE = 'true';
// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
