import { Router } from "express";
import {
  createDeployment,
  countDeployments,
  getDeploymentById,
  listDeployments,
} from "../services/deployment.service";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { gitUrl } = req.body;

    console.log("[deployments] POST /deployments body:", req.body);

    if (!gitUrl) {
      console.warn("[deployments] missing gitUrl");
      return res.status(400).json({ error: "gitUrl is required" });
    }

    const deployment = await createDeployment({
      sourceType: "git",
      source: gitUrl,
    });

    console.log("[deployments] created deployment:", deployment.id);
    return res.json(deployment);
  } catch (err) {
    console.error("[deployments] failed to create deployment:", err);
    return res.status(500).json({ error: "Failed to create deployment" });
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

export default router;
