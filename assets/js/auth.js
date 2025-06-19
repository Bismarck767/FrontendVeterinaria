// Sistema de Autenticación para VeterinaryProject
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
        this.users = this.loadUsers();
        this.init();
    }

    // Inicializar sistema de autenticación
    init() {
        this.checkSession();
        this.setupSessionTimeout();
    }

    // Cargar usuarios predefinidos
    loadUsers() {
        // En un sistema real, esto vendría de una base de datos
        return {
            'admin': {
                username: 'admin',
                password: 'admin', // En producción, usar hash
                role: 'admin',
                fullName: 'Administrador',
                email: 'admin@veterinaria.com',
                permissions: [
                    'inventory.create',
                    'inventory.read',
                    'inventory.update',
                    'inventory.delete',
                    'reports.all',
                    'users.manage',
                    'settings.manage'
                ],
                lastLogin: null,
                loginCount: 0
            },
            'empleado': {
                username: 'empleado',
                password: 'emp123',
                role: 'employee',
                fullName: 'Empleado Veterinario',
                email: 'empleado@veterinaria.com',
                permissions: [
                    'inventory.read',
                    'inventory.update',
                    'reports.basic'
                ],
                lastLogin: null,
                loginCount: 0
            }
        };
    }

    // Verificar sesión activa
    checkSession() {
        const savedUser = StorageManager.getUser();
        if (savedUser && this.isSessionValid(savedUser)) {
            this.currentUser = savedUser;
            this.extendSession();
            return true;
        } else {
            this.logout();
            return false;
        }
    }

    // Verificar si la sesión es válida
    isSessionValid(user) {
        if (!user.loginTime) return false;
        
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const timeDiff = now - loginTime;
        
        return timeDiff < this.sessionTimeout;
    }

    // Extender sesión
    extendSession() {
        if (this.currentUser) {
            this.currentUser.lastActivity = new Date().toISOString();
            StorageManager.saveUser(this.currentUser);
        }
    }

    // Configurar timeout de sesión
    setupSessionTimeout() {
        // Verificar cada minuto si la sesión sigue activa
        setInterval(() => {
            if (this.currentUser && !this.isSessionValid(this.currentUser)) {
                this.handleSessionExpiry();
            }
        }, 60 * 1000);

        // Extender sesión con actividad del usuario
        document.addEventListener('click', () => this.extendSession());
        document.addEventListener('keypress', () => this.extendSession());
    }

    // Manejar expiración de sesión
    handleSessionExpiry() {
        Helpers.showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
        this.logout();
    }

    // Iniciar sesión
    async login(username, password, role) {
        try {
            // Validar credenciales
            const user = this.validateCredentials(username, password, role);
            if (!user) {
                return {
                    success: false,
                    message: 'Credenciales incorrectas'
                };
            }

            // Crear sesión
            const sessionUser = {
                ...user,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };

            // Actualizar estadísticas de login
            this.users[username].lastLogin = sessionUser.loginTime;
            this.users[username].loginCount++;

            // Guardar sesión
            this.currentUser = sessionUser;
            StorageManager.saveUser(sessionUser);

            // Registrar evento de login
            this.logSecurityEvent('login_success', {
                username,
                role,
                timestamp: sessionUser.loginTime
            });

            return {
                success: true,
                user: sessionUser,
                message: 'Inicio de sesión exitoso'
            };

        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: 'Error interno del sistema'
            };
        }
    }

    // Validar credenciales
    validateCredentials(username, password, role) {
        const user = this.users[username];
        
        if (!user) {
            this.logSecurityEvent('login_failed', {
                username,
                reason: 'user_not_found',
                timestamp: new Date().toISOString()
            });
            return null;
        }

        if (user.password !== password) {
            this.logSecurityEvent('login_failed', {
                username,
                reason: 'invalid_password',
                timestamp: new Date().toISOString()
            });
            return null;
        }

        if (user.role !== role) {
            this.logSecurityEvent('login_failed', {
                username,
                reason: 'invalid_role',
                timestamp: new Date().toISOString()
            });
            return null;
        }

        return user;
    }

    // Generar ID de sesión
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Cerrar sesión
    // En la clase AuthSystem - REEMPLAZAR el método logout:
