// ========== DASHBOARD SIMPLIFICADO ==========
// Ya no maneja ApiService propio, usa GlobalApiService

class DashboardPage {
    constructor() {
        this.medicines = [];
        this.alerts = [];
        this.movements = [];
        this.isLoading = false;
        this.authCheckComplete = false;
    }

    async init() {
        console.log('🚀 Inicializando Dashboard...');
        
        // Verificar que GlobalApiService esté disponible
        if (typeof GlobalApiService === 'undefined') {
            console.error('❌ GlobalApiService no disponible');
            this.showError('Error: Servicio API no disponible');
            return;
        }
        
        // Procesar parámetros de URL si existen
        await this.processUrlParams();
        
        // Verificar autenticación
        if (!this.checkAuthentication()) {
            return; // Ya redirigió al login
        }
        
        // Configurar listener para cambios de sesión
        window.addEventListener('userSessionChanged', (e) => {
            this.handleSessionChange(e.detail);
        });
        
        // Inicializar dashboard
        this.setupEventListeners();
        this.updateTime();
        this.startTimeUpdater();
        await this.loadAllData();
        
        this.authCheckComplete = true;
        console.log('✅ Dashboard inicializado completamente');
    }

    // ========== PROCESAMIENTO DE PARÁMETROS URL ==========
    async processUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const userFromLogin = urlParams.get('user');
        const tokenFromLogin = urlParams.get('token');
        
