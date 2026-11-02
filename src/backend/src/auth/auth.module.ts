import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { KeycloakStrategy } from './keycloak.strategy';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), UsersModule],
  providers: [KeycloakStrategy, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [PassportModule, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
