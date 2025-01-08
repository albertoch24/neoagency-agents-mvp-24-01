const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryOperation(operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Operation failed, retrying... (${retries} attempts left)`);
      await delay(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}