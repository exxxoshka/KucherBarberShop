// database.js

// Загрузить все записи
// Загрузить ВСЕ записи (админ видит всё)
function loadAppointments() {
    const user = auth.currentUser;
    if (!user) return;
    
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    
    const table = document.getElementById('appointmentsTable');
    
    // Показываем загрузку
    table.innerHTML = `
        <tr id="loadingRow">
            <td colspan="8" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
            </td>
        </tr>
    `;
    
    // Загружаем ВСЕ записи (и клиентские, и админские)
    let query = appointmentsRef.orderBy('created_at', 'desc');
    
    // Фильтр по дате
    if (dateFilter) {
        query = query.where('appointment_date', '==', dateFilter);
    }
    
    query.get()
        .then(snapshot => {
            table.innerHTML = '';
            
            if (snapshot.empty) {
                table.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted">
                            Нет записей. <a href="add.html">Добавьте первую запись</a>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let hasClientRecords = false;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const id = doc.id;
                
                // Фильтрация по поиску
                if (search && !data.clientName.toLowerCase().includes(search)) {
                    return;
                }
                
                // Определяем тип записи
                const isClientRecord = data.type === 'client';
                if (isClientRecord) hasClientRecords = true;
                
                // Определяем цвет статуса
                let statusBadge = '';
                if (data.status === 'pending') {
                    statusBadge = '<span class="badge bg-warning">ожидание</span>';
                } else if (data.status === 'confirmed') {
                    statusBadge = '<span class="badge bg-success">подтверждено</span>';
                } else if (data.status === 'completed') {
                    statusBadge = '<span class="badge bg-info">выполнено</span>';
                } else if (data.status === 'cancelled') {
                    statusBadge = '<span class="badge bg-danger">отменено</span>';
                } else {
                    statusBadge = '<span class="badge bg-secondary">не указан</span>';
                }
                
                // Определяем иконку типа записи
                const typeIcon = isClientRecord ? '🌐' : '👨‍💼';
                const typeTitle = isClientRecord ? 'Онлайн-запись' : 'Запись администратора';
                
                // Добавляем строку в таблицу
                table.innerHTML += `
                    <tr>
                        <td>
                            ${escapeHtml(data.clientName)}
                            <br>
                            <small class="text-muted" title="${typeTitle}">
                                ${typeIcon} ${isClientRecord ? 'Клиент' : 'Админ'}
                            </small>
                        </td>
                        <td>${formatPhone(data.phone)}</td>
                        <td>${data.appointment_date || data.date || 'Не указано'}</td>
                        <td>${data.appointment_time || data.time || 'Не указано'}</td>
                        <td>${escapeHtml(data.service)}</td>
                        <td>${data.price || 0} ₽</td>
                        <td>${statusBadge}</td>
                        <td>
                            ${isClientRecord ? `
                                <button onclick="changeStatus('${id}', 'confirmed')" 
                                        class="btn btn-sm btn-success" title="Подтвердить">
                                    ✅
                                </button>
                                <button onclick="changeStatus('${id}', 'completed')" 
                                        class="btn btn-sm btn-info" title="Выполнено">
                                    ✓
                                </button>
                            ` : `
                                <a href="edit.html?id=${id}" class="btn btn-sm btn-warning" title="Редактировать">
                                    ✏️
                                </a>
                            `}
                            <button onclick="deleteAppointment('${id}')" 
                                    class="btn btn-sm btn-danger" title="Удалить">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            // Если есть клиентские записи, показываем уведомление
            if (hasClientRecords) {
                showNewClientRecordsNotification();
            }
        })
        .catch(error => {
            table.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">
                        Ошибка загрузки: ${error.message}
                    </td>
                </tr>
            `;
        });
}

// Изменить статус записи
function changeStatus(id, newStatus) {
    const statusText = {
        'confirmed': 'подтверждена',
        'completed': 'отмечена как выполненная',
        'cancelled': 'отменена'
    }[newStatus] || 'изменена';
    
    if (confirm(`Изменить статус записи на "${statusText}"?`)) {
        appointmentsRef.doc(id).update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .then(() => {
            showAlert(`✅ Статус записи ${statusText}`, 'success');
            loadAppointments();
        })
        .catch(error => {
            showAlert('❌ Ошибка: ' + error.message, 'danger');
        });
    }
}

// Показать уведомление о новых клиентских записях
function showNewClientRecordsNotification() {
    // Проверяем, есть ли непросмотренные клиентские записи
    const lastCheck = localStorage.getItem('lastClientCheck') || new Date().toISOString();
    
    appointmentsRef
        .where('type', '==', 'client')
        .where('status', '==', 'pending')
        .where('created_at', '>', lastCheck)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const notification = document.createElement('div');
                notification.className = 'alert alert-info alert-dismissible fade show';
                notification.innerHTML = `
                    🌐 <strong>Новые онлайн-записи!</strong> 
                    У вас ${snapshot.size} новых записей от клиентов.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                document.querySelector('.container').prepend(notification);
                
                // Обновляем время последней проверки
                localStorage.setItem('lastClientCheck', new Date().toISOString());
            }
        });
}

// Удалить запись
function deleteAppointment(id) {
    if (confirm('Удалить эту запись?')) {
        db.collection('appointments').doc(id).delete()
            .then(() => {
                showAlert('Запись удалена', 'success');
                loadAppointments();
            })
            .catch(error => {
                showAlert('Ошибка удаления: ' + error.message, 'danger');
            });
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatPhone(phone) {
    if (!phone) return 'Не указано';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `+${cleaned[0]} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
    }
    return phone;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}
