import { Router } from "express";
import {
  createDeployment,
  countDeployments,
  getDeploymentById,
  listDeployments,
} from "../services/deployment.service";
import { runPipeline } from "../pipeline/runner";
import {
  getLogs,
  subscribeLogs,
  unsubscribeLogs,
} from "../logs/log.store";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { gitUrl } = req.body;

    if (!gitUrl) {
      return res.status(400).json({ error: "gitUrl is required" });
    }

    const deployment = await createDeployment({
      sourceType: "git",
      source: gitUrl,
    });

    // 🔥 Trigger pipeline async (non-blocking)
    runPipeline(deployment.id);

    res.json(deployment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create deployment" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const deployments = await listDeployments();
    return res.json(deployments);
  } catch (err) {
    console.error("[deployments] failed to list deployments:", err);
    return res.status(500).json({ error: "Failed to list deployments" });
  }
});

router.get("/__debug/count", async (_req, res) => {
  try {
    const count = await countDeployments();
    return res.json({ count });
  } catch (err) {
    console.error("[deployments] failed to count deployments:", err);
    return res.status(500).json({ error: "Failed to count deployments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const deployment = await getDeploymentById(req.params.id);

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    return res.json(deployment);
  } catch (err) {
    console.error("[deployments] failed to fetch deployment:", err);
    return res.status(500).json({ error: "Failed to fetch deployment" });
  }
});


router.get("/:id/logs", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send existing logs first
  const existingLogs = getLogs(id);
  existingLogs.forEach((log) => {
    res.write(`data: ${log}\n\n`);
  });

  const sendLog = (log: string) => {
    res.write(`data: ${log}\n\n`);
  };

  subscribeLogs(id, sendLog);

  req.on("close", () => {
    unsubscribeLogs(id, sendLog);
  });
});


export default router;
