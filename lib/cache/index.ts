import pino from "pino";

const logger = pino().child({ module: "lib/cache/index" });

export interface Cache {
  get: (key: string) => Promise<string | undefined>;
  set: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

type CachedValue = {
  at: Date;
  value: string;
};

export class InMemoryCache implements Cache {
  data: { [keyof: string]: CachedValue } = {};

  async get(key: string) {
    const value = this.data[key];
    if (value === undefined) {
      logger.info(`No cache entry found for ${key}`);
      return Promise.resolve(undefined);
    }
    logger.info(`Found cached entry for ${key}`);
    return Promise.resolve(value.value);
  }

  async set(key: string, value: string) {
    logger.info(`Setting cache entry for ${key}`);
    this.data[key] = { at: new Date(), value };
    return Promise.resolve();
  }

  async delete(key: string) {
    logger.info(`Deleting cache entry for ${key}`);
    delete this.data[key];
    return Promise.resolve();
  }

  async clear() {
    this.data = {};
    return Promise.resolve();
  }
}
