// Глобальные переменные для popup
let authPopup = null;
let checkInterval = null;

/**
 * Open popup window for Senler OAuth authorization
 * Handles popup creation, positioning, and message communication
 */
function openAuthPopup() {
  const authButton = document.getElementById('authButton');
  if (authButton) {
    authButton.disabled = true;
    authButton.textContent = '⏳ Авторизация...';
  }
  
  // Размеры и позиция popup окна
  const width = 600;
  const height = 700;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  // Получаем group_id из meta тега если есть
  const urlGroupIdMeta = document.querySelector('meta[name="url-group-id"]');
  const groupIdFromUrl = urlGroupIdMeta ? urlGroupIdMeta.getAttribute('content') : null;
  
  // Формируем URL с параметрами
  let popupUrl = '/auth/senler';
  if (groupIdFromUrl) {
    popupUrl += '?group_id=' + encodeURIComponent(groupIdFromUrl);
    console.log('📌 Передаем group_id в popup:', groupIdFromUrl);
  }
  
  // Открываем popup
  authPopup = window.open(
    popupUrl,
    'senler-auth',
    'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes'
  );
  
  // Проверяем статус popup каждые 1000мс
  checkInterval = setInterval(checkPopupStatus, 1000);
  
  // Обработчик сообщений от popup
  window.addEventListener('message', handlePopupMessage, false);
}

/**
 * Check if popup window is still open and clean up if closed
 */
function checkPopupStatus() {
  if (authPopup && authPopup.closed) {
    clearInterval(checkInterval);
    resetAuthButton();
    window.removeEventListener('message', handlePopupMessage);
  }
}

/**
 * Handle messages from popup window containing authorization data
 * @param {MessageEvent} event - Message event from popup window
 */
function handlePopupMessage(event) {
  // Проверяем источник сообщения
  if (event.origin !== window.location.origin) {
    console.warn('⚠️ Получено сообщение с неизвестного источника:', event.origin);
    return;
  }
  
  const data = event.data;
  
  // Проверяем наличие данных
  if (!data || !data.accessToken || !data.groupId) {
    console.error('❌ Получены некорректные данные от popup');
    return;
  }
  
  // Сохраняем данные в localStorage
  localStorage.setItem('senler_access_token', data.accessToken);
  localStorage.setItem('senler_group_id', data.groupId);
  localStorage.setItem('senler_auth_time', Date.now().toString());
  
  // Сохраняем дополнительную информацию о group_id
  if (data.requestedGroupId) {
    localStorage.setItem('senler_requested_group_id', data.requestedGroupId);
    localStorage.setItem('senler_group_id_matches', data.groupIdMatches.toString());
  } else {
    localStorage.removeItem('senler_requested_group_id');
    localStorage.removeItem('senler_group_id_matches');
  }
  
  // Закрываем popup и обновляем страницу
  if (authPopup) {
    authPopup.close();
    window.location.reload();
  }
}

/**
 * Reset authorization button to default state
 */
function resetAuthButton() {
  const authButton = document.getElementById('authButton');
  if (authButton) {
    authButton.disabled = false;
    authButton.textContent = '🔐 Войти через Senler';
  }
}

// Очистка при закрытии страницы
window.addEventListener('beforeunload', function() {
  if (authPopup) {
    authPopup.close();
  }
  if (checkInterval) {
    clearInterval(checkInterval);
  }
}); 