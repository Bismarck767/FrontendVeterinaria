// Componente Header para VeterinaryProject
class Header {
    constructor() {
        this.element = document.getElementById('header');
        this.currentUser = null;
        this.notifications = [];
        this.init();
    }

    // Inicializar header
    init() {
        if (!this.element) {
            console.warn('Elemento header no encontrado');
            return;
        }
        
        this.setupEventListeners();
        this.updateUserInfo();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Navigation links
        const navLinks = this.element.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Logout button
        const logoutBtn = this.element.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Mobile menu toggle
        const mobileToggle = this.element.querySelector('.mobile-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Notifications dropdown
        const notificationBtn = this.element.querySelector('#notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }

        // User dropdown
        const userDropdown = this.element.querySelector('#userDropdown');
        if (userDropdown) {
            userDropdown.addEventListener('click', () => this.toggleUserMenu());
        }

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            this.closeDropdowns(e);
        });
    }

    // Manejar navegación
    handleNavigation(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            const section = href.substring(1);
            
            // Verificar permisos
            if (!this.hasPermissionForSection(section)) {
                Helpers.showToast('No tienes permisos para acceder a esta sección', 'error');
                return;
            }

            // Actualizar navegación activa
            this.setActiveNavItem(e.target);
            
            // Cambiar sección
            if (window.app) {
                window.app.showSection(section);
            }
        }
    }

    // Verificar permisos para sección
    hasPermissionForSection(section) {
        if (!window.authSystem || !window.authSystem.isAuthenticated()) {
            return false;
        }

        const permissions = {
            'dashboard': 'inventory.read',
            'inventory': 'inventory.read',
            'alerts': 'inventory.read',
            'reports': 'reports.basic'
        };

        const requiredPermission = permissions[section];
        return !requiredPermission || window.authSystem.hasPermission(requiredPermission);
    }

    // Establecer item de navegación activo
    setActiveNavItem(activeLink) {
        // Remover clase activa de todos los links
        const navLinks = this.element.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Agregar clase activa al link seleccionado
        activeLink.classList.add('active');
    }

    // Manejar logout
    handleLogout() {
        if (window.authSystem) {
            window.authSystem.logout();
        }
    }

    // Actualizar información del usuario
    updateUserInfo() {
        this.currentUser = window.authSystem?.getCurrentUser();
        
        if (this.currentUser) {
            this.showAuthenticatedState();
        } else {
            this.showUnauthenticatedState();
        }
    }

    // Mostrar estado autenticado
    showAuthenticatedState() {
        const userInfo = this.element.querySelector('#userInfo');
        const userName = this.element.querySelector('#userName');
        
        if (userInfo) {
            userInfo.style.display = 'flex';
        }
        
        if (userName) {
            const roleText = this.currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
            userName.textContent = `${this.currentUser.username} (${roleText})`;
        }

        // Mostrar/ocultar elementos según permisos
        this.updatePermissionBasedElements();
        
        // Actualizar notificaciones
        this.updateNotifications();
    }

    // Mostrar estado no autenticado
    showUnauthenticatedState() {
        const userInfo = this.element.querySelector('#userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }

    // Actualizar elementos basados en permisos
    updatePermissionBasedElements() {
        const isAdmin = window.authSystem?.isAdmin();
        
        // Ocultar/mostrar links de navegación según permisos
        const restrictedNavItems = {
            'reports': 'reports.basic',
            'settings': 'settings.manage'
        };

        Object.keys(restrictedNavItems).forEach(section => {
            const link = this.element.querySelector(`[href="#${section}"]`);
            if (link) {
                const hasPermission = window.authSystem?.hasPermission(restrictedNavItems[section]);
                link.style.display = hasPermission ? 'block' : 'none';
            }
        });

        // Badge de admin
        const adminBadge = this.element.querySelector('.admin-badge');
        if (adminBadge) {
            adminBadge.style.display = isAdmin ? 'inline' : 'none';
        }
    }

    // Actualizar notificaciones
    updateNotifications() {
        if (window.alertSystem) {
            this.notifications = window.alertSystem.notifications || [];
            this.updateNotificationBadge();
        }
    }

    // Actualizar badge de notificaciones
    updateNotificationBadge() {
        const notificationBtn = this.element.querySelector('#notificationBtn');
        const badge = this.element.querySelector('.notification-badge');
        
        if (!notificationBtn) return;

        const criticalAlerts = this.notifications.filter(n => n.priority === 'high');
        
        if (criticalAlerts.length > 0) {
            if (!badge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = criticalAlerts.length;
                notificationBtn.appendChild(newBadge);
            } else {
                badge.textContent = criticalAlerts.length;
            }
        } else if (badge) {
            badge.remove();
        }
    }

    // Toggle menú móvil
    toggleMobileMenu() {
        const nav = this.element.querySelector('.nav');
        if (nav) {
            nav.classList.toggle('mobile-open');
        }
    }

    // Toggle notificaciones
    toggleNotifications() {
        let dropdown = this.element.querySelector('.notifications-dropdown');
        
        if (!dropdown) {
            dropdown = this.createNotificationsDropdown();
            this.element.querySelector('#notificationBtn').appendChild(dropdown);
        }
        
        dropdown.classList.toggle('active');
    }

    // Crear dropdown de notificaciones
    createNotificationsDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'notifications-dropdown dropdown-content';
        
        if (this.notifications.length === 0) {
            dropdown.innerHTML = `
                <div class="dropdown-item">
                    <div class="notification-empty">
                        ✅ No hay alertas activas
                    </div>
                </div>
            `;
        } else {
            const recentNotifications = this.notifications.slice(0, 5);
            dropdown.innerHTML = recentNotifications.map(notification => `
                <div class="dropdown-item notification-item" data-notification-id="${notification.id}">
                    <div class="notification-content">
                        <div class="notification-title">
                            ${this.getNotificationIcon(notification.type)} ${notification.title}
                        </div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${Helpers.formatDate(notification.timestamp)}</div>
                    </div>
                </div>
            `).join('');
            
            // Agregar link para ver todas
            dropdown.innerHTML += `
                <div class="dropdown-separator"></div>
                <div class="dropdown-item notification-all">
                    <a href="#alerts">Ver todas las alertas</a>
                </div>
            `;
        }
        
        return dropdown;
    }

    // Obtener icono de notificación
    getNotificationIcon(type) {
        const icons = {
            'expired': '❌',
            'expiring': '⚠️',
            'lowstock': '📦',
            'outofstock': '🚫'
        };
        return icons[type] || '🔔';
    }

    // Toggle menú de usuario
    toggleUserMenu() {
        let dropdown = this.element.querySelector('.user-dropdown');
        
        if (!dropdown) {
            dropdown = this.createUserDropdown();
            this.element.querySelector('#userDropdown').appendChild(dropdown);
        }
        
        dropdown.classList.toggle('active');
    }

    // Crear dropdown de usuario
    createUserDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown dropdown-content';
        
        const isAdmin = window.authSystem?.isAdmin();
        
        dropdown.innerHTML = `
            <div class="dropdown-item user-info-item">
                <div class="user-details">
                    <strong>${this.currentUser.username}</strong>
                    <small>${this.currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}</small>
                </div>
            </div>
            <div class="dropdown-separator"></div>
            <div class="dropdown-item" onclick="header.showProfile()">
                👤 Mi Perfil
            </div>
            ${isAdmin ? `
                <div class="dropdown-item" onclick="header.showSettings()">
                    ⚙️ Configuración
                </div>
            ` : ''}
            <div class="dropdown-item" onclick="header.showHelp()">
                ❓ Ayuda
            </div>
            <div class="dropdown-separator"></div>
            <div class="dropdown-item" onclick="header.handleLogout()">
                🚪 Cerrar Sesión
            </div>
        `;
        
        return dropdown;
    }

    // Cerrar dropdowns
    closeDropdowns(e) {
        const isNotificationClick = e.target.closest('#notificationBtn');
        const isUserClick = e.target.closest('#userDropdown');
        
        if (!isNotificationClick) {
            const notificationDropdown = this.element.querySelector('.notifications-dropdown');
            if (notificationDropdown) {
                notificationDropdown.classList.remove('active');
            }
        }
        
        if (!isUserClick) {
            const userDropdown = this.element.querySelector('.user-dropdown');
            if (userDropdown) {
                userDropdown.classList.remove('active');
            }
        }
    }

    // Mostrar perfil
    showProfile() {
        const content = `
            <div class="profile-content">
                <h4>Información del Usuario</h4>
                <div class="profile-field">
                    <label>Usuario:</label>
                    <span>${this.currentUser.username}</span>
                </div>
                <div class="profile-field">
                    <label>Rol:</label>
                    <span>${this.currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                </div>
                <div class="profile-field">
                    <label>Último acceso:</label>
                    <span>${Helpers.formatDate(this.currentUser.loginTime)}</span>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="header.changePassword()">
                        Cambiar Contraseña
                    </button>
                </div>
            </div>
        `;

        const modal = window.modalManager?.create('profileModal', content, {
            title: 'Mi Perfil',
            showFooter: false
        });

        modal?.open();
    }

    // Cambiar contraseña
    changePassword() {
        const content = `
            <form id="changePasswordForm">
                <div class="form-group">
                    <label for="currentPassword">Contraseña Actual:</label>
                    <input type="password" id="currentPassword" name="currentPassword" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">Nueva Contraseña:</label>
                    <input type="password" id="newPassword" name="newPassword" required>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Contraseña:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
            </form>
        `;

        const modal = window.modalManager?.create('changePasswordModal', content, {
            title: 'Cambiar Contraseña',
            confirmText: 'Cambiar',
            onConfirm: (modal) => {
                const formData = modal.getFormData();
                this.processPasswordChange(Object.fromEntries(formData));
                modal.close();
            }
        });

        modal?.open();
    }

    // Procesar cambio de contraseña
    async processPasswordChange(data) {
        if (data.newPassword !== data.confirmPassword) {
            Helpers.showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        if (window.authSystem) {
            const result = await window.authSystem.changePassword(data.currentPassword, data.newPassword);
            if (result.success) {
                Helpers.showToast('Contraseña cambiada exitosamente', 'success');
            } else {
                Helpers.showToast(result.message, 'error');
            }
        }
    }

    // Mostrar configuración
    showSettings() {
        if (!window.authSystem?.isAdmin()) {
            Helpers.showToast('No tienes permisos para acceder a la configuración', 'error');
            return;
        }

        const settings = StorageManager.getSettings();
        
        const content = `
            <form id="settingsForm">
                <div class="form-group">
                    <label for="alertDays">Días de alerta antes del vencimiento:</label>
                    <input type="number" id="alertDays" name="alertDays" value="${settings.alertDays}" min="1" max="90">
                </div>
                <div class="form-group">
                    <label for="itemsPerPage">Elementos por página:</label>
                    <select id="itemsPerPage" name="itemsPerPage">
                        <option value="5" ${settings.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${settings.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${settings.itemsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${settings.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="notifications" ${settings.notifications ? 'checked' : ''}>
                        Activar notificaciones
                    </label>
                </div>
            </form>
        `;

        const modal = window.modalManager?.create('settingsModal', content, {
            title: 'Configuración del Sistema',
            confirmText: 'Guardar',
            onConfirm: (modal) => {
                const formData = modal.getFormData();
                this.saveSettings(Object.fromEntries(formData));
                modal.close();
            }
        });

        modal?.open();
    }

    // Guardar configuración
    saveSettings(data) {
        const settings = {
            alertDays: parseInt(data.alertDays),
            itemsPerPage: parseInt(data.itemsPerPage),
            notifications: data.notifications === 'on'
        };

        StorageManager.saveSettings(settings);
        
        // Actualizar sistema de alertas
        if (window.alertSystem) {
            window.alertSystem.setAlertThresholds({ expiryDays: settings.alertDays });
        }

        Helpers.showToast('Configuración guardada correctamente', 'success');
    }

    // Mostrar ayuda
    showHelp() {
        const content = `
            <div class="help-content">
                <h4>Ayuda del Sistema</h4>
                
                <div class="help-section">
                    <h5>🏥 Gestión de Inventario</h5>
                    <ul>
                        <li>Usa el botón "Agregar Medicamento" para registrar nuevos productos</li>
                        <li>Haz clic en el icono de ojo (👁️) para ver detalles</li>
                        <li>Usa los filtros para encontrar medicamentos específicos</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h5>🚨 Sistema de Alertas</h5>
                    <ul>
                        <li>Las alertas se actualizan automáticamente</li>
                        <li>Los medicamentos próximos a vencer aparecen en amarillo</li>
                        <li>Los medicamentos vencidos aparecen en rojo</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h5>📊 Reportes</h5>
                    <ul>
                        <li>Genera reportes por período usando las fechas</li>
                        <li>Exporta los datos en formato CSV</li>
                        <li>Imprime los reportes directamente</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h5>⌨️ Atajos de Teclado</h5>
                    <ul>
                        <li><strong>Ctrl + N:</strong> Nuevo medicamento</li>
                        <li><strong>Ctrl + F:</strong> Buscar</li>
                        <li><strong>Esc:</strong> Cerrar modal</li>
                    </ul>
                </div>
            </div>
        `;

        const modal = window.modalManager?.create('helpModal', content, {
            title: 'Centro de Ayuda',
            showFooter: false
        });

        modal?.open();
    }

    // Refrescar header
    refresh() {
        this.updateUserInfo();
        this.updateNotifications();
    }

    // Obtener estadísticas del header
    getStats() {
        return {
            user: this.currentUser,
            notifications: this.notifications.length,
            criticalAlerts: this.notifications.filter(n => n.priority === 'high').length
        };
    }
}

