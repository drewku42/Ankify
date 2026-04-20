import { Request, Response, NextFunction, RequestHandler } from "express";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Express 4 doesn't catch async errors — this wrapper forwards them to next(). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
