// routes/upload.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { UploadController } from '../../controllers';


const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage }).array('files', 5);

router.post('/bulk', (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    UploadController.uploadMultiple(req, res);
  });
});

export default router;