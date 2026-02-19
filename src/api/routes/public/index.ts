import { Router } from 'express';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';


const router = Router();

router.use('/auth', authRoutes); // auth
router.use('/upload', uploadRoutes); // auth

export default router;
