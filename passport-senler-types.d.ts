import { Request } from 'express';
import { Strategy as OAuth2Strategy, StrategyOptions, VerifyFunction } from 'passport-oauth2';

export interface SenlerStrategyOptions extends StrategyOptions {
  clientID: string;
  groupID?: string;
  clientSecret: string;
  callbackURL: string;
}

export interface SenlerAccessTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface SenlerChannel {
  accessToken: string;
  groupId?: string | undefined;
}

export declare class SenlerStrategy extends OAuth2Strategy {
  name: string;
  private _clientSecret;
  private _tokenURL;
  private _clientID;
  private _groupID;
  private _callbackURL;
  
  constructor(options: Omit<SenlerStrategyOptions, 'authorizationURL' | 'tokenURL'>, verify?: VerifyFunction);
  authenticate(req: Request, options?: object): Promise<void>;
  getAccessToken(authorizationCode: string): Promise<string>;
} 