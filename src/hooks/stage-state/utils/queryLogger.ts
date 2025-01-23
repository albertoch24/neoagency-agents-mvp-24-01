type LogLevel = 'info' | 'error' | 'success';

interface LogContext {
  briefId?: string;
  stageId?: string;
  timestamp?: string;
  [key: string]: any;
}

const formatLogMessage = (message: string, context: LogContext = {}) => {
  return {
    ...context,
    timestamp: context.timestamp || new Date().toISOString()
  };
};

export const logQuery = {
  info: (message: string, context: LogContext = {}) => {
    console.log('🔄 Cache:', message, formatLogMessage(message, context));
  },
  
  error: (message: string, context: LogContext = {}) => {
    console.error('❌ Cache:', message, formatLogMessage(message, context));
  },
  
  success: (message: string, context: LogContext = {}) => {
    console.log('✅ Cache:', message, formatLogMessage(message, context));
  }
};