import { Router } from "express";
import {
  createDeployment,
  getDeploymentById,
  listDeployments,
} from "../services/deployment.service";

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

    return res.json(deployment);
  } catch (_err) {
    return res.status(500).json({ error: "Failed to create deployment" });
  }
});

router.get("/", async (_req, res) => {
  const deployments = await listDeployments();
  return res.json(deployments);
});

router.get("/:id", async (req, res) => {
  const deployment = await getDeploymentById(req.params.id);

  if (!deployment) {
    return res.status(404).json({ error: "Deployment not found" });
  }

  return res.json(deployment);
});

export default router;