        if (userFromLogin && tokenFromLogin) {
            try {
                const userData = JSON.parse(decodeURIComponent(userFromLogin));
                GlobalApiService.setCurrentUser(userData, tokenFromLogin);
                console.log('✅ Usuario seteado desde parámetros de URL');
                
                // Limpiar URL sin recargar
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error('❌ Error parseando datos de usuario:', error);
                GlobalApiService.clearCurrentUser();
            }
        }
    }

    // ========== AUTENTICACIÓN ==========
    checkAuthentication() {
        if (GlobalApiService.isAuthenticating) {
            console.log('⏳ Autenticación en progreso...');
            return false;
        }

        if (!GlobalApiService.hasActiveSession()) {
            console.log('❌ No hay sesión activa, redirigiendo a login...');
            this.redirectToLogin();
            return false;
        }

        console.log('✅ Sesión activa encontrada para:', GlobalApiService.currentUser.username);
        this.updateUserInfo();
        return true;
    }

    handleSessionChange(detail) {
        if (!detail.user) {
            // Usuario deslogueado
            this.redirectToLogin();
        } else {
            // Usuario logueado/cambió
            this.updateUserInfo();
        }
    }

    redirectToLogin() {
        if (window.location.pathname.includes('login.html')) {
            return;
        }

        GlobalApiService.isAuthenticating = true;
        GlobalHelpers.showToast('Sesión expirada. Redirigiendo...', 'warning', 2000);
        
        setTimeout(() => {
            window.location.replace('login.html');
        }, 1500);
    }

    updateUserInfo() {
        const currentUser = GlobalApiService.currentUser;
        if (!currentUser) return;

        const userName = document.getElementById('userName');
        if (userName) {
            const roleText = currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
            userName.textContent = `${currentUser.username} (${roleText})`;
        }

        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            const greeting = this.getTimeGreeting();
            welcomeMessage.textContent = `${greeting}, ${currentUser.username}. Aquí tienes el resumen de tu inventario.`;
        }
    }

    getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            // Remover listeners existentes y agregar nuevo
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                console.log('🖱️ CLICK EN LOGOUT DETECTADO!');
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            });
            console.log('✅ Event listener de logout configurado');
        }

        // Auto-refresh cada 5 minutos
        setInterval(() => {
            if (this.authCheckComplete && GlobalApiService.hasActiveSession()) {
                this.loadAllData(false);
            }
        }, 5 * 60 * 1000);

        // Manejar visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.authCheckComplete) {
                this.checkAuthentication();
            }
        });
    }

    // ========== LOGOUT ==========
    async logout() {
        console.log('🚪 MÉTODO LOGOUT EJECUTADO!');
        
        if (GlobalApiService.isAuthenticating) {
            console.log('⏳ Logout ya en progreso...');
            return;
        }

        if (!confirm('¿Estás seguro que quieres cerrar sesión?')) {
            console.log('❌ Usuario canceló logout');
            return;
        }

        console.log('✅ Usuario confirmó logout, procediendo...');
        
        try {
            GlobalApiService.isAuthenticating = true;
            this.showLogoutLoading(true);
            
            console.log('📡 Llamando logout global...');
            await GlobalApiService.logout();
            
            GlobalHelpers.showToast('Sesión cerrada correctamente', 'success', 1500);
            
            console.log('✅ Logout completado, redirigiendo...');
            
            setTimeout(() => {
                window.location.replace('login.html');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            
            GlobalApiService.clearCurrentUser();
            GlobalHelpers.showToast('Sesión cerrada (con errores)', 'warning');
            
            setTimeout(() => {
                window.location.replace('login.html');
            }, 1000);
        }
    }

    showLogoutLoading(show) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) return;

        if (show) {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<span class="spinner"></span> Cerrando...';
        } else {
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = 'Cerrar Sesión';
        }
    }

    // ========== TIEMPO ==========
    updateTime() {
        const currentDate = document.getElementById('currentDate');
        const currentTime = document.getElementById('currentTime');
        
        const now = new Date();
        
        if (currentDate) {
            currentDate.textContent = now.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (currentTime) {
            currentTime.textContent = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    startTimeUpdater() {
        setInterval(() => this.updateTime(), 1000);
    }

    // ========== CARGA DE DATOS ==========
    showLoading(show) {
        this.isLoading = show;
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #dc2626;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h2>Error en Dashboard</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
    }

    async loadAllData(showLoader = true) {
        if (!GlobalApiService.hasActiveSession()) {
            console.log('❌ No hay sesión activa, no se cargarán datos');
            return;
        }

        if (showLoader) this.showLoading(true);
        
        try {
            // Usar GlobalApiService para todo
            const [medicines, vencimientos, vencidos, stockBajo, movimientos] = await Promise.all([
                GlobalApiService.getMedicamentos().catch(err => {
                    console.warn('Error cargando medicamentos:', err);
                    return [];
                }),
                GlobalApiService.getVencimientosProximos().catch(err => {
                    console.warn('Error cargando vencimientos:', err);
                    return [];
                }),
                GlobalApiService.getVencidos().catch(err => {
                    console.warn('Error cargando vencidos:', err);
                    return [];
                }),
                GlobalApiService.getStockMinimo().catch(err => {
                    console.warn('Error cargando stock bajo:', err);
                    return [];
                }),
                GlobalApiService.getMovimientos().catch(err => {
                    console.warn('Error cargando movimientos:', err);
                    return [];
                })
            ]);

            this.medicines = medicines;
            this.movements = movimientos;
            this.alerts = { vencimientos, vencidos, stockBajo };

            this.updateDashboardStats();
            this.loadRecentActivity();
            this.loadCriticalAlerts();
            this.updateInventorySummary();

            if (showLoader) {
                GlobalHelpers.showToast('Dashboard actualizado', 'success', 1500);
            }

        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            GlobalHelpers.showToast('Error cargando algunos datos del dashboard', 'warning');
            this.loadFallbackData();
        } finally {
            if (showLoader) this.showLoading(false);
        }
    }

    loadFallbackData() {
        this.updateElement('totalMeds', 'N/A');
        this.updateElement('expiringSoon', 'N/A');
        this.updateElement('lowStock', 'N/A');
        this.updateElement('totalValue', 'N/A');
        
        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity) {
            recentActivity.innerHTML = `
                <div class="activity-item info">
                    <div class="activity-icon">📡</div>
                    <div class="activity-content">
                        <div class="activity-action">Sin conexión con la API</div>
                        <div class="activity-item-name">Verificar estado del servidor</div>
                    </div>
                    <div class="activity-time">Ahora</div>
                </div>
            `;
        }

        const criticalAlerts = document.getElementById('criticalAlerts');
        if (criticalAlerts) {
            criticalAlerts.innerHTML = `
                <div class="no-alerts">
                    <div class="no-alerts-icon">📡</div>
                    <p>Sin conexión con el servidor</p>
                </div>
            `;
        }
    }

    // ========== ESTADÍSTICAS ==========
    updateDashboardStats() {
        const totalMeds = this.medicines.length;
        const expiring = this.alerts.vencimientos ? this.alerts.vencimientos.length : 0;
        const lowStockMeds = this.alerts.stockBajo ? this.alerts.stockBajo.length : 0;
        
        const totalValue = this.medicines.reduce((sum, med) => {
            const quantity = med.cantidad || 0;
            const price = 10; // Precio estimado
            return sum + (quantity * price);
        }, 0);

        this.updateElement('totalMeds', totalMeds);
        this.updateElement('expiringSoon', expiring);
        this.updateElement('lowStock', lowStockMeds);
        this.updateElement('totalValue', GlobalHelpers.formatCurrency(totalValue));

        this.updateElement('medsChange', `${totalMeds > 0 ? 'sistema activo' : 'sin datos'}`);
        this.updateElement('expiringChange', 'próximos 30 días');
        this.updateElement('stockChange', lowStockMeds > 0 ? 'requieren atención' : 'niveles normales');
        this.updateElement('valueChange', 'inventario actual');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // ========== ACTIVIDAD RECIENTE ==========
    loadRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;

        const activities = [];

        // Movimientos recientes
        this.movements.slice(0, 3).forEach(mov => {
            activities.push({
                action: this.getMovementAction(mov.tipoMovimiento),
                item: `${mov.medicamentoNombre || 'Medicamento'} - ${mov.cantidad} unidades`,
                time: GlobalHelpers.formatRelativeTime ? GlobalHelpers.formatRelativeTime(mov.fecha) : 'Reciente',
                icon: this.getMovementIcon(mov.tipoMovimiento),
                type: this.getMovementType(mov.tipoMovimiento)
            });
        });

        // Medicamentos recientes
        const recentMeds = this.medicines
            .sort((a, b) => new Date(b.fechaCreacion || Date.now()) - new Date(a.fechaCreacion || Date.now()))
            .slice(0, 2);

        recentMeds.forEach(med => {
            activities.push({
                action: 'Medicamento registrado',
                item: `${med.nombre} - Código: ${med.codigo}`,
                time: GlobalHelpers.formatRelativeTime ? GlobalHelpers.formatRelativeTime(med.fechaCreacion || Date.now()) : 'Reciente',
                icon: '💊',
                type: 'success'
            });
        });

        // Actividad del usuario actual
        const currentUser = GlobalApiService.currentUser;
        if (currentUser) {
            activities.push({
                action: 'Sesión iniciada',
                item: `${currentUser.username}`,
                time: 'Ahora',
                icon: '👤',
                type: 'info'
            });
        }

        if (activities.length === 0) {
            recentActivity.innerHTML = `
                <div class="activity-item info">
                    <div class="activity-icon">📊</div>
                    <div class="activity-content">
                        <div class="activity-action">No hay actividad reciente</div>
                        <div class="activity-item-name">Comienza agregando medicamentos</div>
                    </div>
                    <div class="activity-time">-</div>
                </div>
            `;
            return;
        }

        recentActivity.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item ${activity.type}">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-action">${activity.action}</div>
                    <div class="activity-item-name">${activity.item}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    getMovementAction(tipo) {
        const actions = {
            'entrada': 'Stock agregado',
            'salida': 'Stock retirado',
            'ajuste': 'Stock ajustado',
            'vencimiento': 'Medicamento vencido'
        };
        return actions[tipo] || 'Movimiento registrado';
    }

    getMovementIcon(tipo) {
        const icons = {
            'entrada': '📦',
            'salida': '📤',
            'ajuste': '⚖️',
            'vencimiento': '⚠️'
        };
        return icons[tipo] || '📊';
    }

    getMovementType(tipo) {
        const types = {
            'entrada': 'success',
            'salida': 'warning',
            'ajuste': 'info',
            'vencimiento': 'danger'
        };
        return types[tipo] || 'info';
    }

    // ========== ALERTAS CRÍTICAS ==========
    loadCriticalAlerts() {
        const criticalAlerts = document.getElementById('criticalAlerts');
        if (!criticalAlerts) return;

        const allAlerts = [];

        // Medicamentos vencidos
        this.alerts.vencidos.forEach(med => {
            allAlerts.push({
                type: 'expired',
                icon: '❌',
                title: 'Medicamento Vencido',
                message: `${med.nombre} venció el ${GlobalHelpers.formatDate(med.fechaVencimiento)}`,
                priority: 1
            });
        });

        // Stock bajo
        this.alerts.stockBajo.forEach(med => {
            const isOutOfStock = med.cantidad === 0;
            allAlerts.push({
                type: isOutOfStock ? 'outofstock' : 'lowstock',
                icon: isOutOfStock ? '🚫' : '📦',
                title: isOutOfStock ? 'Sin Stock' : 'Stock Bajo',
                message: isOutOfStock 
                    ? `${med.nombre} no tiene stock disponible`
                    : `${med.nombre} tiene solo ${med.cantidad} unidades (mín: ${med.stockMinimo})`,
                priority: isOutOfStock ? 1 : 2
            });
        });

        // Próximos a vencer
        this.alerts.vencimientos.forEach(med => {
            const daysUntilExpiry = Math.ceil(
                (new Date(med.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24)
            );
            allAlerts.push({
                type: 'expiring',
                icon: '⏰',
                title: 'Próximo a Vencer',
                message: `${med.nombre} vence en ${daysUntilExpiry} días`,
                priority: 2
            });
        });

        allAlerts.sort((a, b) => a.priority - b.priority);

        if (allAlerts.length === 0) {
            criticalAlerts.innerHTML = `
                <div class="no-alerts">
                    <div class="no-alerts-icon">✅</div>
                    <p>No hay alertas críticas</p>
                    <small>Tu inventario está en buen estado</small>
                </div>
            `;
        } else {
            criticalAlerts.innerHTML = allAlerts.slice(0, 4).map(alert => `
                <div class="alert-item ${alert.type}">
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ========== RESUMEN DE INVENTARIO ==========
    updateInventorySummary() {
        const container = document.getElementById('animalSummaryContainer');
        if (!container) return;

        if (this.medicines.length === 0) {
            container.innerHTML = `
                <h2 class="section-title">📋 Resumen del Inventario</h2>
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <p>No hay medicamentos en el inventario</p>
                    <a href="inventory.html" style="color: var(--primary-color); text-decoration: none; font-weight: 600;">
                        ➕ Agregar primer medicamento
                    </a>
                </div>
            `;
            return;
        }

        const animalTypes = [...new Set(this.medicines.map(med => 
            med.tipoAnimal || 'general'
        ))];

        const animalCounts = {};
        animalTypes.forEach(type => {
            animalCounts[type] = this.medicines.filter(med => 
                (med.tipoAnimal || 'general') === type
            ).length;
        });

        const totalQuantity = this.medicines.reduce((sum, med) => sum + (med.cantidad || 0), 0);
        const avgStock = totalQuantity / this.medicines.length;

        const sortedAnimals = Object.entries(animalCounts)
            .sort(([,a], [,b]) => b - a);

        container.innerHTML = `
            <h2 class="section-title">📋 Medicamentos por Tipo de Animal</h2>
            <div class="animals-grid">
                ${sortedAnimals.map(([type, count]) => `
                    <div class="animal-card">
                        <div class="animal-icon">${this.getAnimalIcon(type)}</div>
                        <div class="animal-info">
                            <span class="animal-name">${this.formatAnimalName(type)}</span>
                            <span class="animal-count">${count} medicamento${count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="summary-stats">
                <div class="stat-item">
                    <strong>Tipos diferentes:</strong> ${sortedAnimals.length}
                </div>
                <div class="stat-item">
                    <strong>Total medicamentos:</strong> ${this.medicines.length}
                </div>
                <div class="stat-item">
                    <strong>Total unidades:</strong> ${totalQuantity.toLocaleString()}
                </div>
                <div class="stat-item">
                    <strong>Promedio por medicamento:</strong> ${Math.round(avgStock)} unidades
                </div>
            </div>
        `;
    }

    getAnimalIcon(type) {
        const icons = {
            'perros': '🐕', 'gatos': '🐱', 'general': '🏥', 'conejos': '🐰', 
            'hamsters': '🐹', 'aves': '🐦', 'peces': '🐠', 'reptiles': '🦎',
            'caballos': '🐴', 'vacas': '🐄', 'cerdos': '🐷', 'ovejas': '🐑',
            'cabras': '🐐', 'pollos': '🐓', 'patos': '🦆', 'aves-domesticas': '🐦',
            'peces-ornamentales': '🐠', 'felinos-grandes': '🦁'
        };
        return icons[type.toLowerCase()] || '🐾';
    }

    formatAnimalName(type) {
        return type.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// ========== FUNCIONES GLOBALES ==========
function navigateTo(page) {
    window.location.href = page;
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Dashboard...');
    
    // Verificar que GlobalApiService esté disponible
    if (typeof GlobalApiService === 'undefined') {
        console.error('❌ GlobalApiService no disponible');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #dc2626;">
                <h2>Error de Configuración</h2>
                <p>GlobalApiService no está disponible. Asegúrate de cargar global-api.js primero.</p>
            </div>
        `;
        return;
    }
    
    // Inicializar dashboard
    window.dashboardPage = new DashboardPage();
    window.dashboardPage.init();
});

// Hacer disponibles globalmente
window.GlobalHelpers = GlobalHelpers;
window.GlobalApiService = GlobalApiService;