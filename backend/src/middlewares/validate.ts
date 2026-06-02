import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny, source: "body" | "params" | "query") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errorResponse = { errors: result.error.issues.map((err) => ({ path: err.path.join("."), message: err.message })) };
      return res.status(400).json(errorResponse);
    }

    if (source !== "query") {
      req[source] = result.data;
    }
    next();
  };
};
