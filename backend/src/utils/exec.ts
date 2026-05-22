import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runCommand = async (
    command: string,
    cwd?: string,
    onLog?: (msg: string) => void
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const child = exec(command, { cwd }, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(err.message || "Command failed"));
            } else {
                resolve({ stdout, stderr });
            }
        });

        // Stream output in real-time
        child.stdout?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg) onLog?.(msg);
        });

        child.stderr?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg) onLog?.(msg);
        });
    });
};