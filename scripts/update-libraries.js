#!/usr/bin/env node

/**
 * Скрипт для обновления локальных библиотек passport-senler и senler-sdk
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Цвета для консоли
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

// Функция для выполнения команд с логированием
function runCommand(command, description, workingDir = '.') {
  console.log(`${colors.blue}➤${colors.reset} ${description}`);
  console.log(`${colors.cyan}  ${command}${colors.reset}`);
  
  try {
    const result = execSync(command, { 
      cwd: workingDir, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`${colors.green}✅ Успешно: ${description}${colors.reset}\n`);
    return result;
  } catch (error) {
    console.error(`${colors.red}❌ Ошибка: ${description}${colors.reset}`);
    console.error(`${colors.red}   ${error.message}${colors.reset}\n`);
    throw error;
  }
}

// Проверка существования папок
function checkLibraryExists(libraryPath, libraryName) {
  if (!existsSync(libraryPath)) {
    console.error(`${colors.red}❌ Папка ${libraryName} не найдена: ${libraryPath}${colors.reset}`);
    return false;
  }
  return true;
}

async function updateLibraries() {
  console.log(`${colors.bright}${colors.magenta}🔄 Обновление локальных библиотек${colors.reset}`);
  console.log(`${colors.yellow}───────────────────────────────────────${colors.reset}\n`);
  
  const currentDir = process.cwd();
  const passportSenlerPath = path.resolve('../passport-senler');
  const senlerSdkPath = path.resolve('../senler-sdk/senler-sdk');
  
  // Проверяем существование библиотек
  const hasPassportSenler = checkLibraryExists(passportSenlerPath, 'passport-senler');
  const hasSenlerSdk = checkLibraryExists(senlerSdkPath, 'senler-sdk');
  
  if (!hasPassportSenler && !hasSenlerSdk) {
    console.error(`${colors.red}❌ Локальные библиотеки не найдены${colors.reset}`);
    process.exit(1);
  }
  
  try {
    // Обновление passport-senler
    if (hasPassportSenler) {
      console.log(`${colors.bright}📦 Обновление passport-senler${colors.reset}`);
      runCommand('npm install', 'Обновление зависимостей passport-senler', passportSenlerPath);
      runCommand('npm run build', 'Сборка passport-senler', passportSenlerPath);
    }
    
    // Обновление senler-sdk
    if (hasSenlerSdk) {
      console.log(`${colors.bright}📦 Обновление senler-sdk${colors.reset}`);
      runCommand('npm install', 'Обновление зависимостей senler-sdk', senlerSdkPath);
      runCommand('npm run build:clean', 'Чистая сборка senler-sdk', senlerSdkPath);
    }
    
    // Обновление основного проекта
    console.log(`${colors.bright}🏗️ Обновление основного проекта${colors.reset}`);
    runCommand('npm install', 'Переустановка зависимостей основного проекта', currentDir);
    runCommand('npm run typecheck', 'Проверка TypeScript типов', currentDir);
    runCommand('npm run build', 'Сборка основного проекта', currentDir);
    
    // Проверка версий
    console.log(`${colors.bright}📋 Проверка версий${colors.reset}`);
    console.log(`${colors.cyan}Установленные локальные библиотеки:${colors.reset}`);
    
    if (hasPassportSenler) {
      try {
        runCommand('npm ls passport-senler', 'Версия passport-senler', currentDir);
      } catch (e) {
        // Игнорируем ошибки npm ls
      }
    }
    
    if (hasSenlerSdk) {
      try {
        runCommand('npm ls senler-sdk', 'Версия senler-sdk', currentDir);
      } catch (e) {
        // Игнорируем ошибки npm ls
      }
    }
    
    console.log(`${colors.green}${colors.bright}🎉 Все библиотеки успешно обновлены!${colors.reset}`);
    console.log(`${colors.yellow}📝 Не забудьте обновить UPDATE_LOG.md${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}💥 Процесс обновления прерван из-за ошибки${colors.reset}`);
    process.exit(1);
  }
}

// Запуск обновления
updateLibraries().catch(error => {
  console.error(`${colors.red}Необработанная ошибка:${colors.reset}`, error);
  process.exit(1);
}); 