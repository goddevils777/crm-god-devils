document.addEventListener('DOMContentLoaded', function() {
    const clientForm = document.getElementById('clientForm');
    
    // Проверяем авторизацию
    checkAuth();
    
    // Показываем предварительный ID
    generatePreviewId();
    
    // Обработка отправки формы
    clientForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Собираем данные формы
        const formData = {
            project_name: document.getElementById('projectName').value.trim(),
            client_contact: document.getElementById('clientContact').value.trim(),
            technical_task: document.getElementById('technicalTask').value.trim(),
            status: document.getElementById('status').value,
            price: document.getElementById('price').value || null,
            deadline: document.getElementById('deadline').value || null,
            notes: document.getElementById('notes').value.trim()
        };
        
        // Валидация обязательных полей
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
        
        // Блокируем кнопку отправки
        const submitBtn = clientForm.querySelector('.btn-save');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
        
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification(`Клиент ${result.client_id} успешно добавлен!`, 'success');
                
                // Перенаправляем обратно в CRM через 2 секунды
                setTimeout(() => {
                    window.location.href = '/crm';
                }, 2000);
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
            
        } catch (error) {
            console.error('Ошибка добавления клиента:', error);
            showNotification('Ошибка: ' + error.message, 'error');
            
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Генерация предварительного ID
    async function generatePreviewId() {
        try {
            const response = await fetch('/api/clients/preview-id');
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('clientId').value = result.preview_id;
            }
        } catch (error) {
            console.error('Ошибка генерации ID:', error);
            const currentYear = new Date().getFullYear();
            document.getElementById('clientId').value = `GD-${currentYear}-xxx`;
        }
    }
    
    // Автофокус на первое поле
    document.getElementById('projectName').focus();
});