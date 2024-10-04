import { inspect } from "util";
import retry from "retry";
import { Semaphore } from "@shopify/semaphore";
import { getLogger } from "../logger/index.js";

const logger = getLogger("lib/soundtrack-api/client");
const semaphore = new Semaphore(3);

type QueryResponse<T> = {
  data: T;
  errors?: unknown[];
};

type RunOptions = {
  errorPolicy?: "all" | "none";
  token?: string;
};

const defaultOpts = {} as RunOptions;

/**
 * Run a query with the Soundtrack API
 * @param document The query document to send to the Soundtrack API
 * @param variables The vairables to send to the Soundtrack API
 * @param options See: RunOption
 * @returns The query response as T
 */
export async function runQuery<T, A>(
  document: string,
  variables: A,
  options?: RunOptions,
): Promise<QueryResponse<T>> {
  return await run<T, A>(document, variables, options);
}

/**
 * Run a mutation with the Soundtrack API
 * @param document The mutation document to send to the Soundtrack API
 * @param variables The vairables to send to the Soundtrack API
 * @param options See: RunOption
 * @returns The mutation response as T
 */
export async function runMutation<T, A>(
  document: string,
  variables: A,
  options?: RunOptions,
): Promise<QueryResponse<T>> {
  return await run<T, A>(document, variables, options);
}

async function run<T, A>(
  document: string,
  variables: A,
  options?: RunOptions,
): Promise<QueryResponse<T>> {
  const token = await semaphore.acquire();
  const operation = retry.operation({ minTimeout: 10 * 1000 });
  return new Promise((resolve, reject) => {
    operation.attempt(async (attempt: number) => {
      logger.debug(`Attempt ${attempt}`);
      try {
        const response = await request<T, A>(document, variables, options);
        token.release();
        resolve(response);
      } catch (e) {
        if (operation.retry(e as Error)) return;
        token.release();
        reject(operation.mainError());
      }
    });
  });
}

async function request<T, A>(
  document: string,
  variables: A,
  options?: RunOptions,
): Promise<QueryResponse<T>> {
  if (!process.env.SOUNDTRACK_API_URL) {
    throw new Error("Environment variable SOUNDTRACK_API_URL is not set");
  }
  if (!process.env.SOUNDTRACK_API_TOKEN) {
    throw new Error("Environment variable SOUNDTRACK_API_TOKEN is not set");
  }

  const opts = options ?? defaultOpts;

  const body = JSON.stringify({ query: document, variables });
  logger.trace("GraphQL request body: " + body);

  const res = await fetch(process.env.SOUNDTRACK_API_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + process.env.SOUNDTRACK_API_TOKEN,
      "Content-Type": "application/json",
      "User-Agent": "scheduler-example-app/0.0.0",
    },
    body,
  });

  if (!res.ok) {
    const msg = "GraphQL request returned unexpected status: " + res.status;
    logger.error(msg);
    throw new Error(msg);
  }

  const rateLimitCost = res.headers.get("x-ratelimiting-cost");
  const rateLimitAvailable = res.headers.get("x-ratelimiting-tokens-available");

  logger.debug(`Used ${rateLimitCost} tokens, ${rateLimitAvailable} available`);

  const { data, errors } = (await res.json()) as QueryResponse<T>;

  if (errors && opts.errorPolicy !== "all") {
    errors.forEach((error, i) => {
      const msg = `(${i + 1}/${errors.length}) ${inspect(error)}`;
      logger.error(`GraphQL request returned error: ${msg}`);
    });
    throw new Error("GraphQL request retured errors");
  }

  return { data, errors };
}
