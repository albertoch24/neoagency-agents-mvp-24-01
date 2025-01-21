interface ErrorMetrics {
  timestamp: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resource: string;
  impact: string;
  retryCount: number;
  performanceMetrics?: {
    duration: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

interface StructuredError {
  code: string;
  message: string;
  category: 'validation' | 'processing' | 'system' | 'network';
  context: Record<string, any>;
  stack?: string;
  metrics: ErrorMetrics;
}

export class ErrorHandler {
  private static errorPatterns: Map<string, number> = new Map();
  private static readonly MAX_RETRIES = 3;
  
  static createStructuredError(
    error: Error,
    category: StructuredError['category'],
    context: Record<string, any>
  ): StructuredError {
    const metrics: ErrorMetrics = {
      timestamp: new Date().toISOString(),
      errorType: error.name,
      severity: this.calculateSeverity(error, context),
      resource: context.resource || 'unknown',
      impact: this.assessImpact(error, context),
      retryCount: context.retryCount || 0,
      performanceMetrics: {
        duration: context.duration || 0,
        memoryUsage: process.memoryUsage().heapUsed,
      },
    };

    return {
      code: `ERR_${category.toUpperCase()}_${Date.now()}`,
      message: error.message,
      category,
      context,
      stack: error.stack,
      metrics,
    };
  }

  private static calculateSeverity(error: Error, context: Record<string, any>): ErrorMetrics['severity'] {
    if (error.name === 'SystemError' || context.critical) return 'critical';
    if (error.name === 'ProcessingError') return 'high';
    if (error.name === 'ValidationError') return 'medium';
    return 'low';
  }

  private static assessImpact(error: Error, context: Record<string, any>): string {
    if (context.affectedUsers > 100) return 'high-user-impact';
    if (context.dataLoss) return 'data-integrity-risk';
    if (context.performance) return 'performance-degradation';
    return 'minimal-impact';
  }

  static async handleError(
    error: Error,
    context: Record<string, any>,
    fallbackFn?: () => Promise<any>
  ): Promise<any> {
    const structuredError = this.createStructuredError(
      error,
      this.categorizeError(error),
      context
    );

    console.error('Structured Error:', {
      code: structuredError.code,
      message: structuredError.message,
      category: structuredError.category,
      metrics: structuredError.metrics,
    });

    // Track error patterns
    this.trackErrorPattern(structuredError);

    // Attempt recovery
    return this.attemptRecovery(structuredError, fallbackFn);
  }

  private static categorizeError(error: Error): StructuredError['category'] {
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'SystemError') return 'system';
    if (error.name === 'NetworkError') return 'network';
    return 'processing';
  }

  private static trackErrorPattern(error: StructuredError): void {
    const patternKey = `${error.category}:${error.code}`;
    const currentCount = this.errorPatterns.get(patternKey) || 0;
    this.errorPatterns.set(patternKey, currentCount + 1);

    // Alert on recurring patterns
    if (currentCount + 1 >= 3) {
      console.warn('Error Pattern Detected:', {
        pattern: patternKey,
        occurrences: currentCount + 1,
        timeframe: '1h',
      });
    }
  }

  private static async attemptRecovery(
    error: StructuredError,
    fallbackFn?: () => Promise<any>
  ): Promise<any> {
    // If retries are available, attempt retry with exponential backoff
    if (error.metrics.retryCount < this.MAX_RETRIES) {
      const backoffTime = Math.pow(2, error.metrics.retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      if (fallbackFn) {
        try {
          return await fallbackFn();
        } catch (retryError) {
          error.metrics.retryCount++;
          return this.handleError(retryError as Error, error.context, fallbackFn);
        }
      }
    }

    // If no more retries or no fallback, throw the structured error
    throw error;
  }
}