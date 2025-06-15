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
  passport.authenticate('senler')(req, res, next);
});

/**
 * Обработчик обратного вызова для Senler (обычный и popup)
 */
router.get(
  '/senler/callback',
  (req: Request, res: Response, next: NextFunction): void => {
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
  // Добавляем параметр для определения popup авторизации
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