import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const { previousFilePath } = req.body;

    // Delete previous file if replacing
    if (previousFilePath && typeof previousFilePath === "string" && previousFilePath.startsWith("/uploads/")) {
      try {
        const fullPrevPath = path.resolve(process.cwd(), previousFilePath.substring(1));
        if (fs.existsSync(fullPrevPath)) {
          fs.unlinkSync(fullPrevPath);
        }
      } catch (err) {
        console.warn("[UploadController] Failed to delete previous file:", err);
      }
    }

    const filePath = `/uploads/documents/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        filePath,
        fileName: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadOrnament(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const filePath = `/uploads/ornaments/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        filePath,
        fileName: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
}
