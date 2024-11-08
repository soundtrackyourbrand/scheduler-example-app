import { TokenSource } from "lib/soundtrack-api/index.js";
import { LoginResponse } from "lib/soundtrack-api/types.js";
import { getLogger } from "lib/logger/index.js";
import { User } from "lib/db/index.js";

const logger = getLogger("lib/token");
const oneMinute = 60 * 1000;

class Source {
  async getToken(): Promise<string | null> {
    try {
      const user = await User.findByPk(0);
      if (!user) return null;

      const expiresAt = user.get("expiresAt") as Date;
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();
      if (remaining < oneMinute) {
        logger.info(
          `Token is expired. Expires at: ${expiresAt.toISOString()}, now: ${now.toISOString()}`,
        );
        return null;
      }
      return user.get("token") as string;
    } catch (e) {
      logger.error("Failed to get token", e);
      throw e;
    }
  }

  async getRefreshToken() {
    try {
      const user = await User.findByPk(0);
      if (!user) return null;

      return user.get("refreshToken") as string;
    } catch (e) {
      logger.error("Failed to get refresh token", e);
      throw e;
    }
  }

  async updateToken(loginResponse: LoginResponse) {
    logger.info(
      "Updating token, expires at " + loginResponse.expiresAt.toISOString(),
    );
    await User.upsert({ key: 0, ...loginResponse });
  }

  async logout() {
    logger.info("Logging out");
    await User.destroy({ where: { key: 0 } });
  }
}
const tokenSource: TokenSource = new Source();

export default tokenSource;
