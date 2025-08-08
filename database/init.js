const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');

// Создание и настройка базы данных
function initDatabase() {
    return new Promise((resolve, reject) => {
        // Создаем папку для БД если нужно
        ensureDataDir();
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Ошибка подключения к БД:', err);
                reject(err);
                return;
            }
            console.log('📊 База данных подключена:', dbPath);
        });

        // Создание таблицы пользователей
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы users:', err);
                reject(err);
                return;
            }
        });

        // Создание таблицы клиентов
        db.run(`
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT NOT NULL,
                client_contact TEXT NOT NULL,
                technical_task TEXT,
                status TEXT DEFAULT 'Новый',
                date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
                price REAL,
                deadline DATE,
                notes TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы clients:', err);
                reject(err);
                return;
            }
        });

        // Добавляем новые поля если их нет
        db.run(`ALTER TABLE clients ADD COLUMN client_id TEXT`, (err) => {
            // Игнорируем ошибку если поле уже существует
        });
        
        db.run(`ALTER TABLE clients ADD COLUMN deadline_days INTEGER`, (err) => {
            // Игнорируем ошибку если поле уже существует
        });
        
        db.run(`ALTER TABLE clients ADD COLUMN days_passed INTEGER DEFAULT 0`, (err) => {
            // Игнорируем ошибку если поле уже существует
        });

        // Добавляем поле full_name если его нет
        db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`, (err) => {
            // Игнорируем ошибку если поле уже существует
        });

        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ База данных инициализирована');
                resolve();
            }
        });
    });
}

module.exports = { initDatabase, dbPath };