import mongoose from 'mongoose';
import { storage } from './context';

export function patchMongoose() {
  mongoose.plugin((schema: any) => {
    
    // Pre-hook remains mostly the same, but we add a check for safety
    schema.pre(/^find|update|delete|count|save/, function (this: any, next: any) {
      this._startTime = performance.now();
      if (typeof next === 'function') next();
    });

    // Post-hook: Removed 'next' from arguments
    schema.post(/^find|update|delete|count|save/, function (this: any, doc: any) {
      const store = storage.getStore();
      
      // Calculate duration
      if (store && store.dbTimings && this._startTime) {
        const durationMs = performance.now() - this._startTime;
        
        // During 'save', 'this' is the document. We get the collection name from the constructor.
        // During 'find', 'this' is the query. We get it from this.model.
        const collectionName = this.model?.collection?.name || 
                               this.constructor?.modelName || 
                               this.collection?.name || 
                               'other';

        store.dbTimings[collectionName] = (store.dbTimings[collectionName] || 0) + durationMs;
      }
      
      // No next() needed here. Mongoose moves on automatically.
    });
  });
}