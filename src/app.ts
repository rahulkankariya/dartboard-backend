import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";

// Internal Imports
import routes from "./api/routes";
import {
  publicCors,
  corsMiddleware,
  crashHandler,
  errorHandler,
  languageMiddleware,
  notFoundHandler,
  rateLimitMiddleware,
  xApiKeyMiddleware,
  patchMongoose,
  buildDebugRouter
} from "./middleware";

import { setupMetrics } from "./middleware/promothis";
import { requestLogger } from "./middleware/logger/logContext";

// Initialize Mongoose instrumentation
patchMongoose();

export const app = express();

/**
 * 1. SYSTEM SETTINGS
 */
app.set("query parser", "extended");
app.set("trust proxy", 1);

// 2. MONITORING & PERFORMANCE
setupMetrics(app);
app.use(compression());

// 3. SECURITY HEADERS & CORS
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.options(/(.*)/, corsMiddleware);
app.use(corsMiddleware);

/**
 * 4. DATA PARSING
 */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/**
 * 5. CUSTOM SANITIZATION (The "Getter" Fix)
 * This replaces express-mongo-sanitize to avoid the TypeError.
 * It recursively removes any keys starting with '$' or containing '.'
 */
app.use((req, res, next) => {
  const sanitize = (obj: any) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          const sanitizedKey = key.replace(/[\$.]/g, "_");
          obj[sanitizedKey] = obj[key];
          delete obj[key];
          if (typeof obj[sanitizedKey] === "object") sanitize(obj[sanitizedKey]);
        } else {
          if (typeof obj[key] === "object") sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.query);
  sanitize(req.body);
  sanitize(req.params);
  next();
});

app.use(hpp());

/**
 * 6. LOGGING & CONTEXT
 */
app.use(languageMiddleware);
app.use(requestLogger);

/**
 * 7. DIAGNOSTICS & ROUTES
 */
app.use("/debug", publicCors, buildDebugRouter());
// upload foldr access
import path from 'path';
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Static files bridge active: ${uploadsPath}`);
// Global Security
app.use(rateLimitMiddleware);
app.use(xApiKeyMiddleware);

// API v1 Routes
app.use("/api/v1", routes);

/**
 * 8. ERROR HANDLING
 */
app.use(notFoundHandler);
app.use(errorHandler);
app.use(crashHandler);