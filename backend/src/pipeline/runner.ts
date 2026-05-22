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
        // BUILDING
        await updateDeploymentStatus(deploymentId, "building");

        addLog(deploymentId, "🔄 Cloning repository...");

        try {
            await runCommand(
                `git clone ${gitUrl} .`,
                deploymentPath,
                (log) => addLog(deploymentId, log)
            );
        } catch (gitErr) {
            throw new Error(`Git clone failed: ${gitErr}`);
        }

        addLog(deploymentId, "✅ Repository cloned.");

        // RAILPACK BUILD
        addLog(deploymentId, "🔨 Building image with Railpack...");

        try {
            await runCommand(
                `railpack build -t ${imageTag} .`,
                deploymentPath,
                (log) => addLog(deploymentId, log)
            );
        } catch (buildErr) {
            throw new Error(`Railpack build failed: ${buildErr}`);
        }

        addLog(deploymentId, "✅ Image build complete.");

        // DEPLOYING
        await updateDeploymentStatus(deploymentId, "deploying");

        addLog(deploymentId, "🚀 Starting container...");

        // Generate unique container name to avoid conflicts
        const containerName = `brimble-${deploymentId}`;

        try {
            // Clean up any existing container with same name
            await runCommand(
                `docker rm -f ${containerName} 2>/dev/null || true`,
                deploymentPath,
                (log) => addLog(deploymentId, log)
            );

            // Run container with proper port mapping
            await runCommand(
                `docker run -d --name ${containerName} -p ${port}:3000 ${imageTag}`,
                deploymentPath,
                (log) => addLog(deploymentId, log)
            );
        } catch (dockerErr) {
            throw new Error(`Docker run failed: ${dockerErr}`);
        }

        const url = `http://localhost:${port}`;

        // RUNNING
        await updateDeploymentStatus(deploymentId, "running", {
            imageTag,
            url,
            port: port.toString(),
        });

        addLog(deploymentId, `✅ Deployment live at ${url}`);
    } catch (err: any) {
        console.error("[pipeline]", err);

        await updateDeploymentStatus(deploymentId, "failed");

        addLog(deploymentId, `❌ ERROR: ${err.message}`);
    }
};