// Componente Sidebar para VeterinaryProject
class Sidebar {
    constructor() {
        this.isCollapsed = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.createSidebar();
        this.setupEvents();
        this.updateUserInfo();
    }

    createSidebar() {
        if (document.getElementById('sidebar')) return;

        const sidebar = document.createElement('aside');
        sidebar.id = 'sidebar';
        sidebar.className = 'sidebar';
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <span class="logo-icon">🏥</span>
                    <span class="logo-text">VetSystem</span>
                </div>
                <button class="sidebar-toggle" onclick="sidebar.toggle()">‹</button>
            </div>

            <nav class="sidebar-nav">
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="#dashboard" class="nav-link" data-section="dashboard">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#inventory" class="nav-link" data-section="inventory">
                            <span class="nav-icon">💊</span>
                            <span class="nav-text">Inventario</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#alerts" class="nav-link" data-section="alerts">
                            <span class="nav-icon">🚨</span>
                            <span class="nav-text">Alertas</span>
                            <span class="nav-badge" id="alertBadge" style="display: none;"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#reports" class="nav-link" data-section="reports">
                            <span class="nav-icon">📋</span>
                            <span class="nav-text">Reportes</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-stats" id="sidebarStats">
                ${this.renderStats()}
            </div>

            <div class="sidebar-footer">
                <div class="user-summary" id="userSummary">
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">Usuario</div>
                        <div class="user-role">Empleado</div>
                    </div>
                </div>
            </div>
        `;

        const header = document.getElementById('header');
        if (header) {
            header.parentNode.insertBefore(sidebar, header.nextSibling);
        } else {
            document.body.prepend(sidebar);
        }

        this.element = sidebar;
    }

    setupEvents() {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.sidebar .nav-link');
            if (navLink) {
                e.preventDefault();
                this.handleNavigation(navLink);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && !this.isCollapsed) {
                this.collapse();
            }
        });

        setInterval(() => this.updateStats(), 30000);
    }

    handleNavigation(link) {
        const section = link.dataset.section;
        
        if (!this.hasPermission(section)) {
            if (window.Helpers) {
                Helpers.showToast('No tienes permisos para esta sección', 'error');
            }
            return;
        }

        this.setActiveItem(section);
        
        if (window.app) {
            window.app.showSection(section);
        }

        if (window.innerWidth <= 768) {
            this.collapse();
        }
    }

    setActiveItem(sectionId) {
        const navItems = this.element.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        const activeItem = this.element.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) {
            activeItem.closest('.nav-item').classList.add('active');
        }
    }

    hasPermission(section) {
        if (!window.authSystem?.isAuthenticated()) return false;
        
        const permissions = {
            'dashboard': 'inventory.read',
            'inventory': 'inventory.read',
            'alerts': 'inventory.read',
            'reports': 'reports.basic'
        };

        const required = permissions[section];
        return !required || window.authSystem.hasPermission(required);
    }

    toggle() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    collapse() {
        this.isCollapsed = true;
        this.element.classList.add('collapsed');
        this.element.querySelector('.sidebar-toggle').textContent = '›';
    }

    expand() {
        this.isCollapsed = false;
        this.element.classList.remove('collapsed');
        this.element.querySelector('.sidebar-toggle').textContent = '‹';
    }

    updateUserInfo() {
        this.currentUser = window.authSystem?.getCurrentUser();
        
        if (this.currentUser) {
            const userSummary = this.element.querySelector('#userSummary');
            const roleText = this.currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
            const icon = this.currentUser.role === 'admin' ? '👑' : '👤';
            
            userSummary.innerHTML = `
                <div class="user-avatar">${icon}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.username}</div>
                    <div class="user-role">${roleText}</div>
                </div>
            `;
        }
    }

    renderStats() {
        const stats = this.getSystemStats();
        
        return `
            <h4 class="section-title">Resumen</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-icon">💊</div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.total}</span>
                        <span class="stat-label">Medicamentos</span>
                    </div>
                </div>
                <div class="stat-item warning">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.lowStock}</span>
                        <span class="stat-label">Stock Bajo</span>
                    </div>
                </div>
                <div class="stat-item danger">
                    <div class="stat-icon">⏰</div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.expiring}</span>
                        <span class="stat-label">Por Vencer</span>
                    </div>
                </div>
                <div class="stat-item success">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <span class="stat-number">${this.formatCurrency(stats.totalValue)}</span>
                        <span class="stat-label">Valor Total</span>
                    </div>
                </div>
            </div>
        `;
    }

    getSystemStats() {
        try {
            const medicines = window.StorageManager ? StorageManager.getMedicines() : [];
            const total = medicines.length;
            
            let lowStock = 0, expiring = 0, totalValue = 0;
            const now = new Date();
            const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            medicines.forEach(med => {
                if (med.quantity <= med.minStock) lowStock++;
                
                const expiryDate = new Date(med.expiryDate);
                if (expiryDate <= thirtyDays && expiryDate >= now) expiring++;
                
                totalValue += med.quantity * 10;
            });

            return { total, lowStock, expiring, totalValue };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { total: 0, lowStock: 0, expiring: 0, totalValue: 0 };
        }
    }

    updateStats() {
        const statsContainer = this.element?.querySelector('#sidebarStats');
        if (statsContainer) {
            statsContainer.innerHTML = this.renderStats();
        }

        const alerts = window.alertSystem?.notifications || [];
        const criticalAlerts = alerts.filter(n => n.priority === 'high').length;
        const alertBadge = this.element?.querySelector('#alertBadge');
        
        if (alertBadge) {
            if (criticalAlerts > 0) {
                alertBadge.textContent = criticalAlerts;
                alertBadge.style.display = 'flex';
            } else {
                alertBadge.style.display = 'none';
            }
        }
    }

    formatCurrency(amount) {
        if (window.Helpers) {
            return Helpers.formatCurrency(amount);
        }
        return '$' + amount.toLocaleString();
    }

    refresh() {
        this.updateUserInfo();
        this.updateStats();
    }

    show() {
        this.element.classList.remove('hidden');
    }

    hide() {
        this.element.classList.add('hidden');
    }
}

// CSS completo para sidebar
const sidebarStyles = `
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 260px;
    height: 100vh;
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    color: white;
    z-index: 90;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.sidebar.collapsed {
    width: 70px;
}

