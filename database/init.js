const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// НОВАЯ логика путей - база всегда в корне проекта
const dbPath = process.env.RAILWAY_ENVIRONMENT 
    ? '/app/crm-production.db'  // Railway: в корне контейнера (сохраняется)
    : path.join(__dirname, 'crm.db'); // Локально: в database/

// Функция НЕ нужна для Railway
function ensureDataDir() {
    // Ничего не делаем - файл создается автоматически
}

// Создание и настройка базы данных  
function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('🔧 Окружение:', process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local');
        console.log('📊 Путь к базе:', dbPath);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Ошибка подключения к БД:', err);
                reject(err);
                return;
            }
            console.log('✅ База данных подключена');
        });

        // Создаем таблицы только если их нет
        db.serialize(() => {
            // Таблица пользователей с ПОЛНОЙ структурой
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    full_name TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы users:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Таблица users готова');
            });

            // Таблица клиентов с ПОЛНОЙ структурой сразу
            db.run(`
                CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id TEXT,
                    project_name TEXT NOT NULL,
                    client_contact TEXT NOT NULL,
                    technical_task TEXT,
                    status TEXT DEFAULT 'Новый',
                    price REAL,
                    deadline_days INTEGER,
                    notes TEXT,
                    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
                    days_passed INTEGER DEFAULT 0
                )
            `, (err) => {
                if (err) {
                    console.error('Ошибка создания таблицы clients:', err);
                    reject(err);
                    return;
                }
                console.log('✅ Таблица clients готова');
                
                // Проверяем сколько данных уже есть
                db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                    if (!err) {
                        console.log(`👥 Пользователей в базе: ${row.count}`);
                    }
                });
                
                db.get('SELECT COUNT(*) as count FROM clients', (err, row) => {
                    if (!err) {
                        console.log(`📋 Клиентов в базе: ${row.count}`);
                    }
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
        });
    });
}

module.exports = { initDatabase, dbPath };