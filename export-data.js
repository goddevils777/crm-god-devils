const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'crm.db');

function exportData() {
    const db = new sqlite3.Database(dbPath);
    const exportData = {
        users: [],
        clients: []
    };
    
    return new Promise((resolve, reject) => {
        // Экспортируем пользователей
        db.all('SELECT * FROM users', (err, users) => {
            if (err) {
                reject(err);
                return;
            }
            exportData.users = users;
            
            // Экспортируем клиентов
            db.all('SELECT * FROM clients', (err, clients) => {
                if (err) {
                    reject(err);
                    return;
                }
                exportData.clients = clients;
                
                // Сохраняем в файл
                fs.writeFileSync('database-export.json', JSON.stringify(exportData, null, 2));
                console.log('✅ Данные экспортированы в database-export.json');
                console.log(`📊 Пользователи: ${users.length}`);
                console.log(`👥 Клиенты: ${clients.length}`);
                
                db.close();
                resolve(exportData);
            });
        });
    });
}

exportData().catch(console.error);