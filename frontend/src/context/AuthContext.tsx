import { createContext, useContext, useState, useEffect, useRef } from "react";

import type { ReactNode } from "react";

import api from "../api/axios";

import { setupInterceptors } from "../api/axios";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token");

      if (tokenFromUrl) {
        setAccessToken(tokenFromUrl);
        window.history.replaceState({}, "", "/");
        try {
          const res = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${tokenFromUrl}` },
          });
          setUser(res.data.user);
        } catch {
          setAccessToken(null);
        }
      }

      setLoading(false);
    };

    init();

    setupInterceptors(
      () => tokenRef.current,
      async () => {
        try {
          const res = await api.post("/auth/refresh");
          setAccessToken(res.data.accessToken);
        } catch {
          setUser(null);
          setAccessToken(null);
        }
      },
    );
  }, []);

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, loginWithGoogle, logout }}
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
