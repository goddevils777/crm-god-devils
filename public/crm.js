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

// Загрузка шапки
async function loadHeader() {
    try {
        const response = await fetch('/components/header.html');
        const headerHTML = await response.text();
        
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHTML;
            initLogout();
            
            // Загружаем информацию о текущем пользователе
            const authResponse = await fetch('/api/check-auth');
            if (authResponse.ok) {
                const result = await authResponse.json();
                const userElement = document.getElementById('currentUser');
                if (userElement && result.user) {
                    userElement.textContent = result.user.username;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки шапки:', error);
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

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем общую шапку
    loadHeader();
    
    const addClientBtn = document.getElementById('addClientBtn');
    const clientsBody = document.getElementById('clientsBody');
    
    // Проверяем авторизацию
    checkAuth();
    
    // Загрузка клиентов при загрузке страницы
    loadClients();
    
    // Обработчик добавления клиента
    addClientBtn.addEventListener('click', function() {
        window.location.href = '/add-client';
    });
    
    // Загрузка списка клиентов
    async function loadClients() {
        try {
            const response = await fetch('/api/clients');
            const clients = await response.json();
            
            renderClients(clients);
        } catch (error) {
            console.error('Ошибка загрузки клиентов:', error);
            showEmptyState();
        }
    }
    
    // Отрисовка клиентов в таблице
    function renderClients(clients) {
        if (!clients || clients.length === 0) {
            showEmptyState();
            return;
        }
        
        clientsBody.innerHTML = clients.map(client => {
            const deadlineText = getDeadlineText(client);
            const daysPassedClass = getDaysPassedClass(client);
            
            return `
                <tr>
                    <td>
                        <div class="client-info">
                            <div class="client-id">${client.client_id || 'ID не указан'}</div>
                            <div class="project-name">${client.project_name}</div>
                        </div>
                    </td>
                    <td>${client.client_contact}</td>
                    <td><span class="status ${getStatusClass(client.status)}">${client.status}</span></td>
                    <td>${formatPrice(client.price)}</td>
                    <td>
                        <div class="date-info">
                            <div class="created-date">${formatDate(client.date_created)}</div>
                            <div class="days-passed ${daysPassedClass}">
                                ${client.days_passed || 0} дн. назад
                            </div>
                            ${deadlineText ? `<div class="deadline-info">${deadlineText}</div>` : ''}
                        </div>
                    </td>
                    <td class="actions">
                        <button class="btn-edit" onclick="editClient(${client.id})">Изменить</button>
                        <button class="btn-delete" onclick="deleteClient(${client.id})">Удалить</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Получение текста дедлайна
    function getDeadlineText(client) {
        if (!client.deadline_days) return '';
        
        const daysPassed = client.days_passed || 0;
        const daysLeft = client.deadline_days - daysPassed;
        
        if (daysLeft < 0) {
            return `⚠️ Просрочен на ${Math.abs(daysLeft)} дн.`;
        } else if (daysLeft === 0) {
            return `🔥 Дедлайн сегодня!`;
        } else if (daysLeft <= 3) {
            return `⏰ Осталось ${daysLeft} дн.`;
        } else {
            return `📅 Осталось ${daysLeft} дн.`;
        }
    }
    
    // Получение класса для дней
    function getDaysPassedClass(client) {
        const daysPassed = client.days_passed || 0;
        
        if (daysPassed <= 1) return 'days-new';
        if (daysPassed <= 7) return 'days-week';
        if (daysPassed <= 30) return 'days-month';
        return 'days-old';
    }
    
    // Форматирование цены в долларах
    function formatPrice(price) {
        if (!price) return '—';
        return '$' + new Intl.NumberFormat('en-US').format(price);
    }
    
    // Показ пустого состояния
    function showEmptyState() {
        clientsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6e6e73;">
                    Пока нет клиентов. Добавьте первого!
                </td>
            </tr>
        `;
    }
    
    // Вспомогательные функции
    function getStatusClass(status) {
        const statusMap = {
            'Новый': 'new',
            'Обсуждение ТЗ': 'discussion',
            'Ожидание оплаты': 'payment',
            'В работе': 'progress',
            'На проверке': 'review',
            'Доработки': 'revision',
            'Тестирование': 'testing',
            'Готов к сдаче': 'ready',
            'Завершен': 'completed',
            'Приостановлен': 'paused',
            'Отменен': 'cancelled'
        };
        return statusMap[status] || 'new';
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    // Функция редактирования клиента
    window.editClient = function(id) {
        window.location.href = `/edit-client?id=${id}`;
    };
    
    // Функция удаления клиента
    window.deleteClient = async function(id) {
        // Получаем информацию о клиенте для подтверждения
        const clientRow = document.querySelector(`button[onclick="deleteClient(${id})"]`).closest('tr');
        const clientName = clientRow.querySelector('.project-name').textContent;
        const clientId = clientRow.querySelector('.client-id').textContent;
        
        if (confirm(`Удалить клиента "${clientId} - ${clientName}"?\n\nЭто действие нельзя отменить.`)) {
            try {
                const response = await fetch(`/api/clients/${id}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Клиент успешно удален', 'success');
                    
                    // Удаляем строку из таблицы с анимацией
                    clientRow.style.transition = 'opacity 0.3s ease';
                    clientRow.style.opacity = '0';
                    
                    setTimeout(() => {
                        clientRow.remove();
                        
                        // Проверяем если клиентов не осталось
                        const remainingRows = document.querySelectorAll('#clientsBody tr');
                        if (remainingRows.length === 0) {
                            showEmptyState();
                        }
                    }, 300);
                    
                } else {
                    throw new Error(result.error || 'Ошибка удаления');
                }
                
            } catch (error) {
                console.error('Ошибка удаления клиента:', error);
                showNotification('Ошибка: ' + error.message, 'error');
            }
        }
    };
});

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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}