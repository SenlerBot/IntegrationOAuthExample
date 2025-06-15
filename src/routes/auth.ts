import { Request, Response, Router, NextFunction } from 'express';
import passport from 'passport';
import { SenlerChannel } from 'passport-senler';
import { generatePopupSuccessHTML, generatePopupErrorHTML } from '../utils/html';
import { createSenlerService } from '../services/senler';

const router = Router();

/**
 * Начало процесса аутентификации через Senler (обычный редирект)
 */
router.get('/senler', (req: Request, res: Response, next: NextFunction): void => {
  const groupIdFromUrl = req.query.group_id as string;
  
  if (groupIdFromUrl) {
    // Строим OAuth URL с group_id параметром напрямую
    const clientId = process.env.SENLER_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SENLER_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/auth/senler/callback`);
    const state = generateRandomState();
    
    // Сохраняем состояние для валидации в callback
    (req as any).session.oauthState = state;
    (req as any).session.tempGroupId = groupIdFromUrl;
    
    const oauthUrl = `https://senler.ru/cabinet/OAuth2authorize?response_type=code&group_id=${groupIdFromUrl}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log(`📌 Редирект на OAuth с group_id: ${groupIdFromUrl}`);
    res.redirect(oauthUrl);
    return;
  }
  
  passport.authenticate('senler')(req, res, next);
});

/**
 * Генерация случайного state для OAuth
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Обработка прямого OAuth callback (с group_id параметром)
 */
