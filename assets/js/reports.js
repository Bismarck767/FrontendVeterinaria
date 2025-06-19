// ========== REPORTS.JS SIMPLIFICADO ==========
// Ya no maneja ApiService propio, usa GlobalApiService

class ReportsPage {
    constructor() {
        this.medicines = [];
        this.currentReportData = null;
        this.apiConnected = false;
    }

    async init() {
        console.log('🚀 Inicializando Reports...');
        
        // Verificar que GlobalApiService esté disponible
        if (typeof GlobalApiService === 'undefined') {
            console.error('❌ GlobalApiService no disponible');
            this.showError('Error: Servicio API no disponible');
            return;
        }
        
        this.checkAuth();
        this.setupEvents();
        this.setDefaultDates();
        await this.testAPI();
        await this.loadData();
    }

    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #dc2626;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h2>Error en Reportes</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
    }

    // ========== AUTH ==========
    checkAuth() {
        if (!GlobalApiService.hasActiveSession()) {
            GlobalHelpers.showToast('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => window.location.href = 'login.html', 1500);
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
            const role = GlobalApiService.currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
            userName.textContent = `${GlobalApiService.currentUser.username} (${role})`;
        }
    }

    async logout() {
        if (!confirm('¿Cerrar sesión?')) return;
        try {
            await GlobalApiService.logout();
            GlobalHelpers.showToast('Cerrando sesión...', 'info');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    }

    // ========== API Y DATOS ==========
    async testAPI() {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;

        try {
            await GlobalApiService.getMedicamentos();
            this.apiConnected = true;
            statusEl.innerHTML = '<span style="color: green;">✅</span> API conectada';
        } catch (error) {
            this.apiConnected = false;
            statusEl.innerHTML = '<span style="color: red;">❌</span> API desconectada - Datos locales';
        }
    }

    async loadData() {
        this.showLoading(true);
        try {
            // Usar GlobalApiService directamente
            this.medicines = await GlobalApiService.getMedicamentos();
            GlobalHelpers.showToast('Datos cargados desde API', 'success');
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.medicines = [];
            GlobalHelpers.showToast('Error cargando datos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ========== EVENTOS ==========
    setupEvents() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('generateBtn')?.addEventListener('click', () => this.generateReport());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportReport());
        document.getElementById('printBtn')?.addEventListener('click', () => window.print());
        document.getElementById('reportType')?.addEventListener('change', () => this.onTypeChange());
    }

    onTypeChange() {
        const type = document.getElementById('reportType')?.value;
        const needsDates = ['consumption', 'financial'].includes(type);
        document.getElementById('dateFromGroup').style.display = needsDates ? 'block' : 'none';
        document.getElementById('dateToGroup').style.display = needsDates ? 'block' : 'none';
    }

    setDefaultDates() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        if (dateFrom) dateFrom.value = lastMonth.toISOString().split('T')[0];
        if (dateTo) dateTo.value = today.toISOString().split('T')[0];
    }

    // ========== GENERAR REPORTES ==========
    async generateReport() {
        const type = document.getElementById('reportType')?.value;
        if (!type) {
            GlobalHelpers.showToast('Selecciona un tipo de reporte', 'warning');
            return;
        }

        this.showLoading(true);
        try {
            const data = await this.generateReportData(type);
            this.renderReport(type, data);
            this.showActions();
            GlobalHelpers.showToast('Reporte generado', 'success');
        } catch (error) {
            GlobalHelpers.showToast('Error: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    quickReport(type) {
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.value = type;
            this.onTypeChange();
            this.generateReport();
        }
    }

    async generateReportData(type) {
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;

        const baseData = {
            type, dateFrom, dateTo,
            generatedAt: new Date().toISOString(),
            totalMedicines: this.medicines.length,
            apiSource: this.apiConnected
        };

        switch (type) {
            case 'inventory': return this.getInventoryData(baseData);
            case 'expiry': return await this.getExpiryData(baseData);
            case 'lowstock': return await this.getLowStockData(baseData);
            case 'financial': return this.getFinancialData(baseData);
            case 'consumption': return await this.getConsumptionData(baseData);
            case 'mostused': return await this.getMostUsedData(baseData);
            default: throw new Error('Tipo no válido');
        }
    }

    getInventoryData(data) {
        const categories = this.groupByType();
        const totalValue = this.medicines.reduce((sum, med) => sum + (med.cantidad * 10), 0);
        
        return {
            ...data, categories, totalValue,
            lowStockCount: this.medicines.filter(m => m.cantidad <= m.stockMinimo).length,
            expiredCount: this.medicines.filter(m => new Date(m.fechaVencimiento) < new Date()).length
        };
    }

    async getExpiryData(data) {
        try {
            const vencimientos = await GlobalApiService.getVencimientosProximos();
            const vencidos = await GlobalApiService.getVencidos();
            
            return {
                ...data,
                expired: vencidos,
                expiring: vencimientos
            };
        } catch (error) {
            // Calcular localmente si la API falla
            const now = new Date();
            const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return {
                ...data,
                expired: this.medicines.filter(m => new Date(m.fechaVencimiento) < now),
                expiring: this.medicines.filter(m => {
                    const exp = new Date(m.fechaVencimiento);
                    return exp >= now && exp <= thirtyDays;
                })
            };
        }
    }

    async getLowStockData(data) {
        try {
            const stockBajo = await GlobalApiService.getStockMinimo();
            return {
                ...data,
                lowStock: stockBajo.map(m => ({ ...m, needed: Math.max(0, m.stockMinimo - m.cantidad) })),
                outOfStock: stockBajo.filter(m => m.cantidad === 0)
            };
        } catch (error) {
            const lowStock = this.medicines.filter(m => m.cantidad <= m.stockMinimo);
            return {
                ...data,
                lowStock: lowStock.map(m => ({ ...m, needed: Math.max(0, m.stockMinimo - m.cantidad) })),
                outOfStock: lowStock.filter(m => m.cantidad === 0)
            };
        }
    }

    getFinancialData(data) {
        const totalValue = this.medicines.reduce((sum, m) => sum + (m.cantidad * 10), 0);
        const categories = this.groupByType().map(cat => ({
            ...cat,
            value: cat.medicines.reduce((sum, m) => sum + (m.cantidad * 10), 0)
        }));

        return { ...data, totalValue, categories, averageValue: totalValue / this.medicines.length || 0 };
    }

    async getConsumptionData(data) {
        try {
            if (data.dateFrom) {
                const date = new Date(data.dateFrom);
                const consumo = await GlobalApiService.getConsumoMensual(date.getFullYear(), date.getMonth() + 1);
                return { ...data, consumption: consumo, totalConsumed: consumo.reduce((s, i) => s + (i.cantidad || 0), 0) };
            }
            return { ...data, message: 'Configura fechas', placeholder: true };
        } catch (error) {
            return { ...data, message: 'Error API: ' + error.message, placeholder: true };
        }
    }

    async getMostUsedData(data) {
        try {
            const masUsados = await GlobalApiService.getMasUtilizados();
            return { ...data, mostUsed: masUsados.slice(0, 20) };
        } catch (error) {
            // Simular más usados
            const simulated = this.medicines.map(m => ({ ...m, usage: Math.random() * 100 }))
                .sort((a, b) => b.usage - a.usage).slice(0, 20);
            return { ...data, mostUsed: simulated };
        }
    }

    // ========== RENDERIZADO ==========
    renderReport(type, data) {
        this.currentReportData = data;
        const content = document.getElementById('reportContent');
        const title = document.getElementById('reportTitle');

        const titles = {
            inventory: '📦 Inventario', expiry: '⏰ Vencimientos',
            lowstock: '📉 Stock Bajo', financial: '💰 Financiero',
            consumption: '📈 Consumo', mostused: '🏆 Más Utilizados'
        };

        if (title) title.textContent = titles[type] || '📊 Reporte';
        if (!content) return;

        content.innerHTML = this[`render${type.charAt(0).toUpperCase()}${type.slice(1)}Report`](data);
    }

    renderInventoryReport(data) {
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item"><span class="stat-number">${data.totalMedicines}</span><span class="stat-label">Total</span></div>
                    <div class="stat-item success"><span class="stat-number">${GlobalHelpers.formatCurrency(data.totalValue)}</span><span class="stat-label">Valor</span></div>
                    <div class="stat-item warning"><span class="stat-number">${data.lowStockCount}</span><span class="stat-label">Stock Bajo</span></div>
                    <div class="stat-item danger"><span class="stat-number">${data.expiredCount}</span><span class="stat-label">Vencidos</span></div>
                </div>
            </div>
            <div class="report-table">
                <h4>📊 Por Tipo de Animal</h4>
                <table class="table">
                    <thead><tr><th>Tipo</th><th>Cantidad</th><th>Stock Total</th></tr></thead>
                    <tbody>
                        ${data.categories.map(cat => `
                            <tr><td>${this.getIcon(cat.type)} ${this.capitalize(cat.type)}</td><td>${cat.count}</td><td>${cat.totalStock}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderExpiryReport(data) {
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item danger"><span class="stat-number">${data.expired.length}</span><span class="stat-label">Vencidos</span></div>
                    <div class="stat-item warning"><span class="stat-number">${data.expiring.length}</span><span class="stat-label">Por Vencer</span></div>
                </div>
            </div>
            ${data.expired.length > 0 ? `
                <div class="report-table">
                    <h4 style="color: red;">❌ Vencidos</h4>
                    <table class="table">
                        <thead><tr><th>Código</th><th>Medicamento</th><th>Cantidad</th><th>Vencimiento</th></tr></thead>
                        <tbody>
                            ${data.expired.map(m => `
                                <tr class="table-danger"><td>${m.codigo}</td><td>${m.nombre}</td><td>${m.cantidad}</td><td>${GlobalHelpers.formatDate(m.fechaVencimiento)}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state">✅ No hay vencidos</div>'}
            ${data.expiring.length > 0 ? `
                <div class="report-table">
                    <h4 style="color: orange;">⚠️ Por Vencer</h4>
                    <table class="table">
                        <thead><tr><th>Código</th><th>Medicamento</th><th>Cantidad</th><th>Vencimiento</th></tr></thead>
                        <tbody>
                            ${data.expiring.map(m => `
                                <tr class="table-warning"><td>${m.codigo}</td><td>${m.nombre}</td><td>${m.cantidad}</td><td>${GlobalHelpers.formatDate(m.fechaVencimiento)}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state">✅ Ninguno por vencer</div>'}
        `;
    }

    renderLowstockReport(data) {
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item warning"><span class="stat-number">${data.lowStock.length}</span><span class="stat-label">Stock Bajo</span></div>
                    <div class="stat-item danger"><span class="stat-number">${data.outOfStock.length}</span><span class="stat-label">Sin Stock</span></div>
                </div>
            </div>
            ${data.lowStock.length > 0 ? `
                <div class="report-table">
                    <h4>📦 Stock Bajo</h4>
                    <table class="table">
                        <thead><tr><th>Código</th><th>Medicamento</th><th>Actual</th><th>Mínimo</th><th>Necesario</th></tr></thead>
                        <tbody>
                            ${data.lowStock.map(m => `
                                <tr class="${m.cantidad === 0 ? 'table-danger' : 'table-warning'}">
                                    <td>${m.codigo}</td><td>${m.nombre}</td><td>${m.cantidad}</td><td>${m.stockMinimo}</td><td>${m.needed}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state">✅ Todo con stock adecuado</div>'}
        `;
    }

    renderFinancialReport(data) {
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item success"><span class="stat-number">${GlobalHelpers.formatCurrency(data.totalValue)}</span><span class="stat-label">Total</span></div>
                    <div class="stat-item"><span class="stat-number">${GlobalHelpers.formatCurrency(data.averageValue)}</span><span class="stat-label">Promedio</span></div>
                </div>
            </div>
            <div class="report-table">
                <h4>💰 Valor por Categoría</h4>
                <table class="table">
                    <thead><tr><th>Tipo</th><th>Medicamentos</th><th>Valor Total</th></tr></thead>
                    <tbody>
                        ${data.categories.map(cat => `
                            <tr><td>${this.getIcon(cat.type)} ${this.capitalize(cat.type)}</td><td>${cat.count}</td><td>${GlobalHelpers.formatCurrency(cat.value)}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderConsumptionReport(data) {
        if (data.placeholder) {
            return `<div class="placeholder-report"><div class="placeholder-icon">📈</div><h4>Reporte de Consumo</h4><p>${data.message}</p></div>`;
        }
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item"><span class="stat-number">${data.consumption.length}</span><span class="stat-label">Medicamentos</span></div>
                    <div class="stat-item warning"><span class="stat-number">${data.totalConsumed}</span><span class="stat-label">Total Consumido</span></div>
                </div>
            </div>
            <div class="report-table">
                <h4>📈 Detalle de Consumo</h4>
                <table class="table">
                    <thead><tr><th>Medicamento</th><th>Código</th><th>Consumido</th></tr></thead>
                    <tbody>
                        ${data.consumption.map(item => `<tr><td>${item.nombre}</td><td>${item.codigo}</td><td>${item.cantidad}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderMostusedReport(data) {
        return `
            <div class="report-summary">
                <div class="summary-stats">
                    <div class="stat-item"><span class="stat-number">${data.mostUsed.length}</span><span class="stat-label">Top Medicamentos</span></div>
                </div>
            </div>
            <div class="report-table">
                <h4>🏆 Más Utilizados</h4>
                <table class="table">
                    <thead><tr><th>#</th><th>Código</th><th>Medicamento</th><th>Uso</th></tr></thead>
                    <tbody>
                        ${data.mostUsed.map((item, i) => `
                            <tr><td>${i + 1}</td><td>${item.codigo}</td><td>${item.nombre}</td><td>${item.usage || item.cantidad || 0}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ========== UTILIDADES ==========
    groupByType() {
        const groups = {};
        this.medicines.forEach(med => {
            const type = med.tipoAnimal || 'general';
            if (!groups[type]) groups[type] = [];
            groups[type].push(med);
        });
        return Object.keys(groups).map(type => ({
            type, count: groups[type].length,
            totalStock: groups[type].reduce((sum, med) => sum + med.cantidad, 0),
            medicines: groups[type]
        }));
    }

    getIcon(type) {
        return { perros: '🐕', gatos: '🐱', general: '🏥', aves: '🐦' }[type] || '🐾';
    }

    capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    showLoading(show = true) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) indicator.style.display = show ? 'flex' : 'none';
    }

    showActions() {
        document.getElementById('exportBtn').style.display = 'inline-block';
        document.getElementById('printBtn').style.display = 'inline-block';
    }

    // ========== EXPORTAR ==========
    exportReport() {
        if (!this.currentReportData) {
            GlobalHelpers.showToast('No hay datos para exportar', 'warning');
            return;
        }

        const data = this.currentReportData;
        const filename = `reporte_${data.type}_${new Date().toISOString().split('T')[0]}.csv`;
        
        let csvData = [];
        if (data.type === 'inventory' && this.medicines.length > 0) {
            csvData = this.medicines.map(m => ({
                'Código': m.codigo, 'Nombre': m.nombre, 'Cantidad': m.cantidad,
                'Tipo': m.tipoAnimal, 'Vencimiento': GlobalHelpers.formatDate(m.fechaVencimiento)
            }));
        }

        if (csvData.length > 0) {
            this.downloadCSV(csvData, filename);
            GlobalHelpers.showToast('Exportado correctamente', 'success');
        } else {
            GlobalHelpers.showToast('No hay datos para exportar', 'warning');
        }
    }

    downloadCSV(data, filename) {
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h]).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Reports...');
    
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
    
    window.reportsPage = new ReportsPage();
    window.reportsPage.init();
});

// Hacer disponible globalmente
window.ReportsPage = ReportsPage;