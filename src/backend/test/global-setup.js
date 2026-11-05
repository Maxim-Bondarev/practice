const { Client } = require('pg');

// Keep this default in sync with `test/database.ts`.
const DEFAULT_TEST_DATABASE_URL =
  'postgres://postgres:123456@localhost:9300/practics_test';

/**
 * Creates the dedicated test database (if needed) and gives it a clean `app`
 * schema. Nest/TypeORM then creates the tables through `synchronize: true`.
 *
 * This file is plain JavaScript on purpose: Jest loads `globalSetup` outside
 * the ts-jest transform.
 */
module.exports = async function globalSetup() {
  const connectionString =
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(
      `Unsafe test database name "${databaseName}". Use letters, digits and underscores only.`,
    );
  }

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  const database = new Client({ connectionString });
  await database.connect();
  try {
    await database.query('DROP SCHEMA IF EXISTS app CASCADE');
    await database.query('CREATE SCHEMA app');
  } finally {
    await database.end();
  }
};
