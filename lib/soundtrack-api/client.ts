import { inspect } from "util";
import pino from "pino";
import { Semaphore } from "@shopify/semaphore";

const logger = pino().child({ module: "lib/soundtrack-api/client" });
const semaphore = new Semaphore(2);

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
  const token = await semaphore.acquire();
  return run<T, A>(document, variables, options).finally(() => token.release());
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
  const token = await semaphore.acquire();
  return run<T, A>(document, variables, options).finally(() => token.release());
}

async function run<T, A>(
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
  logger.info("GraphQL request body: " + body);
  const res = await fetch(process.env.SOUNDTRACK_API_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + process.env.SOUNDTRACK_API_TOKEN,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const msg = "GraphQL request returned unexpected status: " + res.status;
    logger.error(msg);
    throw new Error(msg);
  }

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
