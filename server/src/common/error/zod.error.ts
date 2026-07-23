import type { ZodError } from "zod";

export interface FieldError {
  field: string;
  message: string;
}

export function format(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
