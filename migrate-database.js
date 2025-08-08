const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных на продакшене
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/app/data/crm.db' 
    : path.join(__dirname, 'database', 'crm.db');

function migrateDatabase() {
    console.log('Начинаем миграцию базы данных...');
    console.log('Путь к БД:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Ошибка подключения к БД:', err);
            return;
        }
        console.log('База данных подключена');
    });
    
    // Добавляем недостающие поля
    const migrations = [
        'ALTER TABLE clients ADD COLUMN client_id TEXT',
        'ALTER TABLE clients ADD COLUMN deadline_days INTEGER', 
        'ALTER TABLE clients ADD COLUMN days_passed INTEGER DEFAULT 0'
    ];
    
    migrations.forEach((migration, index) => {
        db.run(migration, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Ошибка миграции ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Миграция ${index + 1} выполнена: ${migration.split(' ')[4]}`);
            }
        });
    });
    
    // Проверяем структуру таблицы
    db.all("PRAGMA table_info(clients)", (err, columns) => {
        if (err) {
            console.error('Ошибка получения структуры таблицы:', err);
        } else {
            console.log('Структура таблицы clients:');
            columns.forEach(col => {
                console.log(`- ${col.name} (${col.type})`);
            });
        }
        
        db.close();
        console.log('Миграция завершена');
    });
}

migrateDatabase();