// ========== SERVICIO API GLOBAL ARREGLADO PARA TU API CON WARMUP ==========
// Este archivo debe cargarse ANTES que todos los demás JS

const GlobalApiService = {
    // ========== CONFIGURACIÓN ==========
    API_BASE_URL: 'https://apivetery.onrender.com/api', // TU URL CORRECTA
    
    // ========== ESTADO GLOBAL ==========
    currentUser: null,
    authToken: null,
    isAuthenticating: false,
    apiAwake: false,
    
    // ========== ENDPOINTS ==========
    endpoints: {
        medicamentos: '/Medicamentos',
        proveedores: '/Proveedores',
        usuarios: '/Usuarios',
        alertas: '/Alertas',
        movimientos: '/MovimientoInventario',
        reportes: '/Reportes'
    },

    // ========== NUEVO: WARMUP DE API ==========
    async wakeUpApi() {
        if (this.apiAwake) return true;
        
        console.log('☕ Despertando API (puede tomar 30-60 segundos)...');
        GlobalHelpers.showToast('Conectando con el servidor...', 'info', 5000);
        
        try {
            // Intentar ping simple
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
            
            const response = await fetch(this.API_BASE_URL + '/ping', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ API despierta con ping');
                this.apiAwake = true;
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Ping falló, probando con medicamentos:', error.message);
        }
        
        // Si no hay endpoint ping, usar medicamentos
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(this.API_BASE_URL + this.endpoints.medicamentos, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('✅ API respondió con status:', response.status);
            this.apiAwake = true;
            GlobalHelpers.showToast('Servidor conectado', 'success');
            return true;
        } catch (error) {
            console.error('❌ API no responde después del timeout:', error);
            GlobalHelpers.showToast('Servidor no responde. Usando datos de ejemplo.', 'warning', 8000);
            return false;
        }
    },

    // ========== MÉTODO CON RETRY AUTOMÁTICO ==========
    async apiRequestWithRetry(url, options = {}, maxRetries = 2) {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                if (i > 0) {
                    console.log(`🔄 Reintento ${i}/${maxRetries} para: ${url}`);
                    await this.wakeUpApi(); // Despertar en reintentos
                }
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
                
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...options.headers
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    this.apiAwake = true; // Marcar API como despierta
                    return response;
                }
                
                if (response.status >= 500 && i < maxRetries) {
                    console.warn(`⚠️ Error ${response.status}, reintentando...`);
                    this.apiAwake = false; // Marcar como dormida
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Espera progresiva
                    continue;
                }
                
                return response; // Devolver respuesta aunque no sea ok
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn('⚠️ Timeout en la petición');
                    this.apiAwake = false;
                }
                
                if (i < maxRetries) {
                    console.warn(`⚠️ Error de red, reintentando en ${2 * (i + 1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                    continue;
                }
                throw error;
            }
        }
    },

    // ========== AUTENTICACIÓN MEJORADA CON WARMUP ==========
    async login(credentials) {
        console.log('🔐 Iniciando login con TU API:', credentials.username);
        
        try {
            this.isAuthenticating = true;
            
            // Despertar API primero
            await this.wakeUpApi();
            
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.usuarios}/login`,
                {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        NombreUsuario: credentials.username,  // Tu DTO usa NombreUsuario
                        Contraseña: credentials.password      // Tu DTO usa Contraseña
                    })
                }
            );

            console.log('📡 Respuesta status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Respuesta de TU API:', result);
                
                // Construir userData con la respuesta de tu API
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
                GlobalHelpers.showToast(`Bienvenido `, 'success');
                return { success: true, user: userData, token: this.authToken };
                
            } else {
                const errorText = await response.text();
                console.error('❌ Error de TU API:', response.status, errorText);
                return { success: false, message: `Error ${response.status}: ${errorText || 'Credenciales incorrectas'}` };
            }
            
        } catch (error) {
            console.error('❌ Error conectando con TU API:', error);
            let message = 'Error de conexión con el servidor';
            if (error.name === 'AbortError') {
                message = 'La API no responde. Puede estar iniciándose (espera 1-2 minutos)';
            }
            return { success: false, message: message + ': ' + error.message };
        } finally {
            this.isAuthenticating = false;
        }
    },

  async logout() {
    console.log('🚪 Cerrando sesión con TU API...');
    
    try {
        // Intentar logout en TU API
        if (this.authToken) {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.usuarios}/logout`,
                {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`
                    }
                }
            );
            
            if (response.ok) {
                const result = await response.text();
                console.log('✅ Logout API exitoso:', result);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error en logout API (no crítico):', error);
    } finally {
        this.clearCurrentUser();
        GlobalHelpers.showToast('Sesión cerrada', 'info');

        // Redirigir al usuario a index.html (en la raíz del proyecto)
        window.location.href = 'index.html';
    }
},


 async register(userData) {
    console.log('📝 Registrando usuario con TU API:', userData.username);
    
    try {
        await this.wakeUpApi();
        
        const response = await this.apiRequestWithRetry(
            `${this.API_BASE_URL}${this.endpoints.usuarios}/registrar`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Username: userData.username,   // ← CORREGIDO: era NombreUsuario
                    Password: userData.password,   // ← CORREGIDO: era Contraseña  
                    Role: 'admin'                  // ← AGREGADO: tu API lo necesita
                })
            }
        );

        if (response.ok) {
            const result = await response.text();
            GlobalHelpers.showToast('Usuario registrado exitosamente', 'success');
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
        
        // Limpiar localStorage Y sessionStorage
        try {
            localStorage.removeItem('veterinary_user');
            localStorage.removeItem('veterinary_token');
            sessionStorage.removeItem('welcome_shown');  // ← AGREGADO
            sessionStorage.removeItem('api_wakeup_done'); // ← AGREGADO
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

    // ========== GESTIÓN DE DATOS CON RETRY ==========
    async getMedicamentos() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.medicamentos}`,
                { headers: this.getAuthHeaders() }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Medicamentos cargados desde TU API:', data.length);
                return data;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.warn('⚠️ API no disponible, usando datos demo:', error.message);
            GlobalHelpers.showToast('API no disponible, mostrando datos de ejemplo', 'warning');
            return this.getDemoMedicamentos();
        }
    },

    async createMedicamento(data) {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.medicamentos}`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(data)
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            GlobalHelpers.showToast('Medicamento creado exitosamente', 'success');
            return result;
        } catch (error) {
            console.error('❌ Error creando medicamento en TU API:', error);
            GlobalHelpers.showToast('Error creando medicamento: ' + error.message, 'error');
            throw error;
        }
    },

    async updateMedicamento(id, data) {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.medicamentos}/${id}`,
                {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(data)
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            GlobalHelpers.showToast('Medicamento actualizado exitosamente', 'success');
            return result;
        } catch (error) {
            console.error('❌ Error actualizando medicamento en TU API:', error);
            GlobalHelpers.showToast('Error actualizando medicamento: ' + error.message, 'error');
            throw error;
        }
    },

    async deleteMedicamento(id) {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.medicamentos}/${id}`,
                {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                }
            );
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            
            GlobalHelpers.showToast('Medicamento eliminado exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando medicamento en TU API:', error);
            GlobalHelpers.showToast('Error eliminando medicamento: ' + error.message, 'error');
            throw error;
        }
    },

    async getProveedores() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.proveedores}`,
                { headers: this.getAuthHeaders() }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Proveedores cargados desde TU API:', data.length);
                return data;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('⚠️ Error API proveedores, usando datos demo:', error.message);
            return this.getDemoProveedores();
        }
    },

    // ========== ALERTAS CON FALLBACK LOCAL ==========
    async getVencimientosProximos() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.alertas}/vencimientos-proximos`,
                { headers: this.getAuthHeaders() }
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint alertas no existe, calculando localmente:', error.message);
            return this.calculateExpiringFromLocal();
        }
    },

    async getVencidos() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.alertas}/vencidos`,
                { headers: this.getAuthHeaders() }
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint alertas no existe, calculando localmente:', error.message);
            return this.calculateExpiredFromLocal();
        }
    },

    async getStockMinimo() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.alertas}/stock-minimo`,
                { headers: this.getAuthHeaders() }
            );
            
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
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.movimientos}`,
                { headers: this.getAuthHeaders() }
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint movimientos no existe, usando datos demo:', error.message);
            return this.getDemoMovimientos();
        }
    },

    async getConsumoMensual(year, month) {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.reportes}/consumo-mensual?year=${year}&month=${month}`,
                { headers: this.getAuthHeaders() }
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Endpoint reportes no existe, usando datos demo:', error.message);
            return this.getDemoConsumo();
        }
    },

    async getMasUtilizados() {
        try {
            const response = await this.apiRequestWithRetry(
                `${this.API_BASE_URL}${this.endpoints.reportes}/mas-utilizados`,
                { headers: this.getAuthHeaders() }
            );
            
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
            },
            {
                id: 3,
                codigo: 'BIRD001',
                nombre: 'Antibiótico Aviario',
                cantidad: 25,
                stockMinimo: 5,
                dosis: '10ml',
                tipoAnimal: 'aves',
                fechaVencimiento: '2025-03-20T00:00:00',
                proveedorId: 1,
                proveedorNombre: 'VetPharma',
                fechaCreacion: '2024-03-01T08:00:00'
            }
        ];
    },

    getDemoProveedores() {
        return [
            { id: 1, nombre: 'VetPharma', telefono: '123-456-7890', correo: 'info@vetpharma.com', direccion: 'San José' },
            { id: 2, nombre: 'HealthyPets', telefono: '098-765-4321', correo: 'ventas@healthypets.com', direccion: 'Cartago' },
            { id: 3, nombre: 'AnimalCare', telefono: '456-789-0123', correo: 'contacto@animalcare.com', direccion: 'Alajuela' }
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
                cantidad: 5,
                fecha: '2024-06-15T14:30:00',
                motivo: 'Venta'
            }
        ];
    },

    getDemoConsumo() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', cantidad: 15 },
            { medicamentoId: 2, nombre: 'Vitaminas Felinas', codigo: 'CAT001', cantidad: 8 }
        ];
    },

    getDemoMasUtilizados() {
        return [
            { medicamentoId: 1, nombre: 'Amoxicilina Canina', codigo: 'DOG001', usage: 85 },
            { medicamentoId: 3, nombre: 'Antibiótico Aviario', codigo: 'BIRD001', usage: 60 }
        ];
    }
};

// ========== HELPERS GLOBALES MEJORADOS ==========
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
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            min-width: 250px;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            word-wrap: break-word;
            pointer-events: auto;
            cursor: pointer;
        `;

        const colors = {
            'success': '#10b981',
            'error': '#ef4444', 
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors['info'];
        toast.textContent = message;

        // Cerrar al hacer clic
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });

        toastContainer.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        // Remover después del tiempo especificado
        setTimeout(() => {
            if (toast.parentNode && toast.style.opacity !== '0') {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    },

    // Nuevo: mostrar loading spinner
    showLoadingSpinner() {
        let spinner = document.getElementById('globalLoadingSpinner');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = 'globalLoadingSpinner';
            spinner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            
            const spinnerInner = document.createElement('div');
            spinnerInner.style.cssText = `
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
            
            // Agregar CSS de animación
            if (!document.getElementById('spinnerStyles')) {
                const style = document.createElement('style');
                style.id = 'spinnerStyles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            spinner.appendChild(spinnerInner);
            document.body.appendChild(spinner);
        }
        
        spinner.style.display = 'flex';
    },

    hideLoadingSpinner() {
        const spinner = document.getElementById('globalLoadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    },

    // Nuevo: confirmar acción
    async confirmAction(message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
            `;
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                padding: 24px;
                border-radius: 8px;
                max-width: 400px;
                margin: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            `;
            
            modalContent.innerHTML = `
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelBtn" style="
                        padding: 8px 16px;
                        border: 1px solid #ddd;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                    ">${cancelText}</button>
                    <button id="confirmBtn" style="
                        padding: 8px 16px;
                        border: none;
                        background: #ef4444;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                    ">${confirmText}</button>
                </div>
            `;
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Event listeners
            modalContent.querySelector('#confirmBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
            
            modalContent.querySelector('#cancelBtn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            
            // Cerrar con ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', handleEsc);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    },

    // Nuevo: validar formularios
    validateForm(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && (!value || value.toString().trim() === '')) {
                errors[field] = `${rule.label || field} es requerido`;
                continue;
            }
            
            if (value && rule.minLength && value.toString().length < rule.minLength) {
                errors[field] = `${rule.label || field} debe tener al menos ${rule.minLength} caracteres`;
            }
            
            if (value && rule.maxLength && value.toString().length > rule.maxLength) {
                errors[field] = `${rule.label || field} no puede tener más de ${rule.maxLength} caracteres`;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || `${rule.label || field} tiene formato inválido`;
            }
            
            if (value && rule.min && parseFloat(value) < rule.min) {
                errors[field] = `${rule.label || field} debe ser mayor o igual a ${rule.min}`;
            }
            
            if (value && rule.max && parseFloat(value) > rule.max) {
                errors[field] = `${rule.label || field} debe ser menor o igual a ${rule.max}`;
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Evitar spam de toasts
GlobalHelpers.lastToastMessage = '';
GlobalHelpers.lastToastTime = 0;

// ========== INICIALIZACIÓN AUTOMÁTICA MEJORADA ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, inicializando GlobalApiService...');
    
    // Verificar si hay sesión guardada PERO no mostrar toast repetidos
    if (GlobalApiService.hasActiveSession()) {
        console.log('👤 Sesión activa encontrada:', GlobalApiService.currentUser.username);
        
        // Solo mostrar bienvenida si no se ha mostrado antes en esta sesión
        const welcomeShown = sessionStorage.getItem('welcome_shown');
        if (!welcomeShown) {
            GlobalHelpers.showToast(`Bienvenido `, 'info');
            sessionStorage.setItem('welcome_shown', 'true');
        }
    }
    
    // Despertar API en background SOLO si no se ha hecho antes
    const apiWakeupDone = sessionStorage.getItem('api_wakeup_done');
    if (!apiWakeupDone) {
        setTimeout(() => {
            GlobalApiService.wakeUpApi().then(() => {
                sessionStorage.setItem('api_wakeup_done', 'true');
            }).catch(err => {
                console.warn('⚠️ No se pudo despertar la API en background:', err.message);
            });
        }, 2000);
    }
});

// ========== EVENTOS GLOBALES ==========
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    GlobalHelpers.showToast('Conexión a internet restaurada', 'success');
    GlobalApiService.apiAwake = false; // Reset estado para forzar nueva verificación
});

window.addEventListener('offline', () => {
    console.log('📶 Sin conexión a internet');
    GlobalHelpers.showToast('Sin conexión a internet', 'warning');
});

// ========== HACER DISPONIBLE GLOBALMENTE ==========
window.GlobalApiService = GlobalApiService;
window.GlobalHelpers = GlobalHelpers;

console.log('✅ GlobalApiService COMPLETO inicializado para TU API:', GlobalApiService.API_BASE_URL);

// ========== DEBUG UTILITIES (SOLO PARA DESARROLLO) ==========
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApi = {
        testConnection: () => GlobalApiService.wakeUpApi(),
        testLogin: (username = 'admin', password = 'admin123') => 
            GlobalApiService.login({ username, password }),
        getMedicamentos: () => GlobalApiService.getMedicamentos(),
        getApiStatus: () => ({
            isAwake: GlobalApiService.apiAwake,
            hasToken: !!GlobalApiService.authToken,
            currentUser: GlobalApiService.currentUser
        }),
        clearSession: () => GlobalApiService.clearCurrentUser(),
        showToast: (msg, type) => GlobalHelpers.showToast(msg, type)
    };
    
    console.log('🛠️ Modo desarrollo detectado. Utilities disponibles en window.debugApi');
}
