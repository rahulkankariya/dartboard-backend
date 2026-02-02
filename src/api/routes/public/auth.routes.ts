import { Router } from 'express';
import { AuthController } from '../../controllers';
const router = Router();


router.post('/register', AuthController.signup);
router.post('/login', AuthController.login);

export default router;
