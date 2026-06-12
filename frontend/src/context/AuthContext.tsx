import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
    const init = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        tokenRef.current = res.data.accessToken;
        const meRes = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${res.data.accessToken}` },
        });
        setUser(meRes.data.user);
        setLastUser(meRes.data.user);
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(meRes.data.user));
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    setupInterceptors(
      () => tokenRef.current,
      async () => {
        try {
          const res = await api.post("/auth/refresh");
          setAccessToken(res.data.accessToken);
          tokenRef.current = res.data.accessToken;
        } catch {
          setUser(null);
          setAccessToken(null);
          tokenRef.current = null;
          navigate("/");
        }
      },
    );

    init();
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
