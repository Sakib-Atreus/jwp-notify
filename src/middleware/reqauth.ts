import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const JWPLAYER_WEBHOOK_SECRET = process.env.JWPLAYER_WEBHOOK_SECRET;
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!JWPLAYER_WEBHOOK_SECRET || token !== JWPLAYER_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  }