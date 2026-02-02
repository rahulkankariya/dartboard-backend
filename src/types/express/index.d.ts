// src/types/express/index.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: any; // Example: adding a user property
    }
  }
}
export {}; // This line marks it as a module to satisfy TS