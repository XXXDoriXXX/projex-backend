
import { ZodSchema } from "zod";
import { RequestHandler } from "express";
import { ValidationError } from "../errors/CustomErrors";

type Part = "body" | "params" | "query";

export const validate =
    (schema: ZodSchema, part: Part = "body"): RequestHandler =>
        (req, _res, next) => {
            const parsed = schema.safeParse((req as any)[part]);
            if (!parsed.success) {
                const i = parsed.error.issues[0];
                return next(new ValidationError(i.message, i.path?.[0]?.toString()));
            }
            (req as any)[part] = parsed.data;
            next();
        };
