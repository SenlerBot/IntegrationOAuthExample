import { Request, Response, Router } from 'express';
import { generateHTML } from '../utils/html';

const router = Router();

/**
 * Главная страница приложения (с поддержкой localStorage)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const error = req.query.error as string;
  const errorDetails = req.query.details as string;
  const errorDescription = req.query.description as string;
  const groupIdFromUrl = req.query.group_id as string;

  // Показываем единую страницу с клиентской логикой
  const content = generateMainPage(error, errorDetails, errorDescription, groupIdFromUrl);
  res.send(generateHTML('Senler Dashboard', content));
});

/**
 * Generate main page content with localStorage support and error handling
 * @param error - Optional error code to display
 * @param errorDetails - Optional detailed error information
 * @param errorDescription - Optional error description
 * @param groupIdFromUrl - Optional group ID passed via URL parameters
 * @returns HTML content for the main page
 */
function generateMainPage(error?: string, errorDetails?: string, errorDescription?: string, groupIdFromUrl?: string): string {
  let errorHtml = '';
  
  if (error) {
    let errorMessage = 'Произошла ошибка при аутентификации';
    let troubleshooting = '';
    
    switch (error) {
      case 'auth_failed':
        errorMessage = 'Ошибка аутентификации Senler';
        troubleshooting = `
          <strong>Возможные причины:</strong><br>
          • Неверный Client ID или Client Secret<br>
          • Неправильный Callback URL<br>
          • Приложение не активировано в Senler<br>
          • Проблемы с разрешениями приложения
        `;
        break;
      case 'senler_error':
        errorMessage = 'Ошибка от Senler API';
        troubleshooting = `
          <strong>Детали от Senler:</strong><br>
          ${errorDetails ? `• Код ошибки: ${errorDetails}<br>` : ''}
          ${errorDescription ? `• Описание: ${errorDescription}<br>` : ''}
          <strong>Проверьте настройки приложения в панели Senler</strong>
        `;
        break;
      case 'no_token':
        errorMessage = 'Токен доступа не получен';
        troubleshooting = `
          <strong>Проблема:</strong><br>
          • Аутентификация прошла, но токен не был возвращен<br>
          • Возможно, проблема с passport-senler библиотекой<br>
          • Проверьте логи сервера для деталей
        `;
        break;
      case 'no_group_id':
        errorMessage = 'Group ID не получен';
        troubleshooting = `
          <strong>Проблема:</strong><br>
          • Аутентификация прошла, токен получен, но Group ID отсутствует<br>
          • Group ID не найден ни в профиле пользователя, ни в callback параметрах<br>
          • Senler не передал group_id в ответе OAuth<br>
          • Возможно, проблема с настройками приложения в Senler<br>
          • Проверьте логи сервера - должны быть видны детали поиска group_id
        `;
        break;
      default:
        errorMessage = `Неизвестная ошибка: ${error}`;
    }
    
    errorHtml = `
      <div class="error">
        <strong>${errorMessage}</strong><br>
        ${troubleshooting}
        ${errorDetails ? `<br><em>Детали: ${errorDetails}</em>` : ''}
      </div>
    `;
  }
  
      return `
    <!-- Данные из URL -->
    ${groupIdFromUrl ? `<meta name="url-group-id" content="${groupIdFromUrl}">` : ''}
    
    <!-- Секция неавторизованного пользователя -->
    <div id="unauthenticated" style="display: none;">
      <p style="margin-bottom: 20px;">Для доступа к статистике необходимо авторизоваться через Senler</p>
      ${process.env.AUTH_MODE === 'redirect' ? `
        <div class="warning" style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
          <strong>⚠️ Внимание:</strong> Режим redirect не поддерживается в iframe интеграции.<br>
          Для работы в iframe используйте AUTH_MODE=popup в .env файле.
        </div>
      ` : ''}
      ${errorHtml}
      <button id="authButton" class="btn" onclick="openAuthPopup()">🔐 Войти через Senler</button>
      <div class="debug-info">
        <strong>Отладочная информация:</strong><br>
        • Client ID: ${process.env.SENLER_CLIENT_ID ? '✅ Настроен' : '❌ Не настроен'}<br>
        • Client Secret: ${process.env.SENLER_CLIENT_SECRET ? '✅ Настроен' : '❌ Не настроен'}<br>
        • Callback URL: ${process.env.SENLER_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/auth/senler/callback`}<br>
        • Режим авторизации: ${process.env.AUTH_MODE || 'popup'} ${process.env.AUTH_MODE === 'redirect' ? '⚠️ (НЕ работает в iframe)' : '✅ (работает в iframe)'}<br>
        • Хранение: localStorage (работает в iframe)
        ${groupIdFromUrl ? `<br>• Group ID из URL: <strong>${groupIdFromUrl}</strong> ✅` : '<br>• Group ID из URL: ❌ Не передан'}
      </div>
    </div>

    <!-- Секция авторизованного пользователя -->
    <div id="authenticated" style="display: none;">
      <h2>✅ Успешная авторизация</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-number" id="groupIdDisplay">--</div>
          <div class="stat-label">Идентификатор группы</div>
        </div>
      </div>
      <div class="info-block">
        <strong>Полученные данные:</strong><br>
        • Токен доступа: <span id="tokenDisplay">***</span><br>
        • Group ID: <span id="groupIdText">--</span><br>
        • Время авторизации: <span id="authTime">--</span><br>
        • Статус Group ID: <span id="groupIdStatus">--</span>
      </div>

      <h3 style="margin-top: 30px;">📊 Статистика подписчиков</h3>
      <div id="loadingStats" class="loading" style="text-align: center; padding: 20px;">
        <div class="loading-spinner"></div>
        <p>Загружаем данные...</p>
      </div>
      <div id="statsContainer" style="display: none;">
        <div class="stats">
          <div class="stat">
            <div class="stat-number" id="totalSubscribers">0</div>
            <div class="stat-label">Всего</div>
          </div>
          <div class="stat">
            <div class="stat-number" id="activeSubscribers">0</div>
            <div class="stat-label">Активные</div>
          </div>
          <div class="stat">
            <div class="stat-number" id="inactiveSubscribers">0</div>
            <div class="stat-label">Неактивные</div>
          </div>
        </div>
        <div id="subscribersTable"></div>
      </div>
      <div id="statsError" class="error" style="display: none;">
        <strong>Не удалось загрузить данные подписчиков</strong><br>
        <span id="errorMessage">Неизвестная ошибка</span>
      </div>

      <button onclick="logout()" class="btn" style="margin-top: 20px;">Выйти</button>
    </div>

    <!-- Секция загрузки -->
    <div id="loading" style="text-align: center; padding: 40px;">
      <div class="loading-spinner"></div>
      <p>Проверяем авторизацию...</p>
    </div>

    <script src="/js/main.js"></script>
  `;
}

/**
 * Роут для выхода из системы (localStorage очищается на клиенте)
 */
router.get('/logout', (_req: Request, res: Response): void => {
  // Просто перенаправляем на главную - localStorage очищается JavaScript
  res.redirect('/');
});

export default router; 