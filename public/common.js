// Общие функции для всех страниц CRM

// Загрузка шапки
// Загрузка шапки
async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        const headerHTML = await response.text();
        
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            initLogout();
            loadCurrentUser(); // Добавляем загрузку текущего пользователя
        }
    } catch (error) {
        console.error('Ошибка загрузки шапки:', error);
    }
}

// Загрузка информации о текущем пользователе
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
            const result = await response.json();
            const userElement = document.getElementById('currentUser');
            if (userElement && result.user) {
                userElement.textContent = result.user.username;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        const userElement = document.getElementById('currentUser');
        if (userElement) {
            userElement.textContent = 'Пользователь';
        }
    }
}

// Инициализация кнопки выхода
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST'
                });
                
                const result = await response.json();
                if (result.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        });
    }
}

// Показ уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #34c759;' : ''}
        ${type === 'error' ? 'background: #ff3b30;' : ''}
        ${type === 'info' ? 'background: #007aff;' : ''}
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое удаление
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        if (!response.ok) {
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = '/';
        return false;
    }
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}


// Форматирование цены в долларах
function formatPrice(price) {
    if (!price) return '—';
    return '$' + new Intl.NumberFormat('en-US').format(price);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});