.sidebar.hidden {
    transform: translateX(-100%);
}

.sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
}

.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.logo-icon {
    font-size: 1.5rem;
}

.logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    transition: opacity 0.3s ease;
}

.sidebar.collapsed .logo-text {
    opacity: 0;
    width: 0;
    overflow: hidden;
}

.sidebar-toggle {
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.25rem;
    transition: background-color 0.2s ease;
}

.sidebar-toggle:hover {
    background: rgba(255,255,255,0.2);
}

.sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
}

.nav-menu {
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-item {
    margin-bottom: 0.25rem;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
}

.nav-link:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.nav-item.active .nav-link {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border-right: 3px solid #60a5fa;
}

.nav-icon {
    font-size: 1.25rem;
    min-width: 20px;
    text-align: center;
}

.nav-text {
    transition: opacity 0.3s ease;
    white-space: nowrap;
}

.sidebar.collapsed .nav-text {
    opacity: 0;
    width: 0;
    overflow: hidden;
}

.nav-badge {
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    margin-left: auto;
    min-width: 20px;
    text-align: center;
    transition: opacity 0.3s ease;
}

.sidebar.collapsed .nav-badge {
    opacity: 0;
}

.sidebar-stats {
    padding: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: opacity 0.3s ease;
}

.sidebar.collapsed .section-title {
    opacity: 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.sidebar.collapsed .stats-grid {
    grid-template-columns: 1fr;
}

.stat-item {
    background: rgba(255,255,255,0.05);
    padding: 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.stat-item.warning {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.2);
}

.stat-item.danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.stat-item.success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
}

.stat-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.stat-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
}

.stat-number {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    line-height: 1;
}

.stat-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar.collapsed .stat-content {
    display: none;
}

.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.1);
}

.user-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.25rem;
}

.user-details {
    flex: 1;
    min-width: 0;
    transition: opacity 0.3s ease;
}

.sidebar.collapsed .user-details {
    opacity: 0;
    width: 0;
    overflow: hidden;
}

.user-name {
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
}

/* Ajustes para contenido principal */
body:has(.sidebar:not(.collapsed):not(.hidden)) .main-content {
    margin-left: 260px;
    transition: margin-left 0.3s ease;
}

body:has(.sidebar.collapsed:not(.hidden)) .main-content {
    margin-left: 70px;
}

/* Responsive */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }
    
    .sidebar.mobile-open {
        transform: translateX(0);
    }
    
    body:has(.sidebar) .main-content {
        margin-left: 0 !important;
    }
    
    .stats-grid {
        grid-template-columns: 1fr !important;
    }
}
`;

// Agregar estilos
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = sidebarStyles;
    document.head.appendChild(style);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
});

// Exportar
if (typeof window !== 'undefined') {
    window.Sidebar = Sidebar;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}