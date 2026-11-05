import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import type { AuthUser } from '../src/auth/auth-user';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/auth/optional-jwt-auth.guard';
import { UserEntity } from '../src/users/user.entity';

export const TEST_USER_HEADER = 'x-test-user';

export const AUTHOR: AuthUser = {
  id: 'test-author',
  username: 'author',
  roles: [],
  isAdmin: false,
};

export const ADMIN: AuthUser = {
  id: 'test-admin',
  username: 'admin',
  roles: ['admin'],
  isAdmin: true,
};

export const STRANGER: AuthUser = {
  id: 'test-stranger',
  username: 'stranger',
  roles: [],
  isAdmin: false,
};

export interface TestApp {
  app: INestApplication<App>;
  dataSource: DataSource;
}

interface TestRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

function userFrom(context: ExecutionContext): AuthUser | null {
  const request = context.switchToHttp().getRequest<TestRequest>();
  const raw = request.headers[TEST_USER_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;

  try {
    const user = JSON.parse(value) as AuthUser;
    if (!user?.id || !user?.username) throw new Error('Invalid user');
    return user;
  } catch {
    throw new UnauthorizedException('Invalid test user header');
  }
}

/**
 * Replaces Keycloak authentication with a header-driven fake guard. Tests send
 * `x-test-user: <json>` and get exactly the same downstream behaviour as a
 * validated JWT: `request.user` is populated for `@CurrentUser()`.
 */
const requiredAuthGuard = {
  canActivate(context: ExecutionContext): boolean {
    const user = userFrom(context);
    if (!user) throw new UnauthorizedException();
    context.switchToHttp().getRequest<TestRequest>().user = user;
    return true;
  },
};

const optionalAuthGuard = {
  canActivate(context: ExecutionContext): boolean {
    const user = userFrom(context);
    if (user) {
      context.switchToHttp().getRequest<TestRequest>().user = user;
    }
    return true;
  },
};

/** Header object for `request(...).set(...)`. */
export function asUser(user: AuthUser): Record<string, string> {
  return { [TEST_USER_HEADER]: JSON.stringify(user) };
}

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(requiredAuthGuard)
    .overrideGuard(OptionalJwtAuthGuard)
    .useValue(optionalAuthGuard)
    .compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  // Mirrors `main.ts` so DTO validation and query transformation are covered.
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  await app.init();

  return { app, dataSource: app.get(DataSource) };
}

/** Removes all application data between test cases. */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE app.notifications, app.chat_attachments, app.chat_items, app.applications, app.users RESTART IDENTITY CASCADE',
  );
}

/**
 * Administrators only receive notifications after they are known to the
 * backend (in production this happens on their first login), so seed one.
 */
export async function seedAdmin(dataSource: DataSource): Promise<void> {
  await dataSource.getRepository(UserEntity).insert({
    id: ADMIN.id,
    username: ADMIN.username,
    isAdmin: true,
  });
}

/** Lets timestamps of subsequent requests differ. */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5));
}
