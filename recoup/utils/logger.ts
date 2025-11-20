// Simple logger for development - replace with proper logging service in production
export const logger = {
    info: (messageOrData: string | any, dataOrMessage?: any) => {
        if (typeof messageOrData === 'string') {
            // Called as (message, data)
            console.log(`[INFO] ${messageOrData}`, dataOrMessage || '');
        } else if (typeof dataOrMessage === 'string') {
            // Called as (data, message)
            console.log(`[INFO] ${dataOrMessage}`, messageOrData);
        } else {
            // Called with just data
            console.log('[INFO]', messageOrData);
        }
    },
    error: (messageOrData: string | any, dataOrMessage?: any) => {
        if (typeof messageOrData === 'string') {
            // Called as (message, data)
            console.error(`[ERROR] ${messageOrData}`, dataOrMessage || '');
        } else if (typeof dataOrMessage === 'string') {
            // Called as (data, message)
            console.error(`[ERROR] ${dataOrMessage}`, messageOrData);
        } else {
            // Called with just data
            console.error('[ERROR]', messageOrData);
        }
    },
    warn: (messageOrData: string | any, dataOrMessage?: any) => {
        if (typeof messageOrData === 'string') {
            // Called as (message, data)
            console.warn(`[WARN] ${messageOrData}`, dataOrMessage || '');
        } else if (typeof dataOrMessage === 'string') {
            // Called as (data, message)
            console.warn(`[WARN] ${dataOrMessage}`, messageOrData);
        } else {
            // Called with just data
            console.warn('[WARN]', messageOrData);
        }
    },
};

// Convenience functions for logging
export const logInfo = (message: string, data?: any) => {
    logger.info(data, message);
};

export const logError = (message: string, error?: any) => {
    logger.error(error, message);
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

export const logDbOperation = (operation: string, collection: string, data?: any) => {
    logger.info({ operation, collection, ...data }, 'Database Operation');
};