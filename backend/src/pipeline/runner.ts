import { updateDeploymentStatus } from "../services/deployment.service";
import { addLog } from "../logs/log.store";
import { runCommand } from "../utils/exec";
import { getDeploymentPath } from "../utils/paths";
import { allocatePort } from "../utils/ports";

export const runPipeline = async (
    deploymentId: string,
    gitUrl: string
) => {
    const deploymentPath = getDeploymentPath(deploymentId);
    const imageTag = `app-${deploymentId}`;
    const port = allocatePort();

    try {
        // ----------------------------
        // BUILDING
        // ----------------------------
        await updateDeploymentStatus(deploymentId, "building");

        addLog(deploymentId, "Cloning repository...");

        await runCommand(
            `git clone ${gitUrl} .`,
            deploymentPath,
            (log) => addLog(deploymentId, log)
        );

        addLog(deploymentId, "Repository cloned.");

        // ----------------------------
        // RAILPACK BUILD
        // ----------------------------
        addLog(deploymentId, "Building image with Railpack...");

        await runCommand(
            `railpack build -t ${imageTag} .`,
            deploymentPath,
            (log) => addLog(deploymentId, log)
        );

        addLog(deploymentId, "Image build complete.");

        // ----------------------------
        // DEPLOYING
        // ----------------------------
        await updateDeploymentStatus(deploymentId, "deploying");

        addLog(deploymentId, "Starting container...");

        await runCommand(
            `docker run -d --name ${imageTag} -p ${port}:3000 ${imageTag}`,
            deploymentPath,
            (log) => addLog(deploymentId, log)
        );

        const url = `http://localhost:${port}`;

        // ----------------------------
        // RUNNING
        // ----------------------------
        await updateDeploymentStatus(deploymentId, "running", {
            imageTag,
            url,
        });

        addLog(deploymentId, `Deployment live at ${url}`);
    } catch (err: any) {
        console.error(err);

        await updateDeploymentStatus(deploymentId, "failed");

        addLog(deploymentId, `ERROR: ${err.message}`);
    }
};