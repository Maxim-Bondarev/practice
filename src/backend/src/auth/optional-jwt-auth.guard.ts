import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from './auth-user';

/**
 * Populates `request.user` when a valid bearer token is present and lets the
 * request through anonymously otherwise. Used by public endpoints that change
 * their behaviour for authenticated callers (`mine=true`).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthUser | null>(
    _err: unknown,
    user: TUser | false,
  ): TUser | null {
    return user || null;
  }
}
