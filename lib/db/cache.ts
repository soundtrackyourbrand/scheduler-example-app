import { Cache } from "../cache/index.js";
import { CacheEntry } from "./index.js";
import { getLogger } from "../logger/index.js";

const logger = getLogger("lib/db/cache");

export class SequelizeCache implements Cache {
  constructor() {
    logger.info("Creating SequelizeCache");
  }

  async get(key: string): Promise<string | undefined> {
    const entry = await CacheEntry.findByPk(key);
    if (!entry) {
      logger.debug(`No cache entry found for ${key}`);
      return undefined;
    }
    logger.debug(`Found cached entry for ${key}`);
    return entry.get("value") as string;
  }

  async set(key: string, value: string): Promise<void> {
    logger.debug(`Setting cache entry for ${key}`);
    await CacheEntry.upsert({ key, value });
  }

  async delete(key: string): Promise<void> {
    logger.debug(`Deleting cache entry for ${key}`);
    await CacheEntry.destroy({ where: { key } });
  }

  async clear(): Promise<void> {
    logger.debug(`Clearing cache`);
    await CacheEntry.truncate();
  }

  async count(): Promise<number> {
    logger.debug(`Counting items in cache`);
    return await CacheEntry.count();
  }
}
