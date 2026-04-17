import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: "User not found" });
          return;
        }
        req.authUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        };
        next();
      })
      .catch(() => {
        res.status(500).json({ error: "Auth lookup failed" });
      });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