// Удалить запись
function deleteAppointment(id) {
    if (confirm('Удалить эту запись?')) {
        db.collection('appointments').doc(id).delete()
            .then(() => {
                showAlert('✅ Запись удалена!', 'success');
                loadAppointments();
            })
            .catch(error => {
                showAlert('❌ Ошибка удаления: ' + error.message, 'danger');
            });
    }
}
// Загрузить онлайн-записи клиентов
function loadClientBookings() {
    const table = document.getElementById('clientBookingsTable');
    table.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    
    db.collection('client_bookings')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            let html = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Телефон</th>
                                <th>Дата</th>
                                <th>Время</th>
                                <th>Услуга</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            if (snapshot.empty) {
                html += `
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            Нет онлайн-записей
                        </td>
                    </tr>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const id = doc.id;
                    
                    // Определяем цвет статуса
                    let statusColor = 'secondary';
                    if (data.status === 'confirmed') statusColor = 'success';
                    if (data.status === 'pending') statusColor = 'warning';
                    if (data.status === 'cancelled') statusColor = 'danger';
                    
                    html += `
                        <tr>
                            <td>${escapeHtml(data.clientName)}</td>
                            <td>${formatPhone(data.phone)}</td>
                            <td>${data.date}</td>
                            <td>${data.time}</td>
                            <td>${escapeHtml(data.service)}</td>
                            <td>
                                <span class="badge bg-${statusColor}">
                                    ${data.status === 'pending' ? 'ожидание' : 
                                      data.status === 'confirmed' ? 'подтверждено' : 
                                      data.status === 'cancelled' ? 'отменено' : data.status}
                                </span>
                            </td>
                            <td>
                                <button onclick="changeBookingStatus('${id}', 'confirmed')" 
                                        class="btn btn-sm btn-success">✅</button>
                                <button onclick="changeBookingStatus('${id}', 'cancelled')" 
                                        class="btn btn-sm btn-danger">❌</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `</tbody></table></div>`;
            table.innerHTML = html;
        })
        .catch(error => {
            table.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
        });
}

// Изменить статус записи клиента
function changeBookingStatus(id, status) {
    const statusText = status === 'confirmed' ? 'подтвержден' : 'отменен';
    
    if (confirm(`Изменить статус записи на "${statusText}"?`)) {
        db.collection('client_bookings').doc(id).update({
            status: status,
            updatedAt: new Date().toISOString()
        })
        .then(() => {
            showAlert(`Статус записи изменен на "${statusText}"`, 'success');
            loadClientBookings();
        })
        .catch(error => {
            showAlert('Ошибка: ' + error.message, 'danger');
        });
    }
}

// Показать записи администратора
function showAdminRecords() {
    document.getElementById('adminRecordsSection').style.display = 'block';
    document.getElementById('clientBookingsSection').style.display = 'none';
    document.querySelector('.nav-link.active').classList.remove('active');
    event.target.classList.add('active');
    loadAppointments(); // Загружаем записи администратора
}

// Показа