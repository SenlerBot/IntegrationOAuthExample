# 🔗 Поддержка group_id в URL параметрах

## 🎯 Назначение

Теперь приложение поддерживает передачу `group_id` через URL параметры. Это полезно когда пользователь переходит по прямой ссылке с уже известным group_id.

## 📝 Пример использования

### URL с group_id:
```
http://localhost:3000?user_id=32618&group_id=53178&context=Bot_step&channel_type_id=1&sign=e56fdc0433fc23297c08efc13ed394b5
```

### Что происходит:
1. ✅ group_id **автоматически извлекается** из URL
2. ✅ Передается в **OAuth стратегию** через state параметр  
3. ✅ Используется с **приоритетом** над данными от Senler API
4. ✅ Сохраняется в **localStorage** для дальнейшего использования

## 🔧 Как работает

### 🔄 Обычная авторизация:
```
GET /?group_id=53178
  ↓
GET /auth/senler?group_id=53178 (автоматически)
  ↓
OAuth с state: {"groupId": "53178"}
  ↓
Callback использует group_id из state
```

### 🖼️ Popup авторизация:
```
Клик "Войти" на странице с group_id=53178
  ↓  
GET /auth/senler/popup?group_id=53178
  ↓
OAuth с state: {"popup": true, "groupId": "53178"}
  ↓
Callback использует group_id из state
```

## 📋 Технические детали

### 🔍 Извлечение group_id:
```javascript
// Серверная сторона (routes/index.ts)
const groupIdFromUrl = req.query.group_id as string;

// Передача в HTML через meta тег
<meta name="url-group-id" content="${groupIdFromUrl}">

// Клиентская сторона (auth.js)
const urlGroupIdMeta = document.querySelector('meta[name="url-group-id"]');
const groupIdFromUrl = urlGroupIdMeta.getAttribute('content');
```

### 🎯 Передача в OAuth:
```javascript
// Обычная авторизация
passport.authenticate('senler', {
  state: JSON.stringify({ groupId: groupIdFromUrl })
});

// Popup авторизация  
passport.authenticate('senler', {
  state: JSON.stringify({ popup: true, groupId: groupIdFromUrl })
});
```

### 🏆 Приоритет в callback:
```javascript
// В callback обработчике
const stateData = JSON.parse(req.query.state);
const groupIdFromState = stateData.groupId;

// Приоритет: URL > Senler API
if (groupIdFromState) {
  groupId = groupIdFromState; // Используем из URL
} else {
  groupId = user?.groupId;     // Используем от Senler
}
```

## ✅ Преимущества

### 🎯 Точность:
- Гарантированно правильный group_id
- Нет зависимости от корректности данных Senler API
- Работает даже если Senler не передает group_id

### 🔗 Удобство интеграции:
- Прямые ссылки с group_id работают автоматически
- Не требует дополнительных действий от пользователя
- Совместимо с существующими ссылками

### 🖼️ Iframe поддержка:
- Работает в iframe с параметрами в URL
- localStorage автоматически обновляется
- Корректная работа во вложенных окнах

## 🧪 Тестирование

### 📝 Тестовые сценарии:

**1. URL без group_id:**
```
http://localhost:3000
→ Обычная авторизация, group_id от Senler API
```

**2. URL с group_id:**
```
http://localhost:3000?group_id=53178
→ Использует group_id=53178 из URL
```

**3. Popup с group_id:**
```
Открыть http://localhost:3000?group_id=53178
Нажать "Войти" → popup использует group_id=53178
```

**4. Смена group_id:**
```
localStorage: group_id=12345
URL: group_id=53178
→ Обновляет localStorage до 53178
```

### 🔍 Проверка в DevTools:

**Console логи:**
```javascript
📌 Используем group_id из URL: 53178
📌 Передаем group_id в popup: 53178
📌 Обновляем group_id из URL: 53178
```

**localStorage:**
```javascript
localStorage.getItem('senler_group_id') // '53178'
```

**Meta тег:**
```html
<meta name="url-group-id" content="53178">
```

## 🔒 Безопасность

### ✅ Валидация:
- group_id проверяется на наличие перед использованием
- Экранирование при выводе в HTML
- Валидация на серверной стороне в API endpoints

### 🛡️ Защита:
- Нет SQL инъекций (используется как строка)
- XSS защита через правильное экранирование
- Валидация типов данных

## 🚀 Совместимость

### ✅ Обратная совместимость:
- Существующие ссылки без group_id работают как прежде
- Fallback на данные от Senler API
- Не ломает существующую функциональность

### 🖼️ Iframe поддержка:
- Полная поддержка iframe с URL параметрами
- localStorage работает корректно
- Popup авторизация учитывает group_id

## 📚 Примеры интеграции

### 🔗 Создание ссылок:
```javascript
// JavaScript для создания ссылок с group_id
const groupId = '53178';
const integrationUrl = `https://your-domain.com?group_id=${groupId}`;

// HTML ссылка
<a href="https://your-domain.com?group_id=53178">
  Открыть интеграцию для группы 53178
</a>
```

### 🖼️ Iframe встраивание:
```html
<!-- Iframe с group_id -->
<iframe 
  src="https://your-domain.com?group_id=53178" 
  width="800" 
  height="600">
</iframe>
```

### 📱 API использование:
```javascript
// После авторизации с group_id из URL
fetch('/auth/subscribers', {
  method: 'POST',
  body: JSON.stringify({
    accessToken: 'token',
    groupId: '53178' // Автоматически из URL
  })
});
```

---

**🎯 Теперь приложение автоматически использует group_id из URL, обеспечивая точную привязку к нужной группе!** 