async function handleDirectOAuthCallback(req: Request, res: Response): Promise<void> {
  const authCode = req.query.code as string;
  const sessionGroupId = (req as any).session?.tempGroupId;
  const sessionIsPopup = (req as any).session?.isPopup || false;
  
  try {
    // Получаем токен от Senler API
    const tokenResponse = await fetch('https://senler.ru/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.SENLER_CLIENT_ID,
        client_secret: process.env.SENLER_CLIENT_SECRET,
        code: authCode,
        redirect_uri: process.env.SENLER_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/auth/senler/callback`
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('Не удалось получить access token');
    }
    
    console.log(`✅ Получен токен через прямой OAuth для group_id: ${sessionGroupId}`);
    
    // Очищаем временные данные из сессии
    delete (req as any).session.tempGroupId;
    delete (req as any).session.oauthState;
    delete (req as any).session.isPopup;
    
    if (sessionIsPopup) {
      // Для popup возвращаем HTML страницу с JavaScript
      const successHtml = generatePopupSuccessHTML(accessToken, sessionGroupId);
      res.send(successHtml);
    } else {
      // Для обычной авторизации сохраняем в сессии и редирект
      (req as any).session.user = {
        accessToken,
        groupId: sessionGroupId,
        profile: {}
      };
      res.redirect('/');
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка прямого OAuth:', error.message);
    
    // Очищаем сессию при ошибке
    delete (req as any).session.tempGroupId;
    delete (req as any).session.oauthState;
    delete (req as any).session.isPopup;
    
    if (sessionIsPopup) {
      const errorHtml = generatePopupErrorHTML('oauth_token_error', error.message);
      res.send(errorHtml);
    } else {
      res.redirect(`/?error=oauth_token_error&details=${encodeURIComponent(error.message)}`);
    }
  }
}

/**
 * Обработчик обратного вызова для Senler (обычный и popup)
 */
router.get(
  '/senler/callback',
  (req: Request, res: Response, next: NextFunction): void => {
    // Проверяем, есть ли у нас прямой OAuth callback (с group_id)
    const sessionGroupId = (req as any).session?.tempGroupId;
    const sessionState = (req as any).session?.oauthState;
    const callbackState = req.query.state as string;
    const authCode = req.query.code as string;
    
    if (sessionGroupId && sessionState && sessionState === callbackState && authCode) {
      // Обрабатываем прямой OAuth callback
      handleDirectOAuthCallback(req, res);
      return;
    }
    
    // Проверяем наличие ошибки в callback
    if (req.query.error) {
      console.error('❌ Ошибка callback:', req.query.error);
      
      // Проверяем, это popup авторизация или обычная
      const state = req.query.state as string;
      let isPopup = false;
      
      try {
        if (state) {
          const stateData = JSON.parse(state);
          isPopup = stateData.popup === true;
        }
      } catch (e) {
        // Игнорируем ошибку парсинга state
      }
      
      if (isPopup) {
        // Для popup возвращаем HTML с ошибкой
        const errorHtml = generatePopupErrorHTML(
          req.query.error as string,
          req.query.error_description as string
        );
                 res.send(errorHtml);
         return;
       } else {
         // Для обычной авторизации редирект
        res.redirect(`/?error=senler_error&details=${encodeURIComponent(req.query.error as string)}&description=${encodeURIComponent(req.query.error_description as string || 'Неизвестная ошибка')}`);
        return;
       }
    }
    
    next();
  },
  passport.authenticate('senler', {
    failureRedirect: '/auth/senler/error',
    session: false,
  }),
  (req: Request & { user?: any }, res: Response): void => {
    const user = req.user as SenlerChannel;
    const accessToken = user?.accessToken;
    let groupId = user?.groupId;
    
    // Проверяем сессию для прямого OAuth с group_id
    const sessionGroupId = (req as any).session?.tempGroupId;
    const sessionState = (req as any).session?.oauthState;
    const sessionIsPopup = (req as any).session?.isPopup;
    const callbackState = req.query.state as string;
    
    let isPopup = false;
    
    // Если есть данные в сессии (прямой OAuth), используем их
    if (sessionGroupId && sessionState && sessionState === callbackState) {
      groupId = sessionGroupId;
      isPopup = sessionIsPopup || false;
      console.log(`📌 Используем group_id из прямого OAuth: ${groupId}`);
      
      // Очищаем временные данные из сессии
      delete (req as any).session.tempGroupId;
      delete (req as any).session.oauthState;
      delete (req as any).session.isPopup;
    } else {
      // Fallback на старую логику с state параметром
      try {
        if (callbackState) {
          const stateData = JSON.parse(callbackState);
          isPopup = stateData.popup === true;
          if (stateData.groupId) {
            groupId = stateData.groupId;
            console.log(`📌 Используем group_id из state: ${groupId}`);
          }
        }
      } catch (e) {
        // Игнорируем ошибку парсинга state
      }
    }
    
    if (!accessToken) {
      console.error('❌ Токен доступа не найден');
      
             if (isPopup) {
         const errorHtml = generatePopupErrorHTML('no_token');
         res.send(errorHtml);
         return;
       } else {
        res.redirect('/?error=no_token');
        return;
       }
    }
    
    if (!groupId) {
      console.error('❌ Group ID не найден');
      
             if (isPopup) {
         const errorHtml = generatePopupErrorHTML('no_group_id');
         res.send(errorHtml);
         return;
       } else {
        res.redirect('/?error=no_group_id');
        return;
       }
    }
    
    if (isPopup) {
      // Для popup возвращаем HTML страницу с JavaScript
      const successHtml = generatePopupSuccessHTML(accessToken, groupId);
      res.send(successHtml);
    } else {
      // Для обычной авторизации сохраняем в сессии и редирект
      req.session.user = user;
      res.redirect('/');
    }
  }
);

/**
 * Страница ошибки аутентификации с детальной информацией
 */
router.get('/senler/error', (req: Request, res: Response): void => {
  const errorDetails = req.query.error_description || req.query.error || 'Неизвестная ошибка';
  res.redirect(`/?error=auth_failed&details=${encodeURIComponent(errorDetails as string)}`);
});

/**
 * Начало процесса аутентификации через Senler в popup
 */
router.get('/senler/popup', (req: Request, res: Response, next: NextFunction): void => {
  const groupIdFromUrl = req.query.group_id as string;
  
  if (groupIdFromUrl) {
    // Строим OAuth URL с group_id параметром для popup
    const clientId = process.env.SENLER_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SENLER_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/auth/senler/callback`);
    const state = generateRandomState();
    
    // Сохраняем состояние для валидации в callback и помечаем как popup
    (req as any).session.oauthState = state;
    (req as any).session.tempGroupId = groupIdFromUrl;
    (req as any).session.isPopup = true;
    
    const oauthUrl = `https://senler.ru/cabinet/OAuth2authorize?response_type=code&group_id=${groupIdFromUrl}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log(`📌 Popup редирект на OAuth с group_id: ${groupIdFromUrl}`);
    res.redirect(oauthUrl);
    return;
  }
  
  // Обычный popup без group_id через passport
  passport.authenticate('senler', {
    state: JSON.stringify({ popup: true })
  })(req, res, next);
});



/**
 * Endpoint для валидации данных авторизации (localStorage используется на клиенте)
 */
router.post('/validate-auth', (req: Request, res: Response): void => {
  const { accessToken, groupId } = req.body;
  
  if (!accessToken || !groupId) {
    console.error('❌ Ошибка валидации: отсутствуют данные');
    res.status(400).json({ 
      error: 'Отсутствуют необходимые данные',
      details: { accessToken: !!accessToken, groupId: !!groupId }
    });
    return;
  }
  
  // Просто валидируем и возвращаем успех
  // Данные сохраняются в localStorage на клиенте
  res.json({ 
    success: true, 
    message: 'Данные авторизации валидны',
    groupId: Number(groupId)
  });
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



export default router; 