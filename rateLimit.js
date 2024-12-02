class RateLimiter {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastRequestTime = 0;
        this.minTimeBetweenRequests = 20000; // 20 seconds in milliseconds
    }

    async waitForToken() {
        return new Promise((resolve, reject) => {
            // Add request to queue
            this.queue.push({ resolve, reject });
            
            // Start processing if not already running
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.queue.length === 0 || this.processing) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeToWait = Math.max(0, this.lastRequestTime + this.minTimeBetweenRequests - now);

            if (timeToWait > 0) {
                // Show waiting message in UI if needed
                const secondsToWait = Math.ceil(timeToWait / 1000);
                document.querySelector('#poster-output').innerHTML = 
                    `<p>Waiting ${secondsToWait} seconds for rate limit...</p>`;
                
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }

            const { resolve } = this.queue.shift();
            this.lastRequestTime = Date.now();
            resolve(true);

            // Add a small buffer between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.processing = false;
    }

    clearQueue() {
        this.queue.forEach(({ reject }) => {
            reject(new Error('Queue cleared'));
        });
        this.queue = [];
        this.processing = false;
    }
}

const rateLimiter = new RateLimiter();
export default rateLimiter;