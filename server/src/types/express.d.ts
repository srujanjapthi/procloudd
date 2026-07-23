import type { AuthenticatedUser } from "@/common/auth/authorization.interface.js";

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: User;
    }
  }
}
