// ========== SERVICIO API GLOBAL UNIFICADO ==========
// Este archivo debe cargarse ANTES que todos los demás JS

const GlobalApiService = {
    // ========== CONFIGURACIÓN ==========
    API_BASE_URL: 'https://localhost:7273/api', // TU URL CORRECTA
    
    // ========== ESTADO GLOBAL ==========
    currentUser: null,
    authToken: null,
    isAuthenticating: false,
    
    // ========== ENDPOINTS ==========
    endpoints: {
        medicamentos: '/Medicamentos',  // EXISTE en tu API
        proveedores: '/Proveedores',    // EXISTE en tu API
        usuarios: '/Usuarios',          // EXISTE en tu API
        alertas: '/Alertas',           // Puede no existir aún
        movimientos: '/MovimientoInventario', // Puede no existir aún
        reportes: '/Reportes'          // Puede no existir aún
    },

    // ========== AUTENTICACIÓN ==========
    async login(credentials) {
        console.log('🔐 Iniciando login:', credentials.username);
        
        try {
            this.isAuthenticating = true;
            
            // Llamar a TU endpoint de login
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    NombreUsuario: credentials.username,  // Tu DTO usa NombreUsuario
                    Contraseña: credentials.password,     // Tu DTO usa Contraseña
                    Role: credentials.role                // Agregamos role para validación
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Verificar que el role coincida con lo que el usuario seleccionó
                if (result.Role !== credentials.role) {
                    return { 
                        success: false, 
                        message: `Este usuario no tiene el rol de ${credentials.role === 'admin' ? 'Administrador' : 'Empleado'}` 
                    };
                }
                
                // Construir userData con la respuesta de tu API
                const userData = {
                    id: result.UserId || 1, // Si tu API no devuelve ID, usar 1
                    username: result.Username,
                    role: result.Role
                };
                
                this.setCurrentUser(userData, 'api_token_' + Date.now());
                return { success: true, user: userData, token: this.authToken };
            } else {
                // Si la API falla, usar validación local para desarrollo
                console.warn('⚠️ API login failed, using local validation');
                return this.validateLocalCredentials(credentials);
            }
            
        } catch (error) {
            console.warn('⚠️ API login error, using local validation:', error.message);
            return this.validateLocalCredentials(credentials);
        } finally {
            this.isAuthenticating = false;
        }
    },

    validateLocalCredentials(credentials) {
        // Credenciales válidas para desarrollo
        const validUsers = [
            { username: 'admin', password: 'admin123', role: 'admin', id: 1 },
            { username: 'empleado', password: 'emp123', role: 'employee', id: 2 },
            { username: 'test', password: 'test', role: 'admin', id: 3 }
        ];

        const user = validUsers.find(u => 
            u.username === credentials.username && 
            u.password === credentials.password &&
            u.role === credentials.role
        );

        if (user) {
            const userData = { ...user };
            delete userData.password;
            this.setCurrentUser(userData, 'local_token_' + Date.now());
            return { success: true, user: userData, token: this.authToken };
        }

        return { success: false, message: 'Credenciales inválidas' };
    },

    async logout() {
        console.log('🚪 Cerrando sesión...');
        
        try {
            // Intentar logout en TU API
            if (this.authToken && this.authToken.startsWith('api_token_')) {
                const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Logout API exitoso:', result.mensaje);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error en logout API:', error);
        } finally {
            this.clearCurrentUser();
        }
    },

    async register(userData) {
        console.log('📝 Registrando usuario:', userData.username);
        
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Username: userData.username,
                    Password: userData.password,
                    Role: userData.role
                })
            });

            if (response.ok) {
                const result = await response.text(); // Tu API devuelve string
                return { success: true, message: result };
            } else {
                const error = await response.text();
                return { success: false, message: error };
            }
            
        } catch (error) {
            console.error('❌ Error en registro:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    },

    setCurrentUser(userData, token) {
        this.currentUser = { ...userData, loginTime: new Date().toISOString() };
        this.authToken = token;
        this.isAuthenticating = false;
        
        console.log('✅ Usuario establecido:', userData.username);
        
        // Notificar a otros módulos del cambio de usuario
        this.notifyUserChange();
    },

    clearCurrentUser() {
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticating = false;
        
        console.log('🧹 Sesión limpiada');
        this.notifyUserChange();
    },

    hasActiveSession() {
        return this.currentUser !== null && !this.isAuthenticating;
    },

    // ========== GESTIÓN DE DATOS ==========
    async getMedicamentos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API medicamentos, usando datos demo:', error.message);
            return this.getDemoMedicamentos();
        }
    },

    async createMedicamento(data) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Error creando medicamento:', error);
            throw error;
        }
    },

    async updateMedicamento(id, data) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Error actualizando medicamento:', error);
            throw error;
        }
    },

    async deleteMedicamento(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return true;
        } catch (error) {
            console.error('❌ Error eliminando medicamento:', error);
            throw error;
        }
    },

    // ========== ALERTAS ==========
    async getVencimientosProximos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.alertas}/vencimientos-proximos`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API vencimientos, calculando localmente:', error.message);
            return this.calculateExpiringFromDemo();
        }
    },

    async getVencidos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.alertas}/vencidos`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API vencidos, calculando localmente:', error.message);
            return this.calculateExpiredFromDemo();
        }
    },

    async getStockMinimo() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.alertas}/stock-minimo`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API stock bajo, calculando localmente:', error.message);
            return this.calculateLowStockFromDemo();
        }
    },

    // ========== PROVEEDORES ==========
    async getProveedores() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.proveedores}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API proveedores, usando datos demo:', error.message);
            return this.getDemoProveedores();
        }
    },

    // ========== REPORTES ==========
    async getConsumoMensual(year, month) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.reportes}/consumo-mensual?year=${year}&month=${month}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API consumo, usando datos demo:', error.message);
            return this.getDemoConsumo();
        }
    },

    async getMasUtilizados() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.reportes}/mas-utilizados`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API más utilizados, usando datos demo:', error.message);
            return this.getDemoMasUtilizados();
        }
    },

    // ========== MOVIMIENTOS ==========
    async getMovimientos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.movimientos}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Error API movimientos, usando datos demo:', error.message);
            return this.getDemoMovimientos();
        }
    },

    // ========== UTILIDADES ==========
    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    },

    notifyUserChange() {
        // Disparar evento personalizado para que otros módulos se enteren
        window.dispatchEvent(new CustomEvent('userSessionChanged', {
            detail: { user: this.currentUser, token: this.authToken }
        }));
    },

    // ========== DATOS DEMO ==========
    getDemoMedicamentos() {
        return [
            {
                id: 1,
                codigo: 'DOG001',
                nombre: 'Amoxicilina Canina',
                cantidad: 45,
                stockMinimo: 10,
                dosis: '250mg',
                tipoAnimal: 'perros',
                fechaVencimiento: '2024-12-15T00:00:00',
                proveedorId: 1,
                proveedorNombre: 'VetPharma',
                fechaCreacion: '2024-01-15T10:00:00'
            },
            {
                id: 2,
                codigo: 'CAT001',
                nombre: 'Vitaminas Felinas',
                cantidad: 8,
                stockMinimo: 15,
                dosis: '5ml',
                tipoAnimal: 'gatos',
                fechaVencimiento: '2024-08-30T00:00:00',
                proveedorId: 2,
                proveedorNombre: 'HealthyPets',
                fechaCreacion: '2024-02-10T14:30:00'
            },
            {
                id: 3,
                codigo: 'GEN001',
                nombre: 'Antibiótico General',
                cantidad: 0,
                stockMinimo: 20,
                dosis: '100mg',
                tipoAnimal: 'general',
                fechaVencimiento: '2024-07-10T00:00:00',
                proveedorId: 1,
                proveedorNombre: 'VetPharma',
                fechaCreacion: '2024-01-20T09:15:00'
            }
        ];
    },

    getDemoProveedores() {
        return [
            { id: 1, nombre: 'VetPharma', contacto: 'info@vetpharma.com' },
            { id: 2, nombre: 'HealthyPets', contacto: 'ventas@healthypets.com' },
            { id: 3, nombre: 'VetSupply', contacto: 'pedidos@vetsupply.com' }
        ];
    },

    getDemoMovimientos() {
        return [
            {
                id: 1,
                medicamentoId: 1,
                medicamentoNombre: 'Amoxicilina Canina',
                tipoMovimiento: 'entrada',
                cantidad: 50,
                fecha: '2024-06-10T09:00:00',
                motivo: 'Compra de stock'
            },
            {
                id: 2,
                medicamentoId: 2,
                medicamentoNombre: 'Vitaminas Felinas',
                tipoMovimiento: 'salida',
                cantidad: 7,
                fecha: '2024-06-09T15:30:00',
                motivo: 'Tratamiento paciente'
            }
        ];
    },

    calculateExpiringFromDemo() {
        const medicamentos = this.getDemoMedicamentos();
        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        return medicamentos.filter(med => {
            const expiry = new Date(med.fechaVencimiento);
            return expiry >= now && expiry <= thirtyDays;
        });
    },

    calculateExpiredFromDemo() {
        const medicamentos = this.getDemoMedicamentos();
        const now = new Date();
        
        return medicamentos.filter(med => new Date(med.fechaVencimiento) < now);
    },

    calculateLowStockFromDemo() {
        const medicamentos = this.getDemoMedicamentos();
        return medicamentos.filter(med => med.cantidad <= med.stockMinimo);
    },

    getDemoConsumo() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', cantidad: 15 },
            { medicamentoId: 2, nombre: 'Vitaminas Felinas', codigo: 'CAT001', cantidad: 7 }
        ];
    },

    getDemoMasUtilizados() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', usage: 85 },
            { medicamentoId: 2, nombre: 'Vitaminas Felinas', codigo: 'CAT001', usage: 65 }
        ];
    }
};

// ========== HELPERS GLOBALES ==========
const GlobalHelpers = {
    formatDate(date, format = 'dd/mm/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        if (format === 'yyyy-mm-dd') {
            return `${year}-${month}-${day}`;
        }
        return `${day}/${month}/${year}`;
    },

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `${minutes} min`;
        if (hours < 24) return `${hours} h`;
        if (days < 7) return `${days} días`;
        return this.formatDate(date);
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(amount || 0);
    },

    showToast(message, type = 'info', duration = 3000) {
        // Evitar múltiples toasts del mismo mensaje
        if (this.lastToastMessage === message && Date.now() - this.lastToastTime < 1000) {
            return;
        }
        this.lastToastMessage = message;
        this.lastToastTime = Date.now();

        let toastContainer = document.getElementById('globalToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'globalToastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                display: flex;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            min-width: 250px;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            word-wrap: break-word;
        `;

        const colors = {
            'success': '#10b981',
            'error': '#ef4444', 
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors['info'];
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        // Remover después del tiempo especificado
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
};

// Propiedades para evitar spam de toasts
GlobalHelpers.lastToastMessage = '';
GlobalHelpers.lastToastTime = 0;

// ========== HACER DISPONIBLE GLOBALMENTE ==========
window.GlobalApiService = GlobalApiService;
window.GlobalHelpers = GlobalHelpers;

console.log('✅ GlobalApiService inicializado con API:', GlobalApiService.API_BASE_URL);