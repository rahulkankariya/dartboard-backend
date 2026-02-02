import mongoose from 'mongoose';
import { config } from '../config/config'; 
export const connectDB = async (): Promise<void> => {
  try {
    // Check if URI exists to avoid runtime crashes
    if (!config.db.uri) {
      throw new Error("MongoDB URI is missing in configuration");
    }
    await mongoose.connect(config.db.uri);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    // Using a type guard for the error object
    if (err instanceof Error) {
      console.error("MongoDB Connection Failed:", err);
    } else {
      console.error("MongoDB Connection Failed:", err);
    }
    
    process.exit(1);
  }
};