logout() {
    try {
        // Registrar evento de logout si hay usuario
        if (this.currentUser) {
            this.logSecurityEvent('logout', {
                username: this.currentUser.username,
                sessionDuration: this.getSessionDuration(),
                timestamp: new Date().toISOString()
            });
        }

        // Limpiar datos
        this.currentUser = null;
        StorageManager.clearUser();
        
        // Limpiar localStorage adicional por si acaso
        localStorage.removeItem('veterinary_user');
        
        // Mostrar mensaje
        if (window.Helpers && window.Helpers.showToast) {
            window.Helpers.showToast('Sesión cerrada correctamente', 'success');
        }

        // Redirigir según el tipo de aplicación
        if (window.location.pathname.includes('pages/')) {
            // Si estamos en una página específica, ir a login.html
            window.location.href = 'login.html';
        } else {
            // Si es SPA, mostrar sección login
            if (window.app && window.app.showSection) {
                window.app.currentUser = null;
                window.app.updateUI();
                window.app.showSection('login');
            } else {
                // Fallback: recargar página
                window.location.reload();
            }
        }

        console.log('✅ Logout exitoso');
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        // Forzar limpieza y redirección en caso de error
        localStorage.clear();
        window.location.href = window.location.pathname.includes('pages/') ? 'login.html' : '/';
    }
}

    // Obtener duración de la sesión
    getSessionDuration() {
        if (!this.currentUser || !this.currentUser.loginTime) return 0;
        
        const loginTime = new Date(this.currentUser.loginTime);
        const now = new Date();
        return Math.round((now - loginTime) / 1000); // Segundos
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return this.currentUser !== null && this.isSessionValid(this.currentUser);
    }

    // Verificar permisos
    hasPermission(permission) {
        if (!this.isAuthenticated()) return false;
        
        const userPermissions = this.currentUser.permissions || [];
        return userPermissions.includes(permission) || this.currentUser.role === 'admin';
    }

    // Verificar rol
    hasRole(role) {
        if (!this.isAuthenticated()) return false;
        return this.currentUser.role === role;
    }

    // Verificar si es administrador
    isAdmin() {
        return this.hasRole('admin');
    }

    // Verificar si es empleado
    isEmployee() {
        return this.hasRole('employee');
    }

    // Obtener información del usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Cambiar contraseña
    async changePassword(oldPassword, newPassword) {
        if (!this.isAuthenticated()) {
            return {
                success: false,
                message: 'No hay sesión activa'
            };
        }

        const username = this.currentUser.username;
        const user = this.users[username];

        if (user.password !== oldPassword) {
            return {
                success: false,
                message: 'Contraseña actual incorrecta'
            };
        }

        // Validar nueva contraseña
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                message: passwordValidation.message
            };
        }

        // Cambiar contraseña
        this.users[username].password = newPassword;
        
        this.logSecurityEvent('password_changed', {
            username,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Contraseña cambiada exitosamente'
        };
    }

    // Validar contraseña
    validatePassword(password) {
        if (!password || password.length < 6) {
            return {
                isValid: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            };
        }

        if (!/[A-Z]/.test(password)) {
            return {
                isValid: false,
                message: 'La contraseña debe contener al menos una mayúscula'
            };
        }

        if (!/[a-z]/.test(password)) {
            return {
                isValid: false,
                message: 'La contraseña debe contener al menos una minúscula'
            };
        }

        if (!/\d/.test(password)) {
            return {
                isValid: false,
                message: 'La contraseña debe contener al menos un número'
            };
        }

        return {
            isValid: true,
            message: 'Contraseña válida'
        };
    }

    // Registrar evento de seguridad
    logSecurityEvent(eventType, details) {
        const events = StorageManager.getData('securityEvents', []);
        
        const event = {
            id: Helpers.generateId(),
            type: eventType,
            details,
            timestamp: new Date().toISOString(),
            ip: 'localhost', // En un sistema real, obtener IP real
            userAgent: navigator.userAgent
        };

        events.push(event);
        
        // Mantener solo los últimos 100 eventos
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }

        StorageManager.saveData('securityEvents', events);
    }

    // Obtener eventos de seguridad
    getSecurityEvents(limit = 50) {
        const events = StorageManager.getData('securityEvents', []);
        return events.slice(-limit).reverse(); // Más recientes primero
    }

    // Obtener estadísticas de login
    getLoginStats() {
        const events = this.getSecurityEvents();
        const loginEvents = events.filter(e => e.type === 'login_success');
        
        return {
            totalLogins: loginEvents.length,
            lastLogin: loginEvents[0]?.timestamp || null,
            failedAttempts: events.filter(e => e.type === 'login_failed').length,
            users: Object.keys(this.users).map(username => ({
                username,
                lastLogin: this.users[username].lastLogin,
                loginCount: this.users[username].loginCount
            }))
        };
    }

    // Proteger ruta/función
    requireAuth(callback) {
        if (!this.isAuthenticated()) {
            Helpers.showToast('Debes iniciar sesión para acceder a esta función', 'warning');
            if (window.app) {
                window.app.showSection('login');
            }
            return false;
        }
        
        if (callback) {
            callback();
        }
        return true;
    }

    // Proteger con permiso específico
    requirePermission(permission, callback) {
        if (!this.hasPermission(permission)) {
            Helpers.showToast('No tienes permisos para realizar esta acción', 'error');
            return false;
        }
        
        if (callback) {
            callback();
        }
        return true;
    }

    // Crear nuevo usuario (solo admin)
    createUser(userData) {
        if (!this.hasPermission('users.manage')) {
            return {
                success: false,
                message: 'No tienes permisos para crear usuarios'
            };
        }

        const { username, password, role, fullName, email } = userData;

        if (this.users[username]) {
            return {
                success: false,
                message: 'El usuario ya existe'
            };
        }

        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                message: passwordValidation.message
            };
        }

        this.users[username] = {
            username,
            password,
            role,
            fullName,
            email,
            permissions: this.getDefaultPermissions(role),
            lastLogin: null,
            loginCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.username
        };

        this.logSecurityEvent('user_created', {
            username,
            role,
            createdBy: this.currentUser.username,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Usuario creado exitosamente'
        };
    }

    // Obtener permisos por defecto según el rol
    getDefaultPermissions(role) {
        const permissions = {
            'admin': [
                'inventory.create',
                'inventory.read',
                'inventory.update',
                'inventory.delete',
                'reports.all',
                'users.manage',
                'settings.manage'
            ],
            'employee': [
                'inventory.read',
                'inventory.update',
                'reports.basic'
            ]
        };

        return permissions[role] || [];
    }
}

// Inicializar sistema de autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authSystem) {
        window.authSystem = new AuthSystem();
    }
});

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.AuthSystem = AuthSystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}