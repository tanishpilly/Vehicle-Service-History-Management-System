const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

// Local fallback storage directory (uses os.tmpdir() in serverless environments or local uploads folder)
const localUploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'insurance_docs')
  : path.join(__dirname, '../uploads/insurance_docs');

if (!isCloudinaryConfigured && !fs.existsSync(localUploadDir)) {
  try {
    fs.mkdirSync(localUploadDir, { recursive: true });
  } catch (e) {
    // Ignore if directory exists
  }
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExts = ['.pdf', '.jpeg', '.jpg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

// Use memoryStorage if Cloudinary is configured (uploading directly from memory to cloud),
// otherwise diskStorage for local development fallback
const storage = isCloudinaryConfigured
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, localUploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `doc-${uniqueSuffix}${ext}`);
      }
    });

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

// Cloudinary upload helper stream
const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const cleanPublicId = `insurance-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'vehicle_service_dbms',
        public_id: cleanPublicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Middleware wrapper that processes files with Cloudinary if configured
const uploadMiddleware = {
  array: (fieldName, maxCount) => {
    const uploader = multerUpload.array(fieldName, maxCount);

    return (req, res, next) => {
      uploader(req, res, async (err) => {
        if (err) return next(err);

        // If Cloudinary is configured and files were uploaded to memory, upload them to Cloudinary
        if (isCloudinaryConfigured && req.files && req.files.length > 0) {
          try {
            for (const file of req.files) {
              const cloudResult = await uploadBufferToCloudinary(file.buffer, file.originalname);
              file.path = cloudResult.secure_url; // Store persistent cloud CDN URL
              file.filename = cloudResult.public_id;
              file.isCloud = true;
            }
          } catch (uploadErr) {
            console.error('Cloudinary upload failure:', uploadErr);
            return res.status(500).json({
              success: false,
              message: 'Failed to upload insurance document to cloud storage.',
              error: uploadErr.message
            });
          }
        }
        next();
      });
    };
  },
  isCloudinaryConfigured,
  cloudinary
};

module.exports = uploadMiddleware;
