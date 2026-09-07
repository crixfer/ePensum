import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { templatesRouter } from "./routes/templates.routes.js";
import { meRouter } from "./routes/me.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");
    // The frontend and API are served from the same Vercel domain in production,
    // so always trust same-host requests instead of relying solely on CLIENT_ORIGIN.
    const selfOrigin = `${req.protocol}://${req.get("host")}`;
    const normalizedOrigin = origin?.replace(/\/$/, "");
    const allowed =
      !origin || normalizedOrigin === selfOrigin || allowedOrigins.includes(normalizedOrigin ?? "");

    callback(null, { origin: allowed, credentials: true });
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/pensum-templates", templatesRouter);
app.use("/api/me", meRouter);

app.use(errorHandler);

export { app };