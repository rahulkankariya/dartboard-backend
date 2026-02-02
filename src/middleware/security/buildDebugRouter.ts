import express, { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { ALLOW_NULL, ALLOWED_ORIGINS } from "./cors";


/**
 * PILLAR 5: Health & Inspection
 * Designed to match the 'OptionsDelegate' style logic.
 */
export function buildDebugRouter(): Router {
  const router = express.Router();

  // Helper to log to terminal for Pillar 4 (Audit Trail)
  const logDebug = (route: string, data: any) => {
    console.log(`\x1b[36m[DEBUG] ${route}\x1b[0m`, JSON.stringify(data, null, 2));
  };

  // 1. Status Check (Pillar 3: Query Profiler Health)
  router.get("/status", (req: Request, res: Response) => {
    const data = {
      status: "online",
      database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      uptime: `${Math.floor(process.uptime())}s`
    };
    logDebug(req.path, data);
    res.json(data);
  });

  // 2. CORS Simulation (Pillar 1: Domain Gatekeeper)
  router.get("/cors", (req: Request, res: Response) => {
    const originHeader = req.headers["origin"] as string | undefined;
    
    // This matches your Delegate logic exactly
    const isAllowed = !originHeader ? ALLOW_NULL : ALLOWED_ORIGINS.includes(originHeader);

    const data = {
      detectedOrigin: originHeader ?? "None (Server-to-Server)",
      isAllowed,
      resolution: isAllowed ? (originHeader ?? "true") : "false",
      whitelist: ALLOWED_ORIGINS
    };

    logDebug(req.path, data);
    res.json(data);
  });

  // 3. Header Inspection (Pillar 2: Service Authenticator)
  router.get("/headers", (req: Request, res: Response) => {
    const rawHeaders = { ...req.headers };
    
    // Redact sensitive keys for safety in logs
    ["x-api-key", "authorization", "cookie"].forEach(key => {
      if (rawHeaders[key]) rawHeaders[key] = "[redacted]";
    });

    const data = {
      method: req.method,
      protocol: req.protocol,
      headers: rawHeaders
    };

    logDebug(req.path, data);
    res.json(data);
  });

  return router;
}