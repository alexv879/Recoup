// Simple logger for development - replace with proper logging service in production
export const logger = {
    info: (data: any, message?: string) => {
        if (message) {
            console.log(`[INFO] ${message}`, data);
        } else {
            console.log('[INFO]', data);
        }
    },
    error: (data: any, message?: string) => {
        if (message) {
            console.error(`[ERROR] ${message}`, data);
        } else {
            console.error('[ERROR]', data);
        }
    },
    warn: (data: any, message?: string) => {
        if (message) {
            console.warn(`[WARN] ${message}`, data);
        } else {
            console.warn('[WARN]', data);
        }
    },
};

// Convenience functions for logging
export const logInfo = (message: string, data?: any) => {
    logger.info(data, message);
};

export const logError = (message: string, error?: any, context?: any) => {
    logger.error({ ...error, ...context }, message);
};

export const logWarn = (message: string, data?: any) => {
    logger.warn(data, message);
};

export const logApiRequest = (method: string, url: string, data?: any) => {
    logger.info({ method, url, ...data }, 'API Request');
};

export const logApiResponse = (method: string, url: string, status: number, data?: any) => {
    logger.info({ method, url, status, ...data }, 'API Response');
};

export const logDbOperation = (operation: string, collection: string, data?: any, duration?: number) => {
    logger.info({ operation, collection, duration, ...data }, 'Database Operation');
};