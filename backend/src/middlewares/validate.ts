import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

// Middleware factory: takes a Zod schema and validates a part of the request
// (body / params / query) before the controller runs.
//
// TODO (you write this):
//   - run schema.safeParse on the chosen source (req.body / req.params / req.query)
//   - on failure -> res.status(400).json({ errors: ... }) and return
//   - on success -> overwrite req[source] with the parsed data, then next()

export const validateRequest = (schema: ZodTypeAny, source: "body" | "params" | "query") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errorResponse = { errors: result.error.issues.map((err) => ({ path: err.path.join("."), message: err.message })) };
      return res.status(400).json(errorResponse);
    }
    // Express 5: req.query is a getter-only property and cannot be reassigned.
    // params/body are writable, so we only persist the parsed (and sanitized)
    // data for those sources. Query is validated for correctness only.
    if (source !== "query") {
      req[source] = result.data;
    }
    next();
  };
};
