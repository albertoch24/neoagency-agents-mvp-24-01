export class ErrorHandler {
  static async handleError(error: any, context: any, recoveryFn?: () => Promise<any>) {
    console.error('Error occurred:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    const structuredError = this.createStructuredError(error, context);

    if (recoveryFn) {
      try {
        console.log('Attempting error recovery...');
        return await recoveryFn();
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        throw structuredError;
      }
    }

    throw structuredError;
  }

  private static createStructuredError(error: any, context: any) {
    const timestamp = new Date().toISOString();
    const errorId = `ERR_${context.resource?.toUpperCase()}_${Date.now()}`;

    return {
      code: errorId,
      message: error.message || 'An unexpected error occurred',
      category: context.resource || 'unknown',
      context,
      stack: error.stack,
      metrics: {
        timestamp,
        errorType: error.constructor.name,
        severity: 'low',
        resource: context.resource,
        impact: 'minimal-impact',
        retryCount: context.retryCount || 0,
        performanceMetrics: {
          duration: context.duration || 0,
          memoryUsage: Deno.memoryUsage().heapUsed
        }
      }
    };
  }
}