import { Semaphore } from "@shopify/semaphore";
import { TokenSource } from "lib/soundtrack-api/index.js";
import { LoginResponse } from "lib/soundtrack-api/types.js";
import { getLogger } from "lib/logger/index.js";
import { User } from "lib/db/index.js";
import { addMinutes } from "date-fns";

const logger = getLogger("lib/token");
const semaphore = new Semaphore(1);
const oneMinute = 60 * 1000;

class Source {
  semaphore: Semaphore;

  constructor() {
    this.semaphore = new Semaphore(1);
  }

  async getToken(): Promise<string | null> {
    const token = await semaphore.acquire();
    try {
      const user = await User.findByPk(0);
      if (!user) return null;

      const expiresAt = user.get("expiresAt") as Date;
      const now = new Date();
      if (expiresAt.getTime() - oneMinute < now.getTime()) {
        logger.info(
          `Token is expired. expiresAt: ${expiresAt.toISOString()}, now: ${now.toISOString()}`,
        );
        return null;
      }
      return user.get("token") as string;
    } catch (e) {
      logger.error("Failed to get token", e);
      throw e;
    } finally {
      token.release();
    }
  }

  async getRefreshToken() {
    const token = await semaphore.acquire();
    try {
      const user = await User.findByPk(0);
      if (!user) return null;

      return user.get("refreshToken") as string;
    } catch (e) {
      logger.error("Failed to get refresh token", e);
      throw e;
    } finally {
      token.release();
    }
  }

  async updateToken(loginResponse: LoginResponse) {
    logger.info("Updating token");
    // TODO: Remove expiresAt hack
    const expiresAt = addMinutes(new Date(), 2);
    await User.upsert({ key: 0, ...loginResponse, expiresAt });
  }

  async logout() {
    logger.info("Logging out");
    await User.destroy({ where: { key: 0 } });
  }
}
const tokenSource: TokenSource = new Source();

export default tokenSource;
