import { execa } from "execa";

export const runCommand = async (
    command: string,
    cwd?: string,
    onLog?: (msg: string) => void
) => {
    const subprocess = execa(command, {
        cwd,
        shell: true,
    });

    subprocess.stdout?.on("data", (data) => {
        onLog?.(data.toString());
    });

    subprocess.stderr?.on("data", (data) => {
        onLog?.(data.toString());
    });

    return subprocess;
};