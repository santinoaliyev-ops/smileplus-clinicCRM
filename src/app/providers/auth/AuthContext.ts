import { createContext } from "react";

import type {
  CurrentUser,
  UserSession,
} from "@/shared/types/auth";

export interface AuthContextValue {
  user: CurrentUser | null;

  session: UserSession | null;

  loading: boolean;

  isAuthenticated: boolean;

  login(email: string, password: string): Promise<void>;

  logout(): Promise<void>;

  refresh(): Promise<void>;
}

export const AuthContext =
  createContext<AuthContextValue | null>(null);