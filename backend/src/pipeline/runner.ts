import { updateDeploymentStatus } from "../services/deployment.service";
import { addLog } from "../logs/log.store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runPipeline = async (deploymentId: string) => {
    try {
        // BUILDING
        await updateDeploymentStatus(deploymentId, "building");
        addLog(deploymentId, "Starting build...");
        await sleep(1500);

        addLog(deploymentId, "Installing dependencies...");
        await sleep(1500);

        addLog(deploymentId, "Building project...");
        await sleep(1500);

        // DEPLOYING
        await updateDeploymentStatus(deploymentId, "deploying");
        addLog(deploymentId, "Starting deployment...");
        await sleep(1500);

        addLog(deploymentId, "Allocating port...");
        await sleep(1000);

        // RUNNING
        const fakeUrl = `http://localhost/app/${deploymentId}`;

        await updateDeploymentStatus(deploymentId, "running", {
            imageTag: `app:${deploymentId}`,
            url: fakeUrl,
        });

        addLog(deploymentId, "Deployment successful 🚀");
    } catch (err) {
        await updateDeploymentStatus(deploymentId, "failed");
        addLog(deploymentId, "Deployment failed ❌");
    }
};