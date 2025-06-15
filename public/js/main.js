// Основной JavaScript для управления состоянием приложения

// Ключи для localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'senler_access_token',
  GROUP_ID: 'senler_group_id',
  AUTH_TIME: 'senler_auth_time'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
});

// Проверка статуса авторизации
function checkAuthStatus() {
  let accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  let groupId = localStorage.getItem(STORAGE_KEYS.GROUP_ID);
  const authTime = localStorage.getItem(STORAGE_KEYS.AUTH_TIME);
  
  // Проверяем, есть ли group_id в URL (приоритет над localStorage)
  const urlGroupIdMeta = document.querySelector('meta[name="url-group-id"]');
  const groupIdFromUrl = urlGroupIdMeta ? urlGroupIdMeta.getAttribute('content') : null;
  
  if (groupIdFromUrl && accessToken && groupIdFromUrl !== groupId) {
    // Если group_id из URL отличается от сохраненного, обновляем
    console.log('📌 Обновляем group_id из URL:', groupIdFromUrl);
    localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupIdFromUrl);
    groupId = groupIdFromUrl;
  }
  
  document.getElementById('loading').style.display = 'none';
  
  if (accessToken && groupId) {
    showAuthenticatedState(accessToken, groupId, authTime);
    loadSubscribersData(accessToken, groupId);
  } else {
    showUnauthenticatedState();
  }
}

// Показать состояние авторизованного пользователя
function showAuthenticatedState(accessToken, groupId, authTime) {
  document.getElementById('unauthenticated').style.display = 'none';
  document.getElementById('authenticated').style.display = 'block';
  
  document.getElementById('groupIdDisplay').textContent = groupId;
  document.getElementById('groupIdText').textContent = groupId;
  document.getElementById('tokenDisplay').textContent = accessToken.substring(0, 15) + '...';
  document.getElementById('authTime').textContent = authTime ? 
    new Date(authTime).toLocaleString('ru-RU') : 'Неизвестно';
}

// Показать состояние неавторизованного пользователя
function showUnauthenticatedState() {
  document.getElementById('authenticated').style.display = 'none';
  document.getElementById('unauthenticated').style.display = 'block';
}

// Загрузка данных подписчиков
async function loadSubscribersData(accessToken, groupId) {
  const loadingEl = document.getElementById('loadingStats');
  const statsEl = document.getElementById('statsContainer');
  const errorEl = document.getElementById('statsError');
  
  try {
    loadingEl.style.display = 'block';
    statsEl.style.display = 'none';
    errorEl.style.display = 'none';
    
    const response = await fetch('/auth/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken: accessToken,
        groupId: groupId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Ошибка загрузки данных');
    }
    
    if (result.success && result.data) {
      displaySubscribersData(result.data);
    } else {
      throw new Error('Неверный формат ответа от сервера');
    }
    
  } catch (error) {
    console.error('❌ Ошибка загрузки подписчиков:', error);
    showStatsError(error.message);
  } finally {
    loadingEl.style.display = 'none';
  }
}

// Отображение данных подписчиков
function displaySubscribersData(data) {
  const statsEl = document.getElementById('statsContainer');
  
  document.getElementById('totalSubscribers').textContent = data.total || 0;
  document.getElementById('activeSubscribers').textContent = data.active || 0;
  document.getElementById('inactiveSubscribers').textContent = data.inactive || 0;
  
  const tableContainer = document.getElementById('subscribersTable');
  if (data.subscribers && data.subscribers.length > 0) {
    const subscribers = data.subscribers.slice(0, 10);
    const tableHtml = `
      <div class="table" style="margin-top: 20px;">
        <div class="table-header">Подписчики (первые 10)</div>
        ${subscribers.map(sub => `
          <div class="table-row">
            <div>${sub.id || 'N/A'}</div>
            <div>${(sub.first_name || 'Неизвестно') + ' ' + (sub.last_name || '')}</div>
            <div>${sub.is_active ? '✅ Активен' : '❌ Неактивен'}</div>
          </div>
        `).join('')}
      </div>
    `;
    tableContainer.innerHTML = tableHtml;
  } else {
    tableContainer.innerHTML = '<p style="margin-top: 15px;">Подписчики не найдены</p>';
  }
  
  statsEl.style.display = 'block';
  document.getElementById('statsError').style.display = 'none';
}

// Показать ошибку загрузки статистики
function showStatsError(message) {
  const statsEl = document.getElementById('statsContainer');
  const errorEl = document.getElementById('statsError');
  const messageEl = document.getElementById('errorMessage');
  
  messageEl.textContent = message;
  statsEl.style.display = 'none';
  errorEl.style.display = 'block';
}

// Сохранение данных авторизации в localStorage
function saveAuthData(accessToken, groupId) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupId);
  localStorage.setItem(STORAGE_KEYS.AUTH_TIME, new Date().toISOString());
  
  console.log('✅ Данные авторизации сохранены в localStorage');
}

// Выход из системы
function logout() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.GROUP_ID);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TIME);
  
  console.log('🚪 Данные авторизации удалены из localStorage');
  window.location.reload();
}

// Экспортируем функции для использования в других скриптах
window.saveAuthData = saveAuthData;
window.logout = logout;
