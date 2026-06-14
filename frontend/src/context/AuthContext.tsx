import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { setupInterceptors } from "../api/axios";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type LoginOptions = {
  selectAccount?: boolean;
  loginHint?: string;
};

type AuthContextType = {
  user: User | null;
  lastUser: User | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: (options?: LoginOptions) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const LAST_USER_KEY = "wtLastGoogleUser";

const readLastUser = (): User | null => {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lastUser, setLastUser] = useState<User | null>(() => readLastUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    let lastHiddenAt = 0;

    const refreshAccessToken = async () => {
      const res = await api.post("/auth/refresh");
      setAccessToken(res.data.accessToken);
      tokenRef.current = res.data.accessToken;
      return res.data.accessToken as string;
    };

    // Genuine session loss (refresh cookie gone/expired): clear and tell the user.
    const handleSessionExpired = () => {
      if (!tokenRef.current) return; // already handled / not logged in
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
      toast.error("Your session expired. Please sign in again.");
      navigate("/");
    };

    const init = async () => {
      try {
        const token = await refreshAccessToken();
        const meRes = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(meRes.data.user);
        setLastUser(meRes.data.user);
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(meRes.data.user));
      } catch {
        // Not logged in on first load - stay silent (no "expired" toast).
        setUser(null);
        setAccessToken(null);
        tokenRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    setupInterceptors(
      () => tokenRef.current,
      async () => {
        try {
          await refreshAccessToken();
        } catch (e) {
          handleSessionExpired();
          throw e;
        }
      },
    );

    // Returning to the tab after a while: refresh proactively so the first
    // action doesn't hit an expired access token.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt = Date.now();
        return;
      }
      if (!tokenRef.current) return; // not logged in
      if (Date.now() - lastHiddenAt < 5 * 60 * 1000) return; // brief switch
      refreshAccessToken().catch(handleSessionExpired);
    };
    document.addEventListener("visibilitychange", onVisibility);

    init();

    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [navigate]);

  const loginWithGoogle = (options: LoginOptions = {}) => {
    const url = new URL(`${import.meta.env.VITE_API_URL}/auth/google`);
    if (options.selectAccount) {
      url.searchParams.set("prompt", "select_account");
    }
    if (options.loginHint) {
      url.searchParams.set("login_hint", options.loginHint);
    }
    window.location.href = url.toString();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
      // Clear the cached "continue as" identity so the previous user's name
      // and email are not shown on the login screen of a shared device.
      setLastUser(null);
      localStorage.removeItem(LAST_USER_KEY);
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, lastUser, accessToken, loading, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
