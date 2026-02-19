// controllers/upload.controller.ts
import { Request, Response } from 'express';
import { UploadService } from '../services';


export class UploadController {
  public static async uploadMultiple(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    // Assuming your auth middleware populates req.user
    const userId = (req as any).user?._id; 

    try {
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files' });
      }

      const error = UploadService.validateFiles(files);
      if (error) {
        await UploadService.cleanupFiles(files);
        return res.status(400).json({ success: false, message: error });
      }

      // Process and Save to DB
      const savedFiles = await Promise.all(
        files.map(file => UploadService.processUpload(file))
      );

      return res.status(201).json({
        success: true,
        message: 'Files uploaded and indexed successfully',
        data: savedFiles
      });

    } catch (err: any) {
      if (files) await UploadService.cleanupFiles(files);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}