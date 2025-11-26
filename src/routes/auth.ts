import { Request, Response, Router, NextFunction } from 'express';
import passport from 'passport';
import { SenlerChannel } from 'passport-senler';
import { generatePopupSuccessHTML, generatePopupErrorHTML } from '../utils/html';
import { createSenlerService } from '../services/senler';

const router = Router();

/**
 * Check if the current request is using popup authorization mode
 * @param req - Express request object
 * @returns True if popup authorization is being used, false otherwise
 */
const isPopupAuth = (req: Request): boolean => {
  const state = req.query.state as string;
  if (!state) return false;
  
  try {
    const stateData = JSON.parse(state);
    return stateData.popup === true;
  } catch (e) {
    return false;
  }
};

/**
 * Extract group_id from OAuth state parameter
 * @param req - Express request object
 * @returns Group ID from state parameter or null if not found
 */
const getGroupIdFromState = (req: Request): string | null => {
  const state = req.query.state as string;
  if (!state) return null;
  
  try {
    const stateData = JSON.parse(state);
    return stateData.groupId || null;
  } catch (e) {
    return null;
  }
};

/**
 * Handle authentication errors for both popup and redirect modes
 * @param res - Express response object
 * @param error - Error code or type
 * @param description - Optional detailed error description
 * @param isPopup - Whether to handle error in popup mode (default: false)
 */
const handleAuthError = (res: Response, error: string, description?: string, isPopup: boolean = false): void => {
  if (isPopup) {
    const errorHtml = generatePopupErrorHTML(error, description);
    res.send(errorHtml);
  } else {
    const params = new URLSearchParams({
      error: 'auth_failed',
      details: error,
      ...(description && { description })
    });
    res.redirect(`/?${params.toString()}`);
  }
};

/**
 * Универсальный роут для начала OAuth авторизации
 * Режим определяется переменной окружения AUTH_MODE
 * 
 * Использование:
 * - Popup: AUTH_MODE=popup (рекомендуется, работает в iframe)
 * - Redirect: AUTH_MODE=redirect (НЕ работает в iframe, будет поддержано позже)
 * - Принудительный режим: GET /auth/senler?mode=popup или ?mode=redirect
 */
router.get('/senler', (req: Request, res: Response, next: NextFunction): void => {
  const groupIdFromUrl = req.query.group_id as string;
  const forcedMode = req.query.mode as string;
  
  // Определяем режим авторизации
  let authMode = forcedMode || process.env.AUTH_MODE || 'popup';
  
  // Проверяем поддержку режима
  if (authMode === 'redirect') {
    console.warn('⚠️ Redirect режим не поддерживается в iframe интеграции. Используйте popup режим.');
  }
  
  const isPopup = authMode === 'popup';
  const isRedirect = authMode === 'redirect';
  
  console.log('🔍 OAuth авторизация:', { 
    groupId: groupIdFromUrl, 
    mode: authMode,
    popup: isPopup, 
    redirect: isRedirect,
    groupIdProvided: !!groupIdFromUrl
  });
  
  // Формируем опции для Passport
  const authOptions: any = { group_id: groupIdFromUrl };
  
  // Для popup авторизации добавляем state параметр
  if (isPopup) {
    authOptions.state = JSON.stringify({ popup: true, groupId: groupIdFromUrl });
  }
  
  passport.authenticate('senler', authOptions)(req, res, next);
});

/**
 * Обработчик OAuth callback
 * Универсально обрабатывает как popup, так и обычную авторизацию
 */
router.get('/senler/callback', 
  // Middleware для обработки ошибок OAuth
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.query.error) {
      console.error('❌ OAuth ошибка:', req.query.error);
      
      const isPopup = isPopupAuth(req);
      handleAuthError(
        res, 
        req.query.error as string, 
        req.query.error_description as string,
        isPopup
      );
      return;
    }
    next();
  },
  
  // Passport аутентификация
  passport.authenticate('senler', {
    failureRedirect: '/auth/error',
    session: false,
  }),
  
  // Обработка успешной авторизации
  (req: Request & { user?: any }, res: Response): void => {
    const user = req.user as SenlerChannel;
    const { accessToken, groupId } = user || {};
    const isPopup = isPopupAuth(req);
    const requestedGroupId = getGroupIdFromState(req);
    
    console.log('✅ OAuth успех:', { 
      accessToken: !!accessToken, 
      groupId, 
      popup: isPopup,
      requestedGroupId,
      groupIdMatches: requestedGroupId ? requestedGroupId === groupId : 'not_requested'
    });
    
    // Валидация полученных данных
    if (!accessToken) {
      handleAuthError(res, 'no_token', 'Токен доступа не получен', isPopup);
      return;
    }
    
    if (!groupId) {
      handleAuthError(res, 'no_group_id', 'Group ID не получен', isPopup);
      return;
    }
    
    // Возврат результата в зависимости от типа авторизации
    if (isPopup) {
      // Для popup возвращаем HTML с результатом
      const successHtml = generatePopupSuccessHTML({
        accessToken,
        groupId,
        requestedGroupId,
      });
      res.send(successHtml);
    } else {
      // Для обычной авторизации редирект на главную страницу
      // ВНИМАНИЕ: Redirect режим НЕ поддерживается в iframe интеграции
      const params = new URLSearchParams({
        success: 'true',
        group_id: groupId,
        ...(requestedGroupId && { requested_group_id: requestedGroupId })
      });
      res.redirect(`/?${params.toString()}`);
    }
  }
);

/**
 * Общий обработчик ошибок авторизации
 */
router.get('/error', (req: Request, res: Response): void => {
  const error = req.query.error || 'Неизвестная ошибка авторизации';
  res.redirect(`/?error=auth_failed&details=${encodeURIComponent(error as string)}`);
});

/**
 * API endpoint для получения данных подписчиков
 */
router.post('/subscribers', async (req: Request, res: Response): Promise<void> => {
  const { accessToken, groupId } = req.body;
  
  if (!accessToken || !groupId) {
    res.status(400).json({ 
      error: 'Отсутствуют необходимые данные',
      details: { accessToken: !!accessToken, groupId: !!groupId }
    });
    return;
  }
  
  try {
    const user = { accessToken, groupId: Number(groupId) };
    const senlerService = createSenlerService(user);
    const stats = await senlerService.getSubscribersStats(30);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('❌ Ошибка получения подписчиков:', error.message);
    res.status(500).json({
      error: 'Ошибка получения данных от Senler API',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

/**
 * Опциональный endpoint для logout
 */
router.post('/logout', (_req: Request, res: Response): void => {
  // В реальном приложении здесь нужно очистить сессию/токены
  res.json({ success: true, message: 'Выход выполнен' });
});

export default router; 