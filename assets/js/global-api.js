// ========== SERVICIO API GLOBAL ARREGLADO PARA TU API ==========
// Este archivo debe cargarse ANTES que todos los demás JS

const GlobalApiService = {
    // ========== CONFIGURACIÓN ==========
    API_BASE_URL: 'https://apivetery.onrender.com/api', // TU URL CORRECTA
    
    // ========== ESTADO GLOBAL ==========
    currentUser: null,
    authToken: null,
    isAuthenticating: false,
    
    // ========== ENDPOINTS ==========
    endpoints: {
        medicamentos: '/Medicamentos',
        proveedores: '/Proveedores',
        usuarios: '/Usuarios',
        alertas: '/Alertas',
        movimientos: '/MovimientoInventario',
        reportes: '/Reportes'
    },

    // ========== AUTENTICACIÓN ARREGLADA ==========
    async login(credentials) {
        console.log('🔐 Iniciando login con TU API:', credentials.username);
        
        try {
            this.isAuthenticating = true;
            
            // Llamar a TU endpoint de login SIN ROL
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    NombreUsuario: credentials.username,  // Tu DTO usa NombreUsuario
                    Contraseña: credentials.password      // Tu DTO usa Contraseña
                    // NO mandamos Role porque tu API no lo usa
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Respuesta de TU API:', result);
                
                // Construir userData con la respuesta de tu API
                // Asignar rol basado en el username si tu API no lo devuelve
                let role = 'employee'; // Por defecto empleado
                if (credentials.username.toLowerCase() === 'admin' || 
                    result.Username?.toLowerCase() === 'admin') {
                    role = 'admin';
                }
                
                const userData = {
                    id: result.UserId || result.Id || 1,
                    username: result.Username || credentials.username,
                    role: role, // Asignamos rol localmente
                    loginTime: new Date().toISOString()
                };
                
                this.setCurrentUser(userData, result.Token || 'api_token_' + Date.now());
                
                console.log('✅ Login exitoso con TU API');
                return { success: true, user: userData, token: this.authToken };
                
            } else {
                const errorText = await response.text();
                console.error('❌ Error de TU API:', errorText);
                return { success: false, message: errorText || 'Credenciales incorrectas' };
            }
            
        } catch (error) {
            console.error('❌ Error conectando con TU API:', error);
            return { success: false, message: 'Error de conexión con el servidor: ' + error.message };
        } finally {
            this.isAuthenticating = false;
        }
    },

    async logout() {
        console.log('🚪 Cerrando sesión con TU API...');
        
        try {
            // Intentar logout en TU API
            if (this.authToken) {
                const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/logout`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.text();
                    console.log('✅ Logout API exitoso:', result);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error en logout API (no crítico):', error);
        } finally {
            this.clearCurrentUser();
        }
    },

    async register(userData) {
        console.log('📝 Registrando usuario con TU API:', userData.username);
        
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.usuarios}/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    NombreUsuario: userData.username,  // Tu DTO
                    Contraseña: userData.password      // Tu DTO
                    // NO mandamos Role
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

    // ========== GESTIÓN DE USUARIO ==========
    setCurrentUser(userData, token) {
        this.currentUser = { ...userData, loginTime: new Date().toISOString() };
        this.authToken = token;
        this.isAuthenticating = false;
        
        // Guardar en localStorage para persistencia
        try {
            localStorage.setItem('veterinary_user', JSON.stringify(this.currentUser));
            localStorage.setItem('veterinary_token', token);
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
        
        console.log('✅ Usuario establecido:', userData.username);
        this.notifyUserChange();
    },

    clearCurrentUser() {
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticating = false;
        
        // Limpiar localStorage
        try {
            localStorage.removeItem('veterinary_user');
            localStorage.removeItem('veterinary_token');
        } catch (e) {
            console.warn('Error limpiando localStorage:', e);
        }
        
        console.log('🧹 Sesión limpiada');
        this.notifyUserChange();
    },

    hasActiveSession() {
        // Verificar si hay sesión en memoria
        if (this.currentUser && !this.isAuthenticating) {
            return true;
        }
        
        // Si no hay en memoria, intentar recuperar de localStorage
        try {
            const savedUser = localStorage.getItem('veterinary_user');
            const savedToken = localStorage.getItem('veterinary_token');
            
            if (savedUser && savedToken) {
                const userData = JSON.parse(savedUser);
                
                // Verificar que la sesión no sea muy antigua (24 horas)
                const loginTime = new Date(userData.loginTime || 0);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    // Restaurar sesión
                    this.currentUser = userData;
                    this.authToken = savedToken;
                    console.log('🔄 Sesión restaurada desde localStorage');
                    return true;
                } else {
                    // Sesión expirada
                    this.clearCurrentUser();
                }
            }
        } catch (e) {
            console.warn('Error recuperando sesión:', e);
            this.clearCurrentUser();
        }
        
        return false;
    },

    // ========== GESTIÓN DE DATOS CON TU API ==========
    async getMedicamentos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Medicamentos cargados desde TU API:', data.length);
            return data;
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
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Error creando medicamento en TU API:', error);
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
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Error actualizando medicamento en TU API:', error);
            throw error;
        }
    },

    async deleteMedicamento(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.medicamentos}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error eliminando medicamento en TU API:', error);
            throw error;
        }
    },

    async getProveedores() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.proveedores}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Proveedores cargados desde TU API:', data.length);
            return data;
        } catch (error) {
            console.warn('⚠️ Error API proveedores, usando datos demo:', error.message);
            return this.getDemoProveedores();
        }
    },

    // ========== ALERTAS (PUEDEN FALLAR PORQUE QUIZÁS NO EXISTAN EN TU API) ==========
    async getVencimientosProximos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.alertas}/vencimientos-proximos`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint alertas no existe, calculando localmente:', error.message);
            return this.calculateExpiringFromLocal();
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
            console.warn('⚠️ Endpoint alertas no existe, calculando localmente:', error.message);
            return this.calculateExpiredFromLocal();
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
            console.warn('⚠️ Endpoint alertas no existe, calculando localmente:', error.message);
            return this.calculateLowStockFromLocal();
        }
    },

    // ========== REPORTES Y MOVIMIENTOS ==========
    async getMovimientos() {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.movimientos}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint movimientos no existe, usando datos demo:', error.message);
            return this.getDemoMovimientos();
        }
    },

    async getConsumoMensual(year, month) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${this.endpoints.reportes}/consumo-mensual?year=${year}&month=${month}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint reportes no existe, usando datos demo:', error.message);
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
            console.warn('⚠️ Endpoint reportes no existe, usando datos demo:', error.message);
            return this.getDemoMasUtilizados();
        }
    },

    // ========== CÁLCULOS LOCALES PARA ALERTAS ==========
    async calculateExpiringFromLocal() {
        try {
            const medicamentos = await this.getMedicamentos();
            const now = new Date();
            const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            return medicamentos.filter(med => {
                const expiry = new Date(med.fechaVencimiento);
                return expiry >= now && expiry <= thirtyDays;
            });
        } catch (error) {
            return [];
        }
    },

    async calculateExpiredFromLocal() {
        try {
            const medicamentos = await this.getMedicamentos();
            const now = new Date();
            
            return medicamentos.filter(med => new Date(med.fechaVencimiento) < now);
        } catch (error) {
            return [];
        }
    },

    async calculateLowStockFromLocal() {
        try {
            const medicamentos = await this.getMedicamentos();
            return medicamentos.filter(med => med.cantidad <= med.stockMinimo);
        } catch (error) {
            return [];
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
        window.dispatchEvent(new CustomEvent('userSessionChanged', {
            detail: { user: this.currentUser, token: this.authToken }
        }));
    },

    // ========== DATOS DEMO DE RESPALDO ==========
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
            }
        ];
    },

    getDemoProveedores() {
        return [
            { id: 1, nombre: 'VetPharma', telefono: '123-456-7890', correo: 'info@vetpharma.com', direccion: 'San José' },
            { id: 2, nombre: 'HealthyPets', telefono: '098-765-4321', correo: 'ventas@healthypets.com', direccion: 'Cartago' }
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
            }
        ];
    },

    getDemoConsumo() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', cantidad: 15 }
        ];
    },

    getDemoMasUtilizados() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', usage: 85 }
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
        // Evitar spam de toasts
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
                flex-direction: column;
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

// Evitar spam de toasts
GlobalHelpers.lastToastMessage = '';
GlobalHelpers.lastToastTime = 0;

// ========== HACER DISPONIBLE GLOBALMENTE ==========
window.GlobalApiService = GlobalApiService;
window.GlobalHelpers = GlobalHelpers;

console.log('✅ GlobalApiService ARREGLADO inicializado para TU API:', GlobalApiService.API_BASE_URL);