import { updateDeploymentStatus } from "../services/deployment.service";
import { addLog } from "../logs/log.store";
import { runCommand } from "../utils/exec";
import { getDeploymentPath } from "../utils/paths";
import { allocatePort } from "../utils/ports";

export const runPipeline = async (
    deploymentId: string,
    source: string
) => {
    const deploymentPath = getDeploymentPath(deploymentId);
    const imageTag = `app-${deploymentId}`;
    const port = allocatePort();
    const containerName = `brimble-${deploymentId}`;
    const buildkitName = `buildkit-${deploymentId}`;

    try {
        // BUILDING
        await updateDeploymentStatus(deploymentId, "building");

        // If source is a file:// path, assume code is already in deploymentPath
        if (source.startsWith('file://')) {
            addLog(deploymentId, "📦 Using uploaded project archive (extracted to deployment path)...");
        } else {
            addLog(deploymentId, "🔄 Cloning repository...");

            try {
                await runCommand(
                    `git clone ${source} .`,
                    deploymentPath,
                    (log) => addLog(deploymentId, log)
                );
            } catch (gitErr) {
                throw new Error(`Git clone failed: ${gitErr}`);
            }

            addLog(deploymentId, "✅ Repository cloned.");
        }

        // START BUILDKIT
        addLog(deploymentId, "🔧 Starting BuildKit...");
        try {
            await runCommand(
                `docker run --rm --privileged -d --name ${buildkitName} moby/buildkit`,
                undefined,
                (log) => addLog(deploymentId, log)
            );
            // Give BuildKit a moment to start
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            addLog(deploymentId, "⚠️ BuildKit may already be running, continuing...");
        }

        // RAILPACK BUILD
        addLog(deploymentId, "🔨 Building image with Railpack...");

        try {
            await runCommand(
                `BUILDKIT_HOST=docker-container://${buildkitName} railpack build --name ${imageTag} .`,
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

        try {
            await runCommand(
                `docker rm -f ${containerName} 2>/dev/null || true`,
                undefined,
                (log) => addLog(deploymentId, log)
            );

            await runCommand(
                `docker run -d --name ${containerName} -p ${port}:3000 ${imageTag}`,
                undefined,
                (log) => addLog(deploymentId, log)
            );
        } catch (dockerErr) {
            throw new Error(`Docker run failed: ${dockerErr}`);
        }

        const url = `http://localhost:${port}`;

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
    } finally {
        // Clean up BuildKit container
        await runCommand(
            `docker rm -f ${buildkitName} 2>/dev/null || true`,
            undefined
        ).catch(() => {});
    }
};
