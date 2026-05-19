type LogCallback = (log: string) => void;

const logs: Record<string, string[]> = {};
const subscribers: Record<string, LogCallback[]> = {};



export const addLog = (id: string, message: string) => {
    if (!logs[id]) logs[id] = [];
    logs[id].push(message);

    if (subscribers[id]) {
        subscribers[id].forEach((cb) => cb(message));
    }
};

export const getLogs = (id: string) => {
    return logs[id] || [];
};

export const subscribeLogs = (id: string, cb: LogCallback) => {
    if (!subscribers[id]) subscribers[id] = [];
    subscribers[id].push(cb);
};

export const unsubscribeLogs = (id: string, cb: LogCallback) => {
    subscribers[id] = (subscribers[id] || []).filter((c) => c !== cb);
};