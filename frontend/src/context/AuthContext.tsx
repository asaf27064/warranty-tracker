import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/axios";

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
    const [user,setUser] = useState<User | null>(null);
    const [accessToken,setAccessToken]= useState<string|null>(null);
    const [loading,setLoading] = useState(true);
}