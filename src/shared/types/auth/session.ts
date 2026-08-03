import type { CurrentUser } from "./user";

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: CurrentUser;
}