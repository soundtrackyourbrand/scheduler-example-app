import { getLogger } from "lib/logger";

const logger = getLogger("lib/cache/index");

export interface Cache {
  get: (key: string) => Promise<string | undefined>;
  set: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  count: () => Promise<number>;
}

type CachedValue = {
  at: Date;
  value: string;
};

export class InMemoryCache implements Cache {
  data: { [keyof: string]: CachedValue } = {};

  constructor() {
    logger.info("Creating InMemoryCache");
  }

  async get(key: string) {
    const value = this.data[key];
    if (value === undefined) {
      logger.debug(`No cache entry found for ${key}`);
      return Promise.resolve(undefined);
    }
    logger.debug(`Found cached entry for ${key}`);
    return Promise.resolve(value.value);
  }

  async set(key: string, value: string) {
    logger.debug(`Setting cache entry for ${key}`);
    this.data[key] = { at: new Date(), value };
    return Promise.resolve();
  }

  async delete(key: string) {
    logger.debug(`Deleting cache entry for ${key}`);
    delete this.data[key];
    return Promise.resolve();
  }

  async clear() {
    logger.debug(`Clearing cache`);
    this.data = {};
    return Promise.resolve();
  }

  async count() {
    logger.debug(`Counting items in cache`);
    return Promise.resolve(Object.keys(this.data).length);
  }
}
