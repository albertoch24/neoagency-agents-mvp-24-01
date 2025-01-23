const logPrefix = '🔄 Cache:';

export const logQuery = {
  info: (message: string, data?: any) => {
    console.info(`${logPrefix} ${message}`, data ? {
      ...data,
      timestamp: new Date().toISOString()
    } : '');
  },
  error: (message: string, data?: any) => {
    console.error(`❌ ${message}`, data ? {
      ...data,
      timestamp: new Date().toISOString()
    } : '');
  }
};