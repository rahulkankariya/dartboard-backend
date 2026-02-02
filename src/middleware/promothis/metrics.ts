import client from 'prom-client';
import { Express } from 'express';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const setupMetrics = (app: Express) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};