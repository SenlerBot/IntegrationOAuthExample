import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';
import { SenlerChannel } from 'passport-senler';

// Импорт модулей
import { configurePassport } from './config/passport';
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';

// Расширение типов сессии
declare module 'express-session' {
  interface SessionData {
    user?: SenlerChannel;
  }
}

// Загрузка переменных окружения
dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Middleware для обработки JSON
app.use(express.json());

// Раздача статических файлов
app.use(express.static(path.join(__dirname, '../public')));

// Конфигурация сессий (минимальная для совместимости)
app.use(session({
  secret: process.env.SESSION_SECRET || 'senler-dashboard-secret-key-' + Math.random().toString(36),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
  }
}));

// Настройка Passport
configurePassport(PORT);
app.use(passport.initialize());

// Подключение роутов
app.use('/', indexRoutes);
app.use('/auth', authRoutes);

// Обработка ошибок
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('❌ Внутренняя ошибка сервера:', err.stack);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
  });
});

// Обработка 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Страница не найдена',
    message: 'Запрашиваемый ресурс не существует'
  });
});

// Запуск сервера
app.listen(PORT, (): void => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  
  // Проверка переменных окружения
  const missingEnvVars = [];
  if (!process.env.SENLER_CLIENT_ID) missingEnvVars.push('SENLER_CLIENT_ID');
  if (!process.env.SENLER_CLIENT_SECRET) missingEnvVars.push('SENLER_CLIENT_SECRET');
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️  Отсутствуют переменные окружения:', missingEnvVars.join(', '));
  }
  

});

export default app; 