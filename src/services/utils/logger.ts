export const logger = {
  log: (message: string, data?: any) => {
    console.log(`[AI Provider Service] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[AI Provider Service - ERROR] ${message}`, error || '');
  }
};