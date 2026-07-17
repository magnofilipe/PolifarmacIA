import express from "express";
import cors from "cors";

import analysisRoutes from "./routes/analysis.routes.js";
import authRoutes from "./routes/auth.routes.js";
import patientsRoutes from "./routes/patients.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/analysis", analysisRoutes);

export default app;