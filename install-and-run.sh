#!/bin/bash

# Скрипт для установки Node.js и запуска приложения

echo "Проверка Node.js..."

if command -v node &> /dev/null; then
    echo "Node.js уже установлен: $(node --version)"
else
    echo "Node.js не найден. Установка..."
    
    # Попытка установить через apt (требует sudo)
    if command -v sudo &> /dev/null; then
        echo "Установка Node.js через apt..."
        sudo apt update
        sudo apt install -y nodejs npm
    else
        echo "ОШИБКА: sudo не доступен. Пожалуйста, установите Node.js вручную:"
        echo "  sudo apt update && sudo apt install -y nodejs npm"
        exit 1
    fi
fi

echo "Проверка версии Node.js..."
node --version
npm --version

echo "Установка зависимостей..."
npm install

echo "Запуск dev сервера..."
npm run dev

