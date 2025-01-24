export const logger = {
    info: (message: string, ...args: any[]) => {
        console.log(`[${new Date().toISOString()}] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[${new Date().toISOString()}] ${message}`, ...args);
    }
}; 