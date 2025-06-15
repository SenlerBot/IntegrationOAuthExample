import passport from 'passport';
import { SenlerStrategy } from 'passport-senler';

/**
 * Настройка Passport стратегии для Senler
 * Используем одну стратегию для обычной и popup авторизации
 */
export const configurePassport = (PORT: number): void => {
  passport.use(
    new SenlerStrategy({
      clientID: process.env.SENLER_CLIENT_ID!,
      clientSecret: process.env.SENLER_CLIENT_SECRET!,
      callbackURL: process.env.SENLER_CALLBACK_URL || `http://localhost:${PORT}/auth/senler/callback`,
      authorizationURL: process.env.SENLER_AUTHORIZATION_URL || '',
      tokenURL: process.env.SENLER_TOKEN_URL || '',
    }, (accessToken: string, refreshToken: string, profile: any, done: any) => {
      return done(null, { accessToken, refreshToken, profile });
    }) as any
  );
}; 