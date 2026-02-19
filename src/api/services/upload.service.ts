// services/upload.service.ts
import path from 'path';
import fs from 'fs/promises';


export class UploadService {
  public static readonly CONFIG = {
    maxCount: 5,
    maxSize: 10 * 1024 * 1024,
    allowedFormats: ['.jpg', '.jpeg', '.png', '.pdf','.mp3']
  };

  public static async cleanupFiles(files: Express.Multer.File[]): Promise<void> {
    try {
      await Promise.all(files.map(file => fs.unlink(file.path)));
    } catch (error) {
      console.error('❌ Cleanup Error:', error);
    }
  }

  public static validateFiles(files: Express.Multer.File[]): string | null {
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!this.CONFIG.allowedFormats.includes(ext)) {
        return `Invalid format: ${ext}`;
      }
    }
    return null;
  }

  /**
   * Saves metadata to DB and returns the managed object
   */
  public static async processUpload(file: Express.Multer.File) {
    const newFile = {
      originalName: file.originalname,
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      fullOSPath: path.resolve(file.path),

    }

    return newFile;
  }
}