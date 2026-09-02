import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { templatesRouter } from "./routes/templates.routes.js";
import { meRouter } from "./routes/me.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/pensum-templates", templatesRouter);
app.use("/api/me", meRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ePensum server listening on http://localhost:${PORT}`);
});
