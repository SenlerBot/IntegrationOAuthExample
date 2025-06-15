// Скрипт для обработки успешной авторизации в popup окне

(function() {
  // Получаем данные из meta тегов
  const accessToken = document.querySelector('meta[name="access-token"]').content;
  const groupId = document.querySelector('meta[name="group-id"]').content;
  
  console.log('🔑 Popup: Получены данные авторизации');
  
  // Принудительное закрытие popup через 5 секунд (на случай зависания)
  const forceCloseTimeout = setTimeout(() => {
    console.log('⏰ Принудительное закрытие popup');
    window.close();
  }, 5000);
  
  // Обновляем прогресс бар
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    progressFill.style.animationDuration = '2s';
  }
  
  // Отправляем успешный результат родительскому окну
  if (window.opener) {
    console.log('📤 Отправляем данные родительскому окну');
    
    window.opener.postMessage({
      type: 'senler-auth-success',
      accessToken: accessToken,
      groupId: groupId
    }, '*');
    
    // Обновляем UI
    updateStatus('success', 'Данные отправлены. Закрываем окно...');
    
    // Закрываем popup через короткую задержку
    clearTimeout(forceCloseTimeout);
    setTimeout(() => {
      console.log('🚪 Закрываем popup');
      window.close();
    }, 1500);
    
  } else {
    console.log('🏠 Нет родительского окна, перенаправляем на главную');
    clearTimeout(forceCloseTimeout);
    window.location.href = '/';
  }
  
  // Функция для обновления статуса на странице
  function updateStatus(type, message) {
    const statusElement = document.querySelector('.success p');
    const spinnerElement = document.querySelector('.loading-spinner');
    
    if (statusElement) {
      statusElement.textContent = message;
      
      if (type === 'error') {
        statusElement.style.color = '#dc3545';
      } else if (type === 'success') {
        statusElement.style.color = '#28a745';
      }
    }
    
    if (spinnerElement && type !== 'loading') {
      spinnerElement.style.display = 'none';
    }
  }
  
})(); 