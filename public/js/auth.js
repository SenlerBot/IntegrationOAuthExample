// Глобальные переменные для popup
let authPopup = null;
let checkInterval = null;

// Функция для открытия popup авторизации
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
  let popupUrl = '/auth/senler/popup';
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

// Проверка статуса popup окна
function checkPopupStatus() {
  if (authPopup && authPopup.closed) {
    // Popup закрыто пользователем
    clearInterval(checkInterval);
    resetAuthButton();
    console.log('🔒 Popup закрыто пользователем');
  }
}

// Обработка сообщений от popup
function handlePopupMessage(event) {
  // Проверяем источник сообщения (безопасность)
  if (event.origin !== window.location.origin) {
    return;
  }
  
  const data = event.data;
  
  if (data.type === 'senler-auth-success') {
    console.log('✅ Получены данные авторизации от popup');
    
    // Закрываем popup
    if (authPopup) {
      authPopup.close();
    }
    
    // Останавливаем проверку
    clearInterval(checkInterval);
    
    // Сохраняем данные в localStorage
    console.log('💾 Сохраняем данные в localStorage');
    
    // Используем функцию из main.js
    if (window.saveAuthData) {
      window.saveAuthData(data.accessToken, data.groupId);
      
      // Обновляем кнопку
      const authButton = document.getElementById('authButton');
      if (authButton) {
        authButton.textContent = '✅ Авторизован! Обновляем...';
      }
      
      // Обновляем страницу
      setTimeout(() => {
        console.log('🔄 Обновляем страницу');
        window.location.reload();
      }, 1000);
    } else {
      console.error('❌ Функция saveAuthData не найдена');
      alert('Ошибка: не удается сохранить данные авторизации');
      resetAuthButton();
    }
    
  } else if (data.type === 'senler-auth-error') {
    console.error('❌ Ошибка авторизации в popup:', data.error);
    
    // Закрываем popup
    if (authPopup) {
      authPopup.close();
    }
    
    // Останавливаем проверку
    clearInterval(checkInterval);
    
    // Показываем ошибку
    alert('Ошибка авторизации: ' + (data.error || 'Неизвестная ошибка'));
    resetAuthButton();
  }
}

// Сброс состояния кнопки авторизации
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