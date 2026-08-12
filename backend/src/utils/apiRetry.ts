export const retry = async <T> (
    operation: () => Promise<T>,
    options: {
        retries?: number;
        delay?: number;
    } = {}
): Promise<T> => {
    const retries = options.retries ?? 3;
    const delay = options.delay ?? 1000;
    
    let lastError: unknown;

    for(let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error;
            if(attempt === retries) break;
            const waitTime = delay * 2 ** attempt

            console.warn(
                `AI request failed. Retry ${attempt + 1}/${retries} in ${waitTime}ms`
            );

            await new Promise(resolve => setTimeout(resolve, waitTime))
        }
    }
    throw lastError;
}