// CSS adicional para header
const headerStyles = `
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
}

.logo h1 {
    color: var(--primary-color);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.nav {
    display: flex;
}

.nav-list {
    display: flex;
    list-style: none;
    gap: 1rem;
    margin: 0;
    padding: 0;
}

.nav-link {
    text-decoration: none;
    color: var(--text-color);
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    transition: all 0.2s;
    position: relative;
}

.nav-link:hover {
    background-color: var(--light-color);
}

.nav-link.active {
    background-color: var(--primary-color);
    color: white;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.notification-btn,
.user-dropdown-btn {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.notification-btn:hover,
.user-dropdown-btn:hover {
    background-color: var(--light-color);
}

.notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: var(--danger-color);
    color: white;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.admin-badge {
    background: var(--warning-color);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}

.dropdown-content {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    min-width: 250px;
    max-width: 350px;
    display: none;
    z-index: 1000;
    margin-top: 0.5rem;
}

.dropdown-content.active {
    display: block;
    animation: dropdownSlideIn 0.2s ease-out;
}

.dropdown-item {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background-color: var(--light-color);
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-separator {
    height: 1px;
    background: var(--border-color);
    margin: 0.5rem 0;
}

.notification-item {
    cursor: pointer;
}

.notification-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.notification-title {
    font-weight: 600;
    font-size: 0.875rem;
}

.notification-message {
    font-size: 0.75rem;
    color: var(--text-light);
}

.notification-time {
    font-size: 0.625rem;
    color: var(--text-light);
}

.notification-empty {
    text-align: center;
    color: var(--text-light);
    font-style: italic;
}

.notification-all {
    text-align: center;
}

.notification-all a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.user-info-item {
    background-color: var(--light-color);
}

.user-details strong {
    display: block;
    color: var(--dark-color);
}

.user-details small {
    color: var(--text-light);
    font-size: 0.75rem;
}

.mobile-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
}

.profile-content {
    padding: 1rem 0;
}

.profile-field {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color);
}

.profile-field label {
    font-weight: 600;
    color: var(--text-light);
}

.profile-actions {
    margin-top: 1rem;
    text-align: center;
}

.help-content {
    max-height: 60vh;
    overflow-y: auto;
}

.help-section {
    margin-bottom: 1.5rem;
}

.help-section h5 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.help-section ul {
    margin: 0;
    padding-left: 1.5rem;
}

.help-section li {
    margin-bottom: 0.25rem;
    color: var(--text-color);
}

@media (max-width: 768px) {
    .mobile-toggle {
        display: block;
    }
    
    .nav {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: var(--shadow);
        border-top: 1px solid var(--border-color);
    }
    
    .nav.mobile-open {
        display: block;
    }
    
    .nav-list {
        flex-direction: column;
        gap: 0;
    }
    
    .nav-link {
        display: block;
        padding: 1rem;
        border-radius: 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .header-content {
        flex-wrap: wrap;
        position: relative;
    }
    
    .dropdown-content {
        right: auto;
        left: 0;
        min-width: 200px;
    }
}
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = headerStyles;
    document.head.appendChild(style);
}

// Inicializar header cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.header = new Header();
});

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.Header = Header;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Header;
}