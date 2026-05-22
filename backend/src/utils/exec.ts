import { execa } from "execa";

export const runCommand = async (
    command: string,
    cwd?: string,
    onLog?: (msg: string) => void
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const subprocess = execa(command, {
            cwd,
            shell: true,
        });

        subprocess.stdout?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg) onLog?.(msg);
        });

        subprocess.stderr?.on("data", (data) => {
            const msg = data.toString().trim();
            if (msg) onLog?.(msg);
        });

        subprocess
            .then((result) => {
                resolve(result);
            })
            .catch((err) => {
                reject(new Error(err.message || "Command failed"));
            });
    });
};