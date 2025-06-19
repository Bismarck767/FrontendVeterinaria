// ========== ALERTS.JS SIMPLIFICADO ==========
// Ya no maneja ApiService propio, usa GlobalApiService

class AlertsPage {
    constructor() {
        this.alertas = {
            vencimientos: [],
            vencidos: [],
            stockBajo: []
        };
        this.resolvedAlerts = new Set(); // En memoria, no localStorage
        this.isLoading = false;
    }

    async init() {
        console.log('🚀 Inicializando Alerts...');
        
        // Verificar que GlobalApiService esté disponible
        if (typeof GlobalApiService === 'undefined') {
            console.error('❌ GlobalApiService no disponible');
            this.showError('Error: Servicio API no disponible');
            return;
        }
        
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadAllAlerts();
        this.startAutoRefresh();
        
        console.log('✅ Alerts inicializado');
    }

    // ========== AUTENTICACIÓN ==========
    checkAuthentication() {
        if (!GlobalApiService.hasActiveSession()) {
            GlobalHelpers.showToast('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        this.updateUserInfo();
        
        // Escuchar cambios de sesión
        window.addEventListener('userSessionChanged', (e) => {
            if (!e.detail.user) {
                window.location.href = 'login.html';
            } else {
                this.updateUserInfo();
            }
        });
    }

    updateUserInfo() {
        const userName = document.getElementById('userName');
        if (userName && GlobalApiService.currentUser) {
            const roleText = GlobalApiService.currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
            userName.textContent = `${GlobalApiService.currentUser.username} (${roleText})`;
        }
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #dc2626;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h2>Error en Alertas</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Botones principales
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('refreshAlertsBtn')?.addEventListener('click', () => this.refreshAlerts());
        document.getElementById('markAllReadBtn')?.addEventListener('click', () => this.markAllAsRead());

        // Filtros
        document.getElementById('priorityFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.applyFilters());
    }

    async logout() {
        try {
            if (!confirm('¿Estás seguro que quieres cerrar sesión?')) return;
            
            await GlobalApiService.logout();
            GlobalHelpers.showToast('Cerrando sesión...', 'info');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    }

    // ========== CARGA DE DATOS ==========
    showLoading(show) {
        this.isLoading = show;
        const buttons = document.querySelectorAll('.page-actions .btn');
        buttons.forEach(btn => {
            btn.disabled = show;
            if (show) {
                btn.style.opacity = '0.6';
            } else {
                btn.style.opacity = '1';
            }
        });
    }

    async loadAllAlerts() {
        this.showLoading(true);
        
        try {
            // Cargar alertas en paralelo desde GlobalApiService
            const [vencimientos, vencidos, stockBajo] = await Promise.all([
                GlobalApiService.getVencimientosProximos().catch(err => {
                    console.warn('Error cargando vencimientos próximos:', err);
                    return [];
                }),
                GlobalApiService.getVencidos().catch(err => {
                    console.warn('Error cargando vencidos:', err);
                    return [];
                }),
                GlobalApiService.getStockMinimo().catch(err => {
                    console.warn('Error cargando stock bajo:', err);
                    return [];
                })
            ]);

            // Procesar alertas
            this.alertas = {
                vencimientos: this.processApiAlerts(vencimientos, 'VencimientoProximo'),
                vencidos: this.processApiAlerts(vencidos, 'Vencido'),
                stockBajo: this.processApiAlerts(stockBajo, 'StockBajo')
            };

            this.renderAllAlerts();
            GlobalHelpers.showToast('Alertas cargadas correctamente', 'success');

        } catch (error) {
            console.error('Error cargando alertas:', error);
            GlobalHelpers.showToast('Error cargando alertas: ' + error.message, 'error');
            this.renderErrorState();
        } finally {
            this.showLoading(false);
        }
    }

    // Procesar alertas de la API y agregarles información adicional
    processApiAlerts(alerts, tipo) {
        return alerts.map(alert => ({
            id: `${tipo}_${alert.medicamentoId || alert.id}`,
            tipo: tipo,
            title: this.getAlertTitle(tipo),
            message: alert.mensaje || this.generateAlertMessage(alert, tipo),
            medicamentoId: alert.medicamentoId,
            medicamentoNombre: alert.medicamentoNombre,
            fechaGeneracion: alert.fechaGeneracion || new Date().toISOString(),
            resuelta: this.resolvedAlerts.has(`${tipo}_${alert.medicamentoId || alert.id}`),
            priority: this.getAlertPriority(tipo, alert),
            icon: this.getAlertIcon(tipo),
            rawData: alert // Datos originales de la API
        }));
    }

    getAlertTitle(tipo) {
        const titles = {
            'VencimientoProximo': 'Próximo a Vencer',
            'Vencido': 'Medicamento Vencido',
            'StockBajo': 'Stock Bajo',
            'SinStock': 'Sin Stock'
        };
        return titles[tipo] || 'Alerta';
    }

    generateAlertMessage(alert, tipo) {
        const nombre = alert.medicamentoNombre || 'Medicamento';
        
        switch (tipo) {
            case 'VencimientoProximo':
                const days = this.getDaysUntilExpiry(alert.fechaVencimiento);
                return `${nombre} vence en ${days} días`;
            case 'Vencido':
                return `${nombre} está vencido`;
            case 'StockBajo':
                return `${nombre} tiene stock bajo (${alert.cantidad || 0} unidades)`;
            default:
                return `Alerta para ${nombre}`;
        }
    }

    getAlertPriority(tipo, data = {}) {
        switch (tipo) {
            case 'Vencido':
                return 'high';
            case 'SinStock':
                return 'high';
            case 'VencimientoProximo':
                const days = data.daysUntilExpiry || 0;
                return days <= 7 ? 'high' : 'medium';
            case 'StockBajo':
                const cantidad = data.cantidad || 0;
                return cantidad === 0 ? 'high' : 'medium';
            default:
                return 'medium';
        }
    }

    getAlertIcon(tipo) {
        const icons = {
            'VencimientoProximo': '⏰',
            'Vencido': '❌',
            'StockBajo': '📦',
            'SinStock': '🚫'
        };
        return icons[tipo] || '🔔';
    }

    getDaysUntilExpiry(fechaVencimiento) {
        const now = new Date();
        const expiry = new Date(fechaVencimiento);
        return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }

    // ========== RENDERIZADO ==========
    renderAllAlerts() {
        this.updateSummary();
        this.renderCriticalAlerts();
        this.renderExpiringAlerts();
        this.renderStockAlerts();
        this.renderResolvedAlerts();
    }

    updateSummary() {
        // Combinar todas las alertas
        const allAlerts = [
            ...this.alertas.vencimientos,
            ...this.alertas.vencidos,
            ...this.alertas.stockBajo
        ];

        const activeAlerts = allAlerts.filter(a => !a.resuelta);
        const critical = activeAlerts.filter(a => a.priority === 'high').length;
        const warning = activeAlerts.filter(a => a.priority === 'medium').length;
        const info = activeAlerts.filter(a => a.priority === 'low').length;
        const resolved = allAlerts.filter(a => a.resuelta).length;

        this.updateElement('criticalAlerts', critical);
        this.updateElement('warningAlerts', warning);
        this.updateElement('infoAlerts', info);
        this.updateElement('resolvedAlerts', resolved);
    }

    renderCriticalAlerts() {
        const allAlerts = [
            ...this.alertas.vencimientos,
            ...this.alertas.vencidos,
            ...this.alertas.stockBajo
        ];
        
        const criticalAlerts = allAlerts.filter(a => a.priority === 'high' && !a.resuelta);
        const container = document.getElementById('criticalAlertsList');
        const count = document.getElementById('criticalCount');

        if (count) count.textContent = criticalAlerts.length;

        if (criticalAlerts.length === 0) {
            container.innerHTML = this.getEmptyState('No hay alertas críticas', '✅');
            return;
        }

        container.innerHTML = criticalAlerts.map(alert => this.renderAlertItem(alert)).join('');
    }

    renderExpiringAlerts() {
        const expiringAlerts = [
            ...this.alertas.vencimientos.filter(a => !a.resuelta),
            ...this.alertas.vencidos.filter(a => !a.resuelta)
        ];
        
        const container = document.getElementById('expiringAlertsList');
        const count = document.getElementById('expiringCount');

        if (count) count.textContent = expiringAlerts.length;

        if (expiringAlerts.length === 0) {
            container.innerHTML = this.getEmptyState('No hay medicamentos próximos a vencer', '✅');
            return;
        }

        container.innerHTML = expiringAlerts.map(alert => this.renderAlertItem(alert)).join('');
    }

    renderStockAlerts() {
        const stockAlerts = this.alertas.stockBajo.filter(a => !a.resuelta);
        const container = document.getElementById('stockAlertsList');
        const count = document.getElementById('stockCount');

        if (count) count.textContent = stockAlerts.length;

        if (stockAlerts.length === 0) {
            container.innerHTML = this.getEmptyState('Todos los medicamentos tienen stock adecuado', '✅');
            return;
        }

        container.innerHTML = stockAlerts.map(alert => this.renderAlertItem(alert)).join('');
    }

    renderResolvedAlerts() {
        const allAlerts = [
            ...this.alertas.vencimientos,
            ...this.alertas.vencidos,
            ...this.alertas.stockBajo
        ];
        
        const resolvedAlerts = allAlerts.filter(a => a.resuelta);
        const container = document.getElementById('resolvedAlertsList');
        const count = document.getElementById('resolvedCount');

        if (count) count.textContent = resolvedAlerts.length;

        if (resolvedAlerts.length === 0) {
            container.innerHTML = this.getEmptyState('No hay alertas resueltas', 'ℹ️');
            return;
        }

        container.innerHTML = resolvedAlerts.map(alert => this.renderAlertItem(alert, true)).join('');
    }

    renderAlertItem(alert, isResolved = false) {
        const timeAgo = this.formatRelativeTime(alert.fechaGeneracion);
        const additionalInfo = this.getAdditionalInfo(alert);

        return `
            <div class="alert-item ${alert.priority} ${isResolved ? 'resolved' : ''}" data-alert-id="${alert.id}">
                <div class="alert-content">
                    <div class="alert-header">
                        <div class="alert-type">
                            <span class="alert-icon">${alert.icon}</span>
                            <span class="alert-title">${alert.title}</span>
                        </div>
                        <div class="alert-priority priority-${alert.priority}">
                            ${alert.priority.toUpperCase()}
                        </div>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                    ${additionalInfo ? `<div class="alert-additional-info">${additionalInfo}</div>` : ''}
                    <div class="alert-meta">
                        <span class="alert-time">${timeAgo}</span>
                        <span class="alert-medicine">Medicamento: ${alert.medicamentoNombre}</span>
                    </div>
                </div>
                <div class="alert-actions">
                    ${!isResolved ? `
                        <button class="alert-action-btn view" onclick="alertsPage.viewMedicine('${alert.medicamentoId}')" title="Ver medicamento">
                            👁️
                        </button>
                        <button class="alert-action-btn resolve" onclick="alertsPage.resolveAlert('${alert.id}')" title="Marcar como resuelto">
                            ✅
                        </button>
                    ` : `
                        <button class="alert-action-btn view" onclick="alertsPage.viewMedicine('${alert.medicamentoId}')" title="Ver medicamento">
                            👁️
                        </button>
                        <button class="alert-action-btn unresolve" onclick="alertsPage.unresolveAlert('${alert.id}')" title="Marcar como no resuelto">
                            ↩️
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    getAdditionalInfo(alert) {
        const data = alert.rawData;
        
        switch (alert.tipo) {
            case 'VencimientoProximo':
                if (data.fechaVencimiento) {
                    const days = this.getDaysUntilExpiry(data.fechaVencimiento);
                    return `Vence el ${GlobalHelpers.formatDate(data.fechaVencimiento)} (${days} días restantes)`;
                }
                break;
            case 'Vencido':
                if (data.fechaVencimiento) {
                    return `Venció el ${GlobalHelpers.formatDate(data.fechaVencimiento)}`;
                }
                break;
            case 'StockBajo':
                if (data.cantidad !== undefined && data.stockMinimo !== undefined) {
                    return `Stock actual: ${data.cantidad} unidades | Mínimo requerido: ${data.stockMinimo}`;
                }
                break;
        }
        return null;
    }

    renderErrorState() {
        const containers = [
            'criticalAlertsList',
            'expiringAlertsList', 
            'stockAlertsList',
            'resolvedAlertsList'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = this.getEmptyState('Error cargando alertas', '❌');
            }
        });
    }

    getEmptyState(message, icon) {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <p>${message}</p>
            </div>
        `;
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Ahora mismo';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        if (days < 7) return `Hace ${days} días`;
        return GlobalHelpers.formatDate(date);
    }

    // ========== ACCIONES ==========
    viewMedicine(medicineId) {
        // Redirigir a inventario con el medicamento destacado
        window.location.href = `inventory.html?highlight=${medicineId}`;
    }

    resolveAlert(alertId) {
        if (!this.resolvedAlerts.has(alertId)) {
            this.resolvedAlerts.add(alertId);
            
            // Actualizar estado local
            this.updateAlertStatus(alertId, true);
            this.renderAllAlerts();
            
            GlobalHelpers.showToast('Alerta marcada como resuelta', 'success');
        }
    }

    unresolveAlert(alertId) {
        this.resolvedAlerts.delete(alertId);
        
        // Actualizar estado local
        this.updateAlertStatus(alertId, false);
        this.renderAllAlerts();
        
        GlobalHelpers.showToast('Alerta marcada como no resuelta', 'info');
    }

    updateAlertStatus(alertId, resolved) {
        // Actualizar en todas las categorías
        Object.values(this.alertas).forEach(category => {
            const alert = category.find(a => a.id === alertId);
            if (alert) {
                alert.resuelta = resolved;
            }
        });
    }

    markAllAsRead() {
        const allAlerts = [
            ...this.alertas.vencimientos,
            ...this.alertas.vencidos,
            ...this.alertas.stockBajo
        ];
        
        const activeAlerts = allAlerts.filter(a => !a.resuelta);
        
        if (activeAlerts.length === 0) {
            GlobalHelpers.showToast('No hay alertas activas para marcar', 'info');
            return;
        }

        if (confirm(`¿Marcar ${activeAlerts.length} alertas como resueltas?`)) {
            activeAlerts.forEach(alert => {
                this.resolvedAlerts.add(alert.id);
                alert.resuelta = true;
            });
            
            this.renderAllAlerts();
            GlobalHelpers.showToast('Todas las alertas marcadas como resueltas', 'success');
        }
    }

    refreshAlerts() {
        this.loadAllAlerts();
    }

    applyFilters() {
        // Implementar filtros si es necesario
        console.log('Aplicando filtros...');
        // TODO: Implementar lógica de filtros
    }

    // ========== AUTO REFRESH ==========
    startAutoRefresh() {
        // Actualizar alertas cada 5 minutos
        setInterval(() => {
            if (GlobalApiService.hasActiveSession()) {
                this.loadAllAlerts();
            }
        }, 5 * 60 * 1000);
    }

    // ========== UTILIDADES ==========
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Alerts...');
    
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
    
    // Solo inicializar si estamos en alerts y existe el elemento
    if (document.getElementById('criticalAlerts') || document.getElementById('criticalAlertsList')) {
        window.alertsPage = new AlertsPage();
        window.alertsPage.init();
    }
});

// Hacer disponibles globalmente
window.AlertsPage = AlertsPage;