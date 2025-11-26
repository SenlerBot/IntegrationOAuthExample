/**
 * Generate complete HTML page with styles and scripts
 * @param title - Page title for the HTML document
 * @param content - HTML content to be inserted into the page body
 * @returns Complete HTML document as string
 */
export const generateHTML = (title: string, content: string): string => {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="container">
    <div class="logo">Senler Dashboard</div>
    ${content}
  </div>
  <script src="/js/auth.js"></script>
</body>
</html>`;
};

interface PopupSuccessData {
  accessToken: string;
  groupId: string;
  requestedGroupId?: string | null;
}

/**
 * Generate success page HTML for popup authorization
 * Creates a page that sends authorization data to parent window via postMessage
 * @param data - Authorization data including access token, group ID, and requested group ID
 * @returns HTML page that automatically sends data to parent window and shows success message
 */
export const generatePopupSuccessHTML = (data: PopupSuccessData): string => {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Авторизация успешна</title>
  <link rel="stylesheet" href="/css/popup.css">
</head>
<body>
  <div class="popup-container">
    <div class="success">
      <h2>✅ Авторизация успешна!</h2>
      <div class="loading-spinner"></div>
      <p>Сохраняем данные авторизации...</p>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  </div>
  <script>
    // Отправляем данные в родительское окно
    window.opener.postMessage({
      accessToken: "${data.accessToken}",
      groupId: "${data.groupId}",
      requestedGroupId: "${data.requestedGroupId || ''}",
      groupIdMatches: ${data.requestedGroupId ? (data.requestedGroupId === data.groupId) : 'null'}
    }, window.location.origin);
  </script>
</body>
</html>`;
};

/**
 * Generate error page HTML for popup authorization
 * Creates a page that displays error information and auto-closes after timeout
 * @param error - Error code or type
 * @param description - Optional detailed error description
 * @returns HTML page that displays error and auto-closes popup window
 */
export const generatePopupErrorHTML = (error: string, description?: string): string => {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="error" content="${error}">
  <meta name="error-description" content="${description || 'Неизвестная ошибка'}">
  <title>Ошибка авторизации</title>
  <link rel="stylesheet" href="/css/popup.css">
</head>
<body>
  <div class="popup-container">
    <div class="error">
      <h2>❌ Ошибка авторизации</h2>
      <p><strong>Код ошибки:</strong> ${error}</p>
      <p><strong>Описание:</strong> ${description || 'Неизвестная ошибка'}</p>
      <p style="margin-top: 15px; font-size: 0.9rem; color: #6c757d;">
        Окно будет закрыто автоматически через 3 секунды<br>
        Или нажмите в любом месте для закрытия
      </p>
    </div>
  </div>
  <script src="/js/popup-error.js"></script>
</body>
</html>`;
}; 