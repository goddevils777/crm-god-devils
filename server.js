const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./database/init');

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { dbPath } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Настройка сессий для авторизации
app.use(session({
    secret: 'god-devils-crm-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // true только для HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Добавь после настройки статических файлов:
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // Возвращаем пустой ответ для favicon
});

// Базовый роут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для авторизации
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Заполните все поля' });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error('Ошибка БД:', err);
            return res.json({ success: false, message: 'Ошибка сервера' });
        }
        
        if (!user) {
            return res.json({ success: false, message: 'Неверный логин или пароль' });
        }
        
        // Проверяем пароль
        bcrypt.compare(password, user.password, (err, isValid) => {
            if (err || !isValid) {
                return res.json({ success: false, message: 'Неверный логин или пароль' });
            }
            
            // Сохраняем в сессию
            req.session.userId = user.id;
            req.session.username = user.username;
            
            res.json({ success: true, message: 'Авторизация успешна' });
        });
    });
    
    db.close();
});


// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
}

// API для регистрации
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    
    // Валидация
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Логин и пароль обязательны' 
        });
    }
    
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ 
            success: false, 
            message: 'Логин должен содержать от 3 до 20 символов' 
        });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Логин может содержать только буквы, цифры и подчеркивание' 
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Пароль должен содержать минимум 6 символов' 
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем, существует ли пользователь
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
        if (err) {
            console.error('Ошибка проверки пользователя:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Ошибка сервера' 
            });
        }
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Пользователь с таким логином уже существует' 
            });
        }
        
        // Хешируем пароль
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // Создаем нового пользователя
        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            function(err) {
                if (err) {
                    console.error('Ошибка создания пользователя:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка при создании пользователя' 
                    });
                }
                
                console.log(`✅ Новый пользователь зарегистрирован: ${username}`);
                res.json({ 
                    success: true, 
                    message: 'Пользователь успешно зарегистрирован' 
                });
            }
        );
    });
    
    db.close();
});

// Роут для страницы регистрации
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Роут для CRM панели (только для авторизованных)
app.get('/crm', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

// API для выхода
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});


// Роут для страницы добавления клиента
app.get('/add-client', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-client.html'));
});

// Роут для компонентов (шапка)
app.get('/components/header.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'components', 'header.html'));
});

// API для проверки авторизации
app.get('/api/check-auth', requireAuth, (req, res) => {
    res.json({ 
        success: true, 
        user: {
            id: req.session.userId,
            username: req.session.username
        }
    });
});


// API для получения списка клиентов
app.get('/api/clients', requireAuth, (req, res) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all('SELECT * FROM clients ORDER BY date_created DESC', (err, clients) => {
        if (err) {
            console.error('Ошибка получения клиентов:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        res.json(clients);
    });
    
    db.close();
});

// API для добавления клиента
// Замени API для добавления клиента на:
app.post('/api/clients', requireAuth, (req, res) => {
    const { project_name, client_contact, technical_task, status, price, deadline, notes } = req.body;
    
    // Валидация обязательных полей
    if (!project_name || !client_contact) {
        return res.status(400).json({ error: 'Название проекта и контакт клиента обязательны' });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Генерируем ID клиента (например: GD-2024-001)
    const currentYear = new Date().getFullYear();
    
    db.get('SELECT COUNT(*) as count FROM clients WHERE date_created LIKE ?', [`${currentYear}%`], (err, row) => {
        if (err) {
            console.error('Ошибка подсчета клиентов:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        const clientNumber = (row.count + 1).toString().padStart(3, '0');
        const clientId = `GD-${currentYear}-${clientNumber}`;
        
        const query = `
            INSERT INTO clients (client_id, project_name, client_contact, technical_task, status, price, deadline_days, notes, days_passed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `;
        
        db.run(query, [
            clientId,
            project_name,
            client_contact,
            technical_task || '',
            status || 'Новый',
            price || null,
            deadline || null,
            notes || ''
        ], function(err) {
            if (err) {
                console.error('Ошибка добавления клиента:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            res.json({ success: true, id: this.lastID, client_id: clientId });
        });
    });
    
    db.close();
});

// API для получения предварительного ID
app.get('/api/clients/preview-id', requireAuth, (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const currentYear = new Date().getFullYear();
    
    db.get('SELECT COUNT(*) as count FROM clients WHERE date_created LIKE ?', [`${currentYear}%`], (err, row) => {
        if (err) {
            console.error('Ошибка подсчета клиентов:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        const clientNumber = (row.count + 1).toString().padStart(3, '0');
        const previewId = `GD-${currentYear}-${clientNumber}`;
        
        res.json({ success: true, preview_id: previewId });
    });
    
    db.close();
});

// Функция обновления количества дней для всех клиентов
function updateClientDays() {
    const db = new sqlite3.Database(dbPath);
    
    db.all('SELECT id, date_created FROM clients', (err, clients) => {
        if (err) {
            console.error('Ошибка получения клиентов для обновления дней:', err);
            db.close();
            return;
        }
        
        clients.forEach(client => {
            const createdDate = new Date(client.date_created);
            const currentDate = new Date();
            const daysPassed = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
            
            db.run('UPDATE clients SET days_passed = ? WHERE id = ?', [daysPassed, client.id], (err) => {
                if (err) {
                    console.error('Ошибка обновления дней для клиента:', client.id, err);
                }
            });
        });
    });
    
    db.close();
}

// Обновляем дни при каждом запросе списка клиентов
app.get('/api/clients', requireAuth, (req, res) => {
    // Сначала обновляем дни
    updateClientDays();
    
    // Затем получаем обновленный список
    setTimeout(() => {
        const db = new sqlite3.Database(dbPath);
        
        db.all('SELECT * FROM clients ORDER BY date_created DESC', (err, clients) => {
            if (err) {
                console.error('Ошибка получения клиентов:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            res.json(clients);
        });
        
        db.close();
    }, 100);
});

// API для удаления клиента
app.delete('/api/clients/:id', requireAuth, (req, res) => {
    const clientId = req.params.id;
    
    const db = new sqlite3.Database(dbPath);
    
    db.run('DELETE FROM clients WHERE id = ?', [clientId], function(err) {
        if (err) {
            console.error('Ошибка удаления клиента:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        res.json({ success: true });
    });
    
    db.close();
});


// API для получения конкретного клиента
app.get('/api/clients/:id', requireAuth, (req, res) => {
    const clientId = req.params.id;
    
    const db = new sqlite3.Database(dbPath);
    
    db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
        if (err) {
            console.error('Ошибка получения клиента:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        
        // Обновляем количество дней
        const createdDate = new Date(client.date_created);
        const currentDate = new Date();
        const daysPassed = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
        
        client.days_passed = daysPassed;
        
        res.json(client);
    });
    
    db.close();
});

// API для обновления клиента
app.put('/api/clients/:id', requireAuth, (req, res) => {
    const clientId = req.params.id;
    const { project_name, client_contact, technical_task, status, price, deadline_days, notes } = req.body;
    
    // Валидация
    if (!project_name || !client_contact) {
        return res.status(400).json({ error: 'Название проекта и контакт клиента обязательны' });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    const query = `
        UPDATE clients 
        SET project_name = ?, client_contact = ?, technical_task = ?, 
            status = ?, price = ?, deadline_days = ?, notes = ?
        WHERE id = ?
    `;
    
    db.run(query, [
        project_name,
        client_contact,
        technical_task || '',
        status || 'Новый',
        price || null,
        deadline_days || null,
        notes || '',
        clientId
    ], function(err) {
        if (err) {
            console.error('Ошибка обновления клиента:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        
        res.json({ success: true });
    });
    
    db.close();
});

// Роут для страницы редактирования
app.get('/edit-client', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit-client.html'));
});




// Добавь этот API в server.js:
app.post('/api/recreate-database', (req, res) => {
    const { recreateKey } = req.body;
    
    if (recreateKey !== 'recreate-database-2024') {
        return res.status(401).json({ error: 'Неверный ключ' });
    }
    
    console.log('🗑️ ПОЛНОЕ ПЕРЕСОЗДАНИЕ БАЗЫ ДАННЫХ...');
    
    const fs = require('fs');
    
    // Удаляем старую базу если существует
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath);
            console.log('✅ Старая база удалена');
        } catch (err) {
            console.error('Ошибка удаления старой базы:', err);
            return res.status(500).json({ error: 'Не удалось удалить старую базу' });
        }
    }
    
    // Создаем новую базу с правильной структурой
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Ошибка создания новой базы:', err);
            return res.status(500).json({ error: 'Ошибка создания базы' });
        }
        console.log('✅ Новая база создана');
    });
    
    // Создаем таблицу пользователей
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            full_name TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы users:', err);
            db.close();
            return res.status(500).json({ error: 'Ошибка создания таблицы users' });
        }
        console.log('✅ Таблица users создана');
        
        // Создаем таблицу клиентов с ВСЕМИ полями сразу
        db.run(`
            CREATE TABLE clients (
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
                db.close();
                return res.status(500).json({ error: 'Ошибка создания таблицы clients' });
            }
            console.log('✅ Таблица clients создана со всеми полями');
            
            // Проверяем структуру
            db.all("PRAGMA table_info(clients)", (err, columns) => {
                if (err) {
                    console.error('Ошибка проверки структуры:', err);
                } else {
                    console.log('📋 Поля в таблице clients:');
                    columns.forEach(col => console.log(`- ${col.name} (${col.type})`));
                }
                
                db.close();
                
                res.json({
                    success: true,
                    message: 'База данных полностью пересоздана',
                    tables: ['users', 'clients'],
                    fields: columns ? columns.map(col => col.name) : []
                });
                
                console.log('🎉 БАЗА ДАННЫХ ПЕРЕСОЗДАНА УСПЕШНО!');
            });
        });
    });
});

// В server.js:
app.get('/recreate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recreate.html'));
});

// Инициализация базы данных при запуске
initDatabase().catch(err => {
    console.error('Критическая ошибка БД:', err);
    process.exit(1);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 CRM сервер запущен на http://localhost:${PORT}`);
    console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚂 Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No'}`);
});