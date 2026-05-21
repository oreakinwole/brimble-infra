import path from "path";
import fs from "fs";

export const getDeploymentPath = (id: string) => {
    const dir = path.join(process.cwd(), "deployments", id);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
};