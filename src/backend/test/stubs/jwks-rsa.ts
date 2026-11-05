/**
 * `jwks-rsa` pulls in the ESM-only `jose` package, which Jest's CommonJS
 * runtime cannot load. The e2e suite replaces Keycloak authentication with a
 * header-driven guard, so the real JWKS client is never used. This stub keeps
 * the strategy importable without touching the network.
 */
export function passportJwtSecret(): (
  request: unknown,
  rawJwtToken: unknown,
  done: (error: Error | null, secret?: string) => void,
) => void {
  return (_request, _rawJwtToken, done) => {
    done(new Error('JWKS is not available in the e2e test environment'));
  };
}
