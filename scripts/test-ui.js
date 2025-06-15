#!/usr/bin/env node

/**
 * Скрипт для тестирования HTML интерфейса
 */

import { spawn } from 'child_process';
import open from 'open';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.bright}${colors.magenta}🌐 Запуск тестирования HTML интерфейса${colors.reset}`);
console.log(`${colors.yellow}─────────────────────────────────────────────${colors.reset}\n`);

// Запускаем сервер
console.log(`${colors.blue}🚀 Запускаем сервер разработки...${colors.reset}`);

const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Проверяем что сервер запустился
  if (output.includes('Сервер запущен на') && !serverReady) {
    serverReady = true;
    
    setTimeout(() => {
      console.log(`\n${colors.green}✅ Сервер готов!${colors.reset}`);
      console.log(`${colors.cyan}🌐 Открываем браузер...${colors.reset}\n`);
      
      // Открываем браузер
      open('http://localhost:3000').catch(err => {
        console.error(`${colors.red}❌ Не удалось открыть браузер:${colors.reset}`, err.message);
        console.log(`${colors.yellow}💡 Откройте вручную: http://localhost:3000${colors.reset}`);
      });
      
      console.log(`${colors.bright}📋 Инструкции по тестированию:${colors.reset}`);
      console.log(`${colors.green}1.${colors.reset} Проверьте что отображается кнопка "Войти через Senler"`);
      console.log(`${colors.green}2.${colors.reset} Настройте переменные окружения в файле .env`);
      console.log(`${colors.green}3.${colors.reset} Нажмите на кнопку авторизации`);
      console.log(`${colors.green}4.${colors.reset} После авторизации должна появиться статистика`);
      console.log(`\n${colors.yellow}⚠️  Для полного тестирования нужны действующие Senler credentials${colors.reset}`);
      console.log(`${colors.cyan}📖 См. README.md для настройки переменных окружения${colors.reset}`);
      console.log(`\n${colors.magenta}⏹️  Нажмите Ctrl+C для остановки сервера${colors.reset}`);
      
    }, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error(`${colors.red}Ошибка:${colors.reset}`, data.toString());
});

server.on('close', (code) => {
  console.log(`\n${colors.yellow}📴 Сервер остановлен (код: ${code})${colors.reset}`);
  process.exit(code);
});

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}⏹️  Остановка сервера...${colors.reset}`);
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
}); 