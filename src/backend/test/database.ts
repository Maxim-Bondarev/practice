/**
 * Connection string used by the e2e suite.
 *
 * The default points at the Postgres container from `compose.yaml`
 * (`localhost:9300`) and a dedicated database, so tests never touch the
 * development data. Override it with `TEST_DATABASE_URL` when running the
 * tests elsewhere (CI, Docker network, another port).
 */
export const DEFAULT_TEST_DATABASE_URL =
  'postgres://postgres:123456@localhost:9300/practics_test';

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
}
