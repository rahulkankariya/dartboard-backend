import { Router } from 'express';
import authRoutes from './auth.routes';


const router = Router();

router.use('/auth', authRoutes); // auth

export default router;
