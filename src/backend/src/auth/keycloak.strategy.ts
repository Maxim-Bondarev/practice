import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from './auth-user';
import { UsersService } from '../users/users.service';

interface KeycloakPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(KeycloakStrategy.name);

  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    const keycloakUrl =
      config.get<string>('KEYCLOAK_URL') ?? 'http://keycloak:8080';
    const realm = config.get<string>('KEYCLOAK_REALM') ?? 'practics';
    const issuer =
      config.get<string>('KEYCLOAK_ISSUER') ??
      `http://localhost:9200/realms/${realm}`;
    const jwksUri =
      config.get<string>('KEYCLOAK_JWKS_URI') ??
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
    });

    this.logger.log(`JWT issuer: ${issuer}; JWKS: ${jwksUri}`);
  }

  async validate(payload: KeycloakPayload): Promise<AuthUser> {
    const roles = payload.realm_access?.roles ?? [];
    const user: AuthUser = {
      id: payload.sub,
      username:
        payload.preferred_username ?? payload.email ?? payload.sub ?? 'user',
      roles,
      isAdmin: roles.includes('admin'),
    };
    await this.users.touch(user);
    return user;
  }
}
