export type Identity = { userId: string; sessionId: string };
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessExpiresAt: string;
  refreshExpiresAt: string;
}
