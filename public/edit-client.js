document.addEventListener('DOMContentLoaded', function() {
    const editClientForm = document.getElementById('editClientForm');
    let currentClientId = null;
    
    // Проверяем авторизацию
    checkAuth();
    
    // Получаем ID клиента из URL
    const urlParams = new URLSearchParams(window.location.search);
    currentClientId = urlParams.get('id');
    
    if (!currentClientId) {
        showNotification('ID клиента не указан', 'error');
        window.location.href = '/crm';
        return;
    }
    
    // Загружаем данные клиента
    loadClientData();
    
    // Обработка отправки формы
    editClientForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        saveClientData();
    });
    
    // Загрузка данных клиента
    async function loadClientData() {
        try {
            const response = await fetch(`/api/clients/${currentClientId}`);
            
            if (!response.ok) {
                throw new Error('Клиент не найден');
            }
            
            const client = await response.json();
            fillForm(client);
            
        } catch (error) {
            console.error('Ошибка загрузки клиента:', error);
            showNotification('Ошибка: ' + error.message, 'error');
            setTimeout(() => {
                window.location.href = '/crm';
            }, 2000);
        }
    }
    
    // Заполнение формы данными
    function fillForm(client) {
        document.getElementById('clientId').value = client.client_id || '';
        document.getElementById('projectName').value = client.project_name || '';
        document.getElementById('clientContact').value = client.client_contact || '';
        document.getElementById('technicalTask').value = client.technical_task || '';
        document.getElementById('status').value = client.status || 'Новый';
        document.getElementById('price').value = client.price || '';
        document.getElementById('deadline').value = client.deadline_days || '';
        document.getElementById('notes').value = client.notes || '';
        document.getElementById('dateCreated').value = formatDate(client.date_created);
        document.getElementById('daysPassed').value = (client.days_passed || 0) + ' дней';
    }
    
    // Сохранение данных клиента
    async function saveClientData() {
        const formData = {
            project_name: document.getElementById('projectName').value.trim(),
            client_contact: document.getElementById('clientContact').value.trim(),
            technical_task: document.getElementById('technicalTask').value.trim(),
            status: document.getElementById('status').value,
            price: document.getElementById('price').value || null,
            deadline_days: document.getElementById('deadline').value || null,
            notes: document.getElementById('notes').value.trim()
        };
        
        // Валидация
        if (!formData.project_name) {
            showNotification('Укажите название проекта', 'error');
            document.getElementById('projectName').focus();
            return;
        }
        
        if (!formData.client_contact) {
            showNotification('Укажите контакт клиента', 'error');
            document.getElementById('clientContact').focus();
            return;
        }
        
        // Блокируем кнопку
        const submitBtn = editClientForm.querySelector('.btn-save');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
        
        try {
            const response = await fetch(`/api/clients/${currentClientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('Данные клиента успешно обновлены!', 'success');
                
                setTimeout(() => {
                    window.location.href = '/crm';
                }, 1500);
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            showNotification('Ошибка: ' + error.message, 'error');
            
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    // Форматирование даты
    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});