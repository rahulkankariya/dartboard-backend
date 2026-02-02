import { AsyncLocalStorage } from 'node:async_hooks';

// This will hold the 'req' object globally for the duration of one request
export const storage = new AsyncLocalStorage<any>();