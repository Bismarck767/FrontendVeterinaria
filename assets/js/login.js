// ========== LOGIN.JS ARREGLADO PARA TU API SIN ROLES ==========

class AuthManager {
    constructor() {
        this.isSubmitting = false;
        this.currentPage = window.location.pathname.includes('register.html') ? 'register' : 'login';
        this.init();
    }

    init() {
        console.log('🔐 Inicializando AuthManager para TU API...');
        
        // Verificar si ya hay sesión activa
        this.checkExistingSession();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('✅ AuthManager inicializado');
    }

    checkExistingSession() {
        if (GlobalApiService.hasActiveSession()) {
            console.log('👤 Usuario ya logueado, redirigiendo...');
            
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.removeEventListener('submit', this.handleLogin);
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Event listener de login configurado');
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.removeEventListener('submit', this.handleRegister);
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            console.log('✅ Event listener de registro configurado');
        }

        // Demo credentials para desarrollo
        this.addDemoButtons();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isSubmitting) {
            console.log('⏳ Login ya en proceso...');
            return;
        }

        this.isSubmitting = true;
        this.hideMessage();

        try {
            const formData = new FormData(e.target);
            const credentials = {
                username: formData.get('username').trim(),
                password: formData.get('password').trim()
                // NO incluimos role porque TU API no lo usa
            };

            // Validar datos básicos
            if (!this.validateLoginData(credentials)) {
                return;
            }

            this.showLoading(true);
            this.showMessage('Conectando con TU API...', 'info');

            console.log('📡 Enviando login a TU API:', credentials.username);

            // Llamar al GlobalApiService que ya está arreglado para TU API
            const result = await GlobalApiService.login(credentials);

            if (result.success) {
                this.showMessage('¡Login exitoso con TU API! Redirigiendo...', 'success');
                console.log('✅ Login exitoso, usuario:', result.user);
                
                // Redirigir al dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage(result.message || 'Credenciales incorrectas', 'error');
                console.error('❌ Login fallido:', result.message);
            }

        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showMessage('Error al conectar con TU API: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            setTimeout(() => {
                this.isSubmitting = false;
            }, 2000);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        this.hideMessage();

        try {
            const formData = new FormData(e.target);
            const userData = {
                username: formData.get('username').trim(),
                password: formData.get('password').trim(),
                passwordConfirm: formData.get('passwordConfirm').trim()
                // NO incluimos role porque TU API no lo usa
            };

            if (!this.validateRegisterData(userData)) {
                return;
            }

            this.showLoading(true);
            this.showMessage('Creando cuenta en TU API...', 'info');

            console.log('📡 Enviando registro a TU API:', userData.username);

            // Llamar al GlobalApiService para registrar
            const result = await GlobalApiService.register(userData);

            if (result.success) {
                this.showMessage('¡Cuenta creada exitosamente en TU API! Redirigiendo al login...', 'success');
                console.log('✅ Registro exitoso');
                
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            } else {
                this.showMessage(result.message || 'Error al crear la cuenta', 'error');
                console.error('❌ Registro fallido:', result.message);
            }

        } catch (error) {
            console.error('❌ Error en registro:', error);
            this.showMessage('Error al conectar con TU API: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            setTimeout(() => {
                this.isSubmitting = false;
            }, 2000);
        }
    }

    validateLoginData(data) {
        if (!data.username) {
            this.showMessage('Por favor ingresa tu usuario', 'error');
            return false;
        }
        
        if (!data.password) {
            this.showMessage('Por favor ingresa tu contraseña', 'error');
            return false;
        }

        return true;
    }

    validateRegisterData(data) {
        if (!data.username || data.username.length < 3) {
            this.showMessage('El usuario debe tener al menos 3 caracteres', 'error');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            this.showMessage('El usuario solo puede contener letras, números y guiones bajos', 'error');
            return false;
        }
        
        if (!data.password || data.password.length < 4) {
            this.showMessage('La contraseña debe tener al menos 4 caracteres', 'error');
            return false;
        }
        
        if (data.password !== data.passwordConfirm) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return false;
        }

        return true;
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            // Auto-hide para mensajes de error
            if (type === 'error') {
                setTimeout(() => this.hideMessage(), 8000);
            }
        }
        
        // También mostrar toast
        GlobalHelpers.showToast(message, type);
    }

    hideMessage() {
        const messageEl = document.getElementById('authMessage');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }

    showLoading(show) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                if (show) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Conectando con API...';
                } else {
                    submitBtn.disabled = false;
                    if (this.currentPage === 'login') {
                        submitBtn.innerHTML = '<span class="btn-icon">🚀</span> Iniciar Sesión';
                    } else {
                        submitBtn.innerHTML = '<span class="btn-icon">✨</span> Crear Cuenta';
                    }
                }
            }
        });
    }

    addDemoButtons() {
        // Solo agregar en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const demoContainer = document.createElement('div');
            demoContainer.innerHTML = `
                <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6c757d;">🧪 Credenciales de Prueba para TU API:</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button type="button" class="demo-btn" data-user="admin" data-pass="admin123">
                            👑 Admin
                        </button>
                        <button type="button" class="demo-btn" data-user="empleado" data-pass="emp123">
                            👤 Empleado
                        </button>
                        <button type="button" class="demo-btn" data-user="test" data-pass="test">
                            🧪 Test
                        </button>
                    </div>
                    <small style="display: block; margin-top: 0.5rem; color: #6c757d;">
                        📝 Nota: Solo usuario y contraseña (sin rol) porque TU API no maneja roles
                    </small>
                </div>
            `;

            // Agregar estilos para botones demo
            const style = document.createElement('style');
            style.textContent = `
                .demo-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid #dee2e6;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    transition: all 0.2s;
                }
                .demo-btn:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }
            `;
            document.head.appendChild(style);

            const loginForm = document.getElementById('loginForm');
            if (loginForm && this.currentPage === 'login') {
                loginForm.appendChild(demoContainer);

                // Event listeners para botones demo
                demoContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('demo-btn')) {
                        const username = e.target.dataset.user;
                        const password = e.target.dataset.pass;

                        // Llenar formulario automáticamente
                        const usernameField = document.getElementById('loginUsername') || 
                                            document.querySelector('input[name="username"]');
                        const passwordField = document.getElementById('loginPassword') || 
                                            document.querySelector('input[name="password"]');

                        if (usernameField) usernameField.value = username;
                        if (passwordField) passwordField.value = password;

                        GlobalHelpers.showToast(`Credenciales cargadas: ${username}`, 'info', 2000);
                    }
                });
            }
        }
    }
}

// ========== INICIALIZACIÓN ==========
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando página de autenticación para TU API...');
    
    // Verificar que GlobalApiService esté disponible
    if (typeof GlobalApiService === 'undefined') {
        console.error('❌ GlobalApiService no está disponible. Asegúrate de cargar global-api.js primero.');
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: red;">
                <h2>Error de Configuración</h2>
                <p>No se pudo cargar el servicio API global.</p>
                <p>Por favor, verifica que global-api.js esté cargado correctamente.</p>
                <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
        return;
    }
    
    // Inicializar AuthManager
    authManager = new AuthManager();
    
    console.log('✅ Página de autenticación lista para TU API');
});

// Hacer disponible globalmente para debugging
window.authManager = authManager;