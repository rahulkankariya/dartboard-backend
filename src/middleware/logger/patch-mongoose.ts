import mongoose from 'mongoose';
import { storage } from './context';

export function patchMongoose() {
  // Use a pre-hook to mark the start time
  mongoose.plugin((schema: any) => {
    
    // We target all "find", "update", "delete", and "count" operations
    schema.pre(/^find|update|delete|count|save/, function (this: any, next: any) {
      this._startTime = performance.now();
      next();
    });

    // Use a post-hook to calculate duration and save to context
    schema.post(/^find|update|delete|count|save/, function (this: any, doc: any, next: any) {
      const store = storage.getStore();
      
      if (store && store.dbTimings && this._startTime) {
        const durationMs = performance.now() - this._startTime;
        
        // Mongoose provides the collection name on the model
        const collectionName = this.model?.collection?.name || 'other';

        // Aggregate timing per collection
        store.dbTimings[collectionName] = (store.dbTimings[collectionName] || 0) + durationMs;
      }
      
      if (typeof next === 'function') next();
    });
  });
}