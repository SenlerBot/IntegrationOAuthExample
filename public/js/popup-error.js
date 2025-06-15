// Скрипт для обработки ошибок авторизации в popup окне

(function() {
  // Получаем данные об ошибке из meta тегов
  const error = document.querySelector('meta[name="error"]').content;
  const description = document.querySelector('meta[name="error-description"]').content;
  
  console.log('❌ Popup: Ошибка авторизации:', error);
  
  // Отправляем ошибку родительскому окну
  if (window.opener) {
    console.log('📤 Отправляем ошибку родительскому окну');
    
    window.opener.postMessage({
      type: 'senler-auth-error',
      error: error,
      description: description
    }, '*');
  }
  
  // Автоматически закрываем popup через 3 секунды
  setTimeout(() => {
    console.log('🚪 Автоматическое закрытие popup с ошибкой');
    window.close();
  }, 3000);
  
  // Добавляем возможность закрытия по клику
  document.addEventListener('click', () => {
    console.log('👆 Закрытие popup по клику');
    window.close();
  });
  
  // Закрытие по Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      console.log('⌨️ Закрытие popup по Escape');
      window.close();
    }
  });
  
})(); 