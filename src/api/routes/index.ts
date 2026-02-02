import { Router } from 'express';
import * as publicRoutes from './public';

const router = Router();

router.use('/', publicRoutes.default); // Public routes

export default router;