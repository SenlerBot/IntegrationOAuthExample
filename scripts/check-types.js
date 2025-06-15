#!/usr/bin/env node

/**
 * Скрипт для проверки правильности установки и настройки типов TypeScript
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Проверка типов TypeScript...\n');

try {
  // Проверяем наличие TypeScript
  console.log('📦 Проверяем установку TypeScript...');
  execSync('npx tsc --version', { stdio: 'pipe' });
  console.log('✅ TypeScript установлен');

  // Проверяем типы
  console.log('\n🔍 Проверяем типы проекта...');
  execSync('npm run typecheck', { stdio: 'inherit' });
  console.log('✅ Все типы корректны');

  // Проверяем зависимости типов
  console.log('\n📋 Проверяем зависимости типов...');
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredTypes = [
    '@types/node',
    '@types/express', 
    '@types/passport'
  ];

  const missingTypes = requiredTypes.filter(type => 
    !packageJson.devDependencies || !packageJson.devDependencies[type]
  );

  if (missingTypes.length > 0) {
    console.log('⚠️  Отсутствуют типы:', missingTypes.join(', '));
    console.log('Выполните: npm install --save-dev', missingTypes.join(' '));
  } else {
    console.log('✅ Все необходимые типы установлены');
  }

  console.log('\n✅ Проверка завершена успешно!');

} catch (error) {
  console.error('❌ Ошибка при проверке типов:');
  console.error(error.message);
  
  console.log('\n🔧 Возможные решения:');
  console.log('1. Выполните: npm install');
  console.log('2. Проверьте tsconfig.json');
  console.log('3. Убедитесь что все файлы .ts компилируются');
  
  process.exit(1);
} 