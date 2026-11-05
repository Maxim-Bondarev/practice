import { testDatabaseUrl } from './database';

// Loaded through Jest `setupFiles`, before AppModule (and ConfigModule) is
// imported, so the application connects to the dedicated test database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.DB_SYNCHRONIZE = 'true';
