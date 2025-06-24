"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupFiles = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create uploads directory if it doesn't exist
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
// File filter to accept only valid file types
const fileFilter = (req, file, cb) => {
    const validFileTypes = ['.xlsx', '.xls', '.csv', '.txt'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (validFileTypes.includes(ext)) {
        return cb(null, true);
    }
    cb(new Error('Invalid file type. Only XLS, XLSX, CSV, and TXT files are allowed.'));
};
// Setup multer
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
});
// Middleware to clean up uploaded files after processing
const cleanupFiles = (req, res, next) => {
    const files = req.files;
    const file = req.file;
    // Handler to clean up files after response is sent
    const cleanup = () => {
        try {
            // Clean up single file
            if (file && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            // Clean up multiple files
            if (files) {
                if (Array.isArray(files)) {
                    files.forEach(f => {
                        if (fs_1.default.existsSync(f.path)) {
                            fs_1.default.unlinkSync(f.path);
                        }
                    });
                }
                else {
                    // Handle files object with keys
                    Object.keys(files).forEach(key => {
                        const fileArray = files[key];
                        fileArray.forEach((f) => {
                            if (fs_1.default.existsSync(f.path)) {
                                fs_1.default.unlinkSync(f.path);
                            }
                        });
                    });
                }
            }
        }
        catch (err) {
            console.error('Error cleaning up files:', err);
        }
    };
    // Execute cleanup after response is sent
    res.on('finish', cleanup);
    next();
};
exports.cleanupFiles = cleanupFiles;
exports.default = upload;
//# sourceMappingURL=fileUpload.js.map