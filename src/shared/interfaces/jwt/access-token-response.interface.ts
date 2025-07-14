/**
 * reponsible for access token http resposne
 */
export interface AccessTokenResponseInterface {
  accessToken: string;
  refreshToken: string;
  user?: any;
}
