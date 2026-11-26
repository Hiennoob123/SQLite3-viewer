export class DatabaseClient {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.nextRequestId = 0;
  }

  start() {
    const worker = new Worker(new URL('./database-worker.js', import.meta.url));
    this.worker = worker;

    worker.onmessage = ({ data }) => {
      const request = this.pending.get(data.id);
      if (!request) return;

      this.pending.delete(data.id);
      if (data.error) {
        request.reject(new Error(data.error));
      } else {
        request.resolve(data);
      }
    };

    worker.onerror = (event) => {
      event.preventDefault();
      this.stop(new Error('The SQLite engine could not load. Open a database to try again.'));
    };
  }

  request(action, payload = {}, transfer = []) {
    if (!this.worker) this.start();

    return new Promise((resolve, reject) => {
      const id = ++this.nextRequestId;
      this.pending.set(id, { resolve, reject });
      try {
        this.worker.postMessage({ id, action, ...payload }, transfer);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  stop(error = new DOMException('Operation cancelled.', 'AbortError')) {
    if (this.worker) this.worker.terminate();
    this.worker = null;

    for (const request of this.pending.values()) {
      request.reject(error);
    }
    this.pending.clear();
  }
}
