#!/usr/bin/env node

/**
 * Скрипт для установки всех зависимостей проекта
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Установка зависимостей для passport-senler-example...\n');

try {
  // Проверяем, что мы в правильной директории
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Файл package.json не найден. Убедитесь, что вы в корне проекта.');
    process.exit(1);
  }

  // Устанавливаем зависимости
  console.log('📦 Устанавливаем npm зависимости...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n✅ Все зависимости установлены успешно!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Скопируйте env.example в .env: cp env.example .env');
  console.log('2. Заполните переменные окружения в файле .env');
  console.log('3. Запустите проект: npm run dev');
  console.log('\n🔗 Полезные ссылки:');
  console.log('- passport-senler: https://github.com/maxi-q/passport-senler');
  console.log('- senler-sdk: https://www.npmjs.com/package/senler-sdk');

} catch (error) {
  console.error('❌ Ошибка при установке зависимостей:', error.message);
  process.exit(1);
} 