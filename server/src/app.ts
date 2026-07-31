import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@/middlewares/error.middleware.js";
import * as ApiResponse from "@/common/http/api-response.util.js";
import ROUTES from "@/common/constants/routes.constant.js";
import otpRoutes from "@/modules/otp/otp.routes.js";
import userRoutes from "@/modules/user/user.routes.js";
import authRoutes from "@/modules/auth/auth.routes.js";
import twoFactorRoutes from "@/modules/twofactor/twofactor.routes.js";
import directoryRoutes from "@/modules/directory/directory.routes.js";
import fileRoutes from "@/modules/file/file.routes.js";
import trashRoutes from "@/modules/trash/trash.routes.js";
import statsRoutes from "@/modules/stats/stats.routes.js";
import env from "@/config/env.config.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(env.SESSION_SECRET));

app.get(ROUTES.health, (_req, res) => {
  ApiResponse.success(res, { status: "ok" }, { message: "Success :)" });
});

app.use(otpRoutes);
app.use(userRoutes);
app.use(authRoutes);
app.use(twoFactorRoutes);
app.use(directoryRoutes);
app.use(fileRoutes);
app.use(trashRoutes);
app.use(statsRoutes);

app.use(errorMiddleware);

export default app;
