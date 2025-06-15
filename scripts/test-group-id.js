/**
 * Тестовый скрипт для проверки OAuth с group_id
 * Запуск: node scripts/test-group-id.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Тестирование OAuth с group_id...\n');

// Проверяем env файл
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Файл .env не найден. Скопируйте env.example в .env');
  process.exit(1);
}

// Читаем переменные
const env = fs.readFileSync(envPath, 'utf8');
const senlerClientId = env.match(/SENLER_CLIENT_ID=(.+)/)?.[1];
const senlerCallbackUrl = env.match(/SENLER_CALLBACK_URL=(.+)/)?.[1];
const port = env.match(/PORT=(\d+)/)?.[1] || '3000';

if (!senlerClientId) {
  console.error('❌ SENLER_CLIENT_ID не настроен в .env');
  process.exit(1);
}

console.log('✅ Конфигурация найдена:');
console.log(`   Client ID: ${senlerClientId}`);
console.log(`   Callback URL: ${senlerCallbackUrl || `http://localhost:${port}/auth/senler/callback`}`);

console.log('\n📋 Тестовые URL для проверки:');

// URL для тестирования
const testUrls = [
  {
    name: 'Обычная авторизация',
    url: `http://localhost:${port}/`
  },
  {
    name: 'С group_id в URL',
    url: `http://localhost:${port}/?group_id=53178`
  },
  {
    name: 'Полный URL из Senler бота',
    url: `http://localhost:${port}/?user_id=32618&group_id=53178&context=Bot_step&channel_type_id=1&sign=e56fdc0433fc23297c08efc13ed394b5`
  }
];

testUrls.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}:`);
  console.log(`   ${test.url}\n`);
});

console.log('📊 Ожидаемые OAuth URL:');

const baseOAuthUrl = 'https://senler.ru/cabinet/OAuth2authorize';
const callbackUrl = senlerCallbackUrl || `http://localhost:${port}/auth/senler/callback`;

console.log('\n1. Стандартный OAuth (без group_id):');
console.log(`${baseOAuthUrl}?response_type=code&client_id=${senlerClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=random`);

console.log('\n2. OAuth с group_id:');
console.log(`${baseOAuthUrl}?response_type=code&group_id=53178&client_id=${senlerClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=random`);

console.log('\n💡 Как тестировать:');
console.log('1. Запустите сервер: npm start');
console.log('2. Откройте любой из тестовых URL выше');
console.log('3. Нажмите "Авторизоваться через Senler"');
console.log('4. Проверьте в консоли браузера localStorage после авторизации');
console.log('5. Убедитесь, что group_id сохранился правильно'); 