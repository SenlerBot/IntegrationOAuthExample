# 🚀 Senler OAuth Integration Example

Пример интеграции с Senler API через OAuth 2.0 авторизацию с поддержкой popup и iframe.

## 📋 Особенности

- ✅ **OAuth 2.0 авторизация** через Senler
- ✅ **Popup авторизация** без перезагрузки страницы
- ✅ **Iframe совместимость** - работает во встроенных приложениях
- ✅ **localStorage** для хранения авторизации (без проблем с cookies)
- ✅ **group_id из URL** - автоматическое извлечение и использование
- ✅ **Модульная архитектура** TypeScript + Express
- ✅ **API для работы с подписчиками** Senler

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
```bash
cp env.example .env
```

Заполните `.env` файл:
```env
SENLER_CLIENT_ID=your_senler_client_id_here
SENLER_CLIENT_SECRET=your_senler_client_secret_here
SENLER_CALLBACK_URL=http://localhost:3000/auth/senler/callback
```

### 3. Запуск
```bash
npm start
```

Приложение будет доступно на `http://localhost:3000`

## 🔧 Настройка Senler приложения

1. Перейдите в [панель разработчика Senler](https://senler.ru/developers)
2. Создайте новое приложение
3. Укажите **Callback URL**: `http://localhost:3000/auth/senler/callback`
4. Скопируйте `Client ID` и `Client Secret` в `.env`

## 📱 Как работает

### Popup авторизация
```javascript
// Клик по кнопке "Войти"
openAuthPopup() → popup окно → OAuth → данные в localStorage → обновление UI
```

### Обычная авторизация
```javascript
// Прямой переход на /auth/senler
OAuth redirect → callback → popup с данными → localStorage → главная страница
```

### group_id из URL
```javascript
// URL с group_id
http://localhost:3000?group_id=53178 → автоматически используется в OAuth
```

### Хранение данных
Все данные авторизации хранятся в **localStorage**:
- `senler_access_token` - OAuth токен доступа
- `senler_group_id` - ID группы ВКонтакте (приоритет: URL → Senler API)
- `senler_auth_time` - время авторизации

## 🌐 API Endpoints

### Авторизация
- `GET /auth/senler` - начало OAuth авторизации
- `GET /auth/senler/popup` - popup авторизация  
- `GET /auth/senler/callback` - OAuth callback
- `POST /auth/validate-auth` - валидация токена

### Данные
- `POST /auth/subscribers` - получение статистики подписчиков
- `GET /logout` - выход (очистка localStorage)

### Пример API запроса
```javascript
fetch('/auth/subscribers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'your_token',
    groupId: 'your_group_id'
  })
})
```

## 📁 Структура проекта

```
src/
├── app.ts              # Главный файл приложения
├── config/
│   └── passport.ts     # Настройка Passport OAuth
├── routes/
│   ├── index.ts        # Главная страница
│   └── auth.ts         # Роуты авторизации и API
├── services/
│   └── senler.ts       # Сервис для работы с Senler API
└── utils/
    └── html.ts         # Генерация HTML страниц

public/
├── css/                # Стили
├── js/
│   ├── main.js         # Управление состоянием (localStorage)
│   ├── auth.js         # Popup авторизация
│   ├── popup-success.js # Обработка успеха в popup
│   └── popup-error.js  # Обработка ошибок в popup
```

## 🖼️ Использование в iframe

Приложение **автоматически работает в iframe** без дополнительных настроек:

```html
<iframe 
  src="http://localhost:3000" 
  width="800" 
  height="600"
  frameborder="0">
</iframe>
```

**Никаких специальных настроек не требуется** - localStorage работает везде!

## 🔧 Разработка

### Команды
```bash
npm run build    # Сборка TypeScript
npm start        # Сборка + запуск
npm run dev      # Разработка с автоперезагрузкой (если настроено)
```

### Отладка
- Логи авторизации в консоли браузера
- Проверка localStorage в DevTools → Application → Local Storage
- Логи сервера в терминале

### Расширение функциональности
1. **Добавить новые API методы** в `src/services/senler.ts`
2. **Создать новые endpoints** в `src/routes/auth.ts`
3. **Обновить UI** в `public/js/main.js`

## ⚙️ Переменные окружения

```env
# Обязательные
SENLER_CLIENT_ID=your_client_id
SENLER_CLIENT_SECRET=your_client_secret
SENLER_CALLBACK_URL=http://localhost:3000/auth/senler/callback

# Опциональные
PORT=3000
SESSION_SECRET=your_random_secret
SENLER_API_URL=https://api.senler.ru/v2/
VK_GROUP_ID=your_vk_group_id
```

## 🔐 Безопасность

- **localStorage** доступен только JavaScript на том же домене
- **Токены валидируются** на сервере при каждом API запросе
- **HttpOnly cookies** для системных сессий (минимальные)
- **CORS** настроен для безопасного API доступа

## 🧪 Тестирование

### Локальное тестирование
1. Запустите сервер: `npm start`
2. Откройте `http://localhost:3000`
3. Нажмите "Войти через Senler"
4. Проверьте localStorage в DevTools

### Iframe тестирование
Создайте HTML файл:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Тест iframe</h1>
  <iframe src="http://localhost:3000" width="800" height="600"></iframe>
</body>
</html>
```

## 📚 Используемые библиотеки

- **express** - веб-сервер
- **passport-senler** - OAuth авторизация
- **senler-sdk** - работа с Senler API
- **express-session** - сессии (минимальное использование)
- **typescript** - типизация

## 💡 Ключевые решения

### Почему localStorage?
- ✅ Работает в iframe без ограничений
- ✅ Не требует HTTPS в разработке
- ✅ Нет проблем с SameSite cookies
- ✅ Простота реализации

### Архитектура
- **Клиент** управляет состоянием (localStorage)
- **Сервер** предоставляет API (stateless)
- **Popup** для OAuth без перезагрузки
- **Модульный JavaScript** для расширяемости

## 🤝 Поддержка

Для вопросов по Senler API обращайтесь к [документации Senler](https://senler.ru/developers).

---

**Готов к использованию в production и iframe интеграции!** 🎯 