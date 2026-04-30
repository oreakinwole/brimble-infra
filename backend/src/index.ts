import express from "express";
import cors from "cors";
import deploymentsRouter from "./routes/deployments";
import { prisma } from "./db";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/deployments", deploymentsRouter);

app.get("/", (_req, res) => {
  res.send("API running");
});

const PORT = 4000;

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const start = async () => {
  try {
    await prisma.$connect();
    console.log("[server] Prisma connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] failed to start:", err);
    process.exitCode = 1;
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
});

void start();
