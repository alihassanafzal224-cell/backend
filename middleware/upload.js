import multer from "multer";

const storage = multer.memoryStorage(); // Keep file in memory
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov|avi/;
  const extName = allowedTypes.test(file.originalname.toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) cb(null, true);
  else cb(new Error("Only image and video files are allowed"));
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
