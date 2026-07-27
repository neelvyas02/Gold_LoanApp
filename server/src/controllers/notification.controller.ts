import type { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service.js";

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await NotificationService.getNotifications();
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const notification = await NotificationService.markAsRead(id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}
