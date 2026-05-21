let currentPort = 3001;

export const allocatePort = () => {
    return currentPort++;
};