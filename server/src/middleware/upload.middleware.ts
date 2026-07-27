import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadPath = process.env.UPLOAD_PATH || "uploads/";

// Create directories if they do not exist
const docsPath = path.join(uploadPath, "documents");
const ornamentsPath = path.join(uploadPath, "ornaments");
const profilesPath = path.join(uploadPath, "profiles");

if (!fs.existsSync(docsPath)) {
  fs.mkdirSync(docsPath, { recursive: true });
}
if (!fs.existsSync(ornamentsPath)) {
  fs.mkdirSync(ornamentsPath, { recursive: true });
}
if (!fs.existsSync(profilesPath)) {
  fs.mkdirSync(profilesPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePhoto" || file.fieldname === "profile") {
      cb(null, profilesPath);
    } else if (file.fieldname === "documents" || file.fieldname === "document") {
      cb(null, docsPath);
    } else {
      cb(null, ornamentsPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === "profilePhoto" || file.fieldname === "profile") {
    const allowedPhotoExtensions = [".jpg", ".jpeg", ".png"];
    if (allowedPhotoExtensions.includes(ext) && ["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid profile photo type. Only JPG, JPEG, and PNG images are allowed."));
    }
  } else if (file.fieldname === "documents" || file.fieldname === "document") {
    const allowedDocExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    if (allowedDocExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid document type. Only PDF, JPG, JPEG, PNG are allowed."));
    }
  } else {
    const allowedPhotoExtensions = [".jpg", ".jpeg", ".png"];
    if (allowedPhotoExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid photo type. Only JPG, JPEG, PNG are allowed."));
    }
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Default 10MB limit
  },
});

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Strict 5MB limit for profile photos
  },
});

export function deleteOldFile(relativeOrAbsolutePath: string) {
  if (!relativeOrAbsolutePath) return;
  try {
    const normalizedPath = relativeOrAbsolutePath.startsWith("/")
      ? relativeOrAbsolutePath.substring(1)
      : relativeOrAbsolutePath;
    const fullPath = path.resolve(normalizedPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Failed to delete old file:", relativeOrAbsolutePath, error);
  }
}
