import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type Keycloak from "keycloak-js";
import { keycloak } from "../keycloak";

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

interface AuthContextValue {
  keycloak: Keycloak;
  initialized: boolean;
  authenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (redirectPath?: string) => Promise<void>;
  register: (redirectPath?: string) => Promise<void>
  logout: (redirectPath?: string) => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then(async (auth) => {
        setAuthenticated(auth);

        if (auth && keycloak.tokenParsed) {
          const profile = await loadUserProfile();
          setUser(profile);
          setToken(keycloak.token ?? null);
        }

        keycloak.onTokenExpired = () => {
          keycloak
            .updateToken(30)
            .then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token ?? null);
              }
            })
            .catch(() => {
              keycloak.login();
            });
        };

        setInitialized(true);
      })
      .catch((err) => {
        console.error("Keycloak init failed", err);
        setInitialized(true);
      });
  }, []);

  const loadUserProfile = async (): Promise<UserProfile> => {
    const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
    const realmAccess = parsed?.realm_access as
      | { roles?: string[] }
      | undefined;
    const resourceAccess = parsed?.resource_access as
      | Record<string, { roles?: string[] }>
      | undefined;

    const realmRoles = realmAccess?.roles ?? [];
    const clientRoles =
      resourceAccess?.[import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string]
        ?.roles ?? [];

    return {
      id: String(parsed?.sub ?? ""),
      username: String(parsed?.preferred_username ?? ""),
      email: parsed?.email as string | undefined,
      firstName: parsed?.given_name as string | undefined,
      lastName: parsed?.family_name as string | undefined,
      roles: Array.from(new Set([...realmRoles, ...clientRoles])),
    };
  };

  const login = async (redirectPath: string = "/") => {
    await keycloak.login({
      action: "register",
      redirectUri: window.location.origin + redirectPath,
    });
  };

  const register = async (redirectPath: string = "/") => {
    await keycloak.register({
      redirectUri: window.location.origin + redirectPath
    })
  }

  const logout = async (redirectPath: string = "/") => {
    setUser(null);
    setToken(null);
    setAuthenticated(false);
    await keycloak.logout({
      redirectUri: window.location.origin + redirectPath,
    });
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      keycloak,
      initialized,
      authenticated,
      user,
      token,
      login,
      register,
      logout,
      hasRole,
    }),
    [initialized, authenticated, user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
