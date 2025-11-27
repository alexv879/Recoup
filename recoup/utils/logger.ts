// Simple logger for development - replace with proper logging service in production
export const logger = {
    info: (dataOrMessage: any, messageOrData?: any) => {
        // Support both (data, message) and (message, data) parameter orders
        if (typeof dataOrMessage === 'string' && typeof messageOrData === 'object') {
            // Called as (message, data)
            console.log(`[INFO] ${dataOrMessage}`, messageOrData);
        } else if (typeof dataOrMessage === 'object' && typeof messageOrData === 'string') {
            // Called as (data, message)
            console.log(`[INFO] ${messageOrData}`, dataOrMessage);
        } else if (messageOrData) {
            // Called as (data, message) with data being non-object
            console.log(`[INFO] ${messageOrData}`, dataOrMessage);
        } else {
            // Only one parameter
            console.log('[INFO]', dataOrMessage);
        }
    },
    error: (dataOrMessage: any, messageOrData?: any) => {
        // Support both (data, message) and (message, data) parameter orders
        if (typeof dataOrMessage === 'string' && typeof messageOrData === 'object') {
            // Called as (message, data)
            console.error(`[ERROR] ${dataOrMessage}`, messageOrData);
        } else if (typeof dataOrMessage === 'object' && typeof messageOrData === 'string') {
            // Called as (data, message)
            console.error(`[ERROR] ${messageOrData}`, dataOrMessage);
        } else if (messageOrData) {
            // Called as (data, message) with data being non-object
            console.error(`[ERROR] ${messageOrData}`, dataOrMessage);
        } else {
            // Only one parameter
            console.error('[ERROR]', dataOrMessage);
        }
    },
    warn: (dataOrMessage: any, messageOrData?: any) => {
        // Support both (data, message) and (message, data) parameter orders
        if (typeof dataOrMessage === 'string' && typeof messageOrData === 'object') {
            // Called as (message, data)
            console.warn(`[WARN] ${dataOrMessage}`, messageOrData);
        } else if (typeof dataOrMessage === 'object' && typeof messageOrData === 'string') {
            // Called as (data, message)
            console.warn(`[WARN] ${messageOrData}`, dataOrMessage);
        } else if (messageOrData) {
            // Called as (data, message) with data being non-object
            console.warn(`[WARN] ${messageOrData}`, dataOrMessage);
        } else {
            // Only one parameter
            console.warn('[WARN]', dataOrMessage);
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