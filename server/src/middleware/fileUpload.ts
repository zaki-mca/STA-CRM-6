import multer from 'multer';
import path from 'path';
import { Response, NextFunction } from 'express';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept only valid file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validFileTypes = ['.xlsx', '.xls', '.csv', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (validFileTypes.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only XLS, XLSX, CSV, and TXT files are allowed.'));
};

// Setup multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

// Middleware to clean up uploaded files after processing
export const cleanupFiles = (req: Express.Request, res: Response, next: NextFunction) => {
  const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
  const file = (req as any).file as Express.Multer.File | undefined;
  
  // Handler to clean up files after response is sent
  const cleanup = () => {
    try {
      // Clean up single file
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      // Clean up multiple files
      if (files) {
        if (Array.isArray(files)) {
          files.forEach(f => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });
        } else {
          // Handle files object with keys
          Object.keys(files).forEach(key => {
            const fileArray = files[key];
            fileArray.forEach((f: Express.Multer.File) => {
              if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            });
          });
        }
      }
    } catch (err) {
      console.error('Error cleaning up files:', err);
    }
  };
  
  // Execute cleanup after response is sent
  res.on('finish', cleanup);
  
  next();
};

export default upload; 