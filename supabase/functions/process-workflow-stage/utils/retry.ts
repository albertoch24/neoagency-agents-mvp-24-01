const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options = { 
    maxRetries: MAX_RETRIES, 
    initialDelay: INITIAL_DELAY,
    onRetry?: (error: Error, attempt: number) => void 
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (options.onRetry) {
        options.onRetry(error, attempt);
      }
      
      if (attempt < options.maxRetries) {
        const delayTime = options.initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  
  throw lastError;
}