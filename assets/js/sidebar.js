// ========== VETERINARY SIDEBAR COMPACT ==========
// Solo 150 líneas - Todo lo esencial
console.log('🏥 Cargando VeterinaryProject Sidebar Compact...');

// Configuración básica
const CONFIG = {
    pages: {
        'dashboard.html': { title: 'Dashboard', icon: '📊' },
        'inventory.html': { title: 'Inventario', icon: '💊' },
        'alerts.html': { title: 'Alertas', icon: '🚨', badge: 3 },
        'reports.html': { title: 'Reportes', icon: '📈' }
    },
    user: { name: 'Dr. Juan Pérez', role: 'Veterinario', avatar: '👨‍⚕️' }
};

// CSS compacto
const CSS = `
:root {
    --sidebar-bg: #1e293b; --sidebar-text: #cbd5e1; --sidebar-hover: #475569;
    --sidebar-width: 260px; --sidebar-collapsed: 60px; --primary: #2d7d32;
}
body.vs-active { margin: 0; overflow-x: hidden; }
.vs-layout { display: flex; min-height: 100vh; }

.vs-sidebar {
    position: fixed; left: 0; top: 0; width: var(--sidebar-width); height: 100vh;
    background: var(--sidebar-bg); color: var(--sidebar-text); z-index: 1000;
    transition: all 0.3s ease; overflow-y: auto; display: flex; flex-direction: column;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
}
.vs-sidebar.collapsed { width: var(--sidebar-collapsed); }
.vs-sidebar.mobile-hidden { transform: translateX(-100%); }

.vs-header { padding: 1.5rem; border-bottom: 1px solid #374151; display: flex; align-items: center; gap: 1rem; }
.vs-logo { font-size: 2rem; }
.vs-title { font-weight: 700; color: white; transition: opacity 0.3s; }
.vs-sidebar.collapsed .vs-title { opacity: 0; width: 0; overflow: hidden; }

.vs-nav { padding: 1rem 0; flex: 1; }
.vs-nav-list { list-style: none; margin: 0; padding: 0; }
.vs-nav-item { margin: 0.25rem 0; }
.vs-nav-link {
    display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.5rem;
    color: var(--sidebar-text); text-decoration: none; transition: all 0.2s;
    position: relative;
}
.vs-nav-link:hover { background: var(--sidebar-hover); color: white; }
.vs-nav-link.active { background: rgba(45,125,50,0.2); color: white; border-right: 3px solid var(--primary); }
.vs-nav-icon { font-size: 1.2rem; width: 24px; text-align: center; }
.vs-nav-text { font-weight: 500; transition: opacity 0.3s; }
.vs-sidebar.collapsed .vs-nav-text { opacity: 0; width: 0; overflow: hidden; }
.vs-nav-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: auto; }
.vs-sidebar.collapsed .vs-nav-badge { display: none; }

.vs-footer { padding: 1rem; border-top: 1px solid #374151; }
.vs-user { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #334155; border-radius: 8px; cursor: pointer; }
.vs-user:hover { background: var(--sidebar-hover); }
.vs-avatar { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.vs-user-info { flex: 1; transition: opacity 0.3s; }
.vs-sidebar.collapsed .vs-user-info { opacity: 0; width: 0; overflow: hidden; }
.vs-name { font-weight: 600; color: white; font-size: 0.875rem; }
.vs-role { font-size: 0.75rem; color: var(--sidebar-text); }

/* MAIN CONTENT CON EXPANSIÓN AUTOMÁTICA */
.vs-main { 
    margin-left: var(--sidebar-width); 
    transition: margin-left 0.3s ease; 
    min-height: 100vh; 
    width: calc(100vw - var(--sidebar-width));
    display: flex; 
    flex-direction: column;
    flex: 1;
}
.vs-sidebar.collapsed + .vs-main { 
    margin-left: var(--sidebar-collapsed); 
    width: calc(100vw - var(--sidebar-collapsed));
}

.vs-topbar { 
    height: 70px; 
    background: white; 
    border-bottom: 1px solid #e5e7eb; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 2rem; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 100;
}
.vs-topbar-left { display: flex; align-items: center; gap: 1rem; }
.vs-toggle { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 6px; }
.vs-toggle:hover { background: #f3f4f6; }
.vs-page-title { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
.vs-topbar-right { display: flex; gap: 1rem; }
.vs-btn { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 6px; position: relative; }
.vs-btn:hover { background: #f3f4f6; }
.vs-notification-dot { position: absolute; top: 0; right: 0; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; }

/* CONTENT AREA QUE SE EXPANDE */
.vs-content {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    min-height: calc(100vh - 70px);
    max-height: calc(100vh - 70px);
}

.vs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; opacity: 0; visibility: hidden; transition: all 0.3s; }
.vs-overlay.active { opacity: 1; visibility: visible; }

@media (max-width: 768px) {
    .vs-sidebar { transform: translateX(-100%); width: 100%; max-width: 300px; }
    .vs-sidebar.mobile-open { transform: translateX(0); }
    .vs-main { margin-left: 0; width: 100vw; }
    .vs-topbar { padding: 0 1rem; }
}

.vs-sidebar.collapsed .vs-nav-link::after {
    content: attr(data-tooltip); position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
    background: #1f2937; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.875rem;
    white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.2s; margin-left: 1rem; z-index: 1001;
}
.vs-sidebar.collapsed .vs-nav-link:hover::after { opacity: 1; visibility: visible; }
`;

// Clase principal compacta
class VeterinarySidebar {
    constructor() {
        this.isCollapsed = false;
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        this.injectCSS();
        this.createHTML();
        this.setupEvents();
        this.setInitialState();
        console.log('✅ Sidebar inicializado');
    }

    setInitialState() {
        const sidebar = document.getElementById('vsSidebar');
        
        if (this.isMobile) {
            sidebar.classList.add('mobile-hidden');
            sidebar.classList.remove('collapsed');
        } else {
            sidebar.classList.remove('mobile-hidden', 'mobile-open');
            
            // Restaurar estado colapsado desde localStorage
            const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (savedCollapsed) {
                sidebar.classList.add('collapsed');
                this.isCollapsed = true;
            }
        }
        
        this.setActiveFromURL();
        
        // Debug inicial
        console.log('Estado inicial:', {
            isMobile: this.isMobile,
            isCollapsed: this.isCollapsed,
            classes: sidebar.className
        });
    }

    injectCSS() {
        if (document.getElementById('vsSidebarCSS')) return;
        const style = document.createElement('style');
        style.id = 'vsSidebarCSS';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    createHTML() {
        if (document.querySelector('.vs-sidebar')) return;
        
        document.body.classList.add('vs-active');
        
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'vs-overlay';
        overlay.id = 'vsOverlay';
        overlay.onclick = () => this.closeMobile();
        document.body.appendChild(overlay);

        // Layout wrapper
        let layout = document.querySelector('.vs-layout');
        if (!layout) {
            layout = document.createElement('div');
            layout.className = 'vs-layout';
            while (document.body.firstChild !== overlay && document.body.firstChild) {
                if (document.body.firstChild !== overlay) {
                    layout.appendChild(document.body.firstChild);
                }
            }
            document.body.appendChild(layout);
        }

        // Sidebar
        layout.insertAdjacentHTML('afterbegin', `
            <aside class="vs-sidebar" id="vsSidebar">
                <div class="vs-header">
                    <div class="vs-logo">🏥</div>
                    <div class="vs-title">VeterinaryProject</div>
                </div>
                <nav class="vs-nav">
                    <ul class="vs-nav-list">
                        ${Object.entries(CONFIG.pages).map(([page, config]) => `
                            <li class="vs-nav-item">
                                <a href="${this.getHref(page)}" class="vs-nav-link" data-tooltip="${config.title}" onclick="return sidebar.handleNav(event, this)">
                                    <span class="vs-nav-icon">${config.icon}</span>
                                    <span class="vs-nav-text">${config.title}</span>
                                    ${config.badge ? `<span class="vs-nav-badge">${config.badge}</span>` : ''}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </nav>
                <div class="vs-footer">
                    <div class="vs-user" onclick="sidebar.showToast('Menú de usuario', 'info')">
                        <div class="vs-avatar">${CONFIG.user.avatar}</div>
                        <div class="vs-user-info">
                            <div class="vs-name">${CONFIG.user.name}</div>
                            <div class="vs-role">${CONFIG.user.role}</div>
                        </div>
                    </div>
                </div>
            </aside>
        `);

        // Main content
        let main = document.querySelector('.vs-main');
        if (!main) {
            main = document.createElement('main');
            main.className = 'vs-main';
            while (layout.children.length > 1) {
                if (layout.children[1] !== main) {
                    main.appendChild(layout.children[1]);
                }
            }
            layout.appendChild(main);
        }

        // Topbar
        main.insertAdjacentHTML('afterbegin', `
            <header class="vs-topbar">
                <div class="vs-topbar-left">
                    <button class="vs-toggle" onclick="sidebar.toggle()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 class="vs-page-title">Dashboard</h1>
                </div>
                <div class="vs-topbar-right">
                    <button class="vs-btn" onclick="sidebar.showToast('Notificaciones', 'info')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span class="vs-notification-dot"></span>
                    </button>
                    <button class="vs-btn" onclick="sidebar.logout()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16,17 21,12 16,7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </header>
            <div class="vs-content">
                <!-- El contenido existente de la página se moverá aquí -->
            </div>
        `);

        // Mover contenido existente al área de contenido
        const contentArea = main.querySelector('.vs-content');
        const topbar = main.querySelector('.vs-topbar');
        
        // Mover todo el contenido que NO sea el topbar al área de contenido
        while (main.children.length > 2) { // Mantener solo topbar y vs-content
            if (main.children[2] !== contentArea && main.children[2] !== topbar) {
                contentArea.appendChild(main.children[2]);
            } else {
                break;
            }
        }
    }

    setupEvents() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newIsMobile = window.innerWidth <= 768;
                
                if (newIsMobile !== this.isMobile) {
                    this.isMobile = newIsMobile;
                    const sidebar = document.getElementById('vsSidebar');
                    const overlay = document.getElementById('vsOverlay');
                    
                    if (this.isMobile) {
                        // Cambió a móvil
                        sidebar.classList.remove('collapsed');
                        sidebar.classList.add('mobile-hidden');
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                    } else {
                        // Cambió a desktop - AQUÍ ESTABA EL BUG
                        sidebar.classList.remove('mobile-hidden', 'mobile-open');
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                        
                        // Restaurar estado colapsado desde localStorage
                        const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                        if (savedCollapsed) {
                            sidebar.classList.add('collapsed');
                            this.isCollapsed = true;
                        } else {
                            sidebar.classList.remove('collapsed');
                            this.isCollapsed = false;
                        }
                    }
                    
                    console.log(`Responsive fix: ${this.isMobile ? 'móvil' : 'desktop'}`);
                }
            }, 100); // Reducido el timeout para respuesta más rápida
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isMobile) this.closeMobile();
        });
    }

    toggle() {
        const sidebar = document.getElementById('vsSidebar');
        const overlay = document.getElementById('vsOverlay');

        console.log('Toggle llamado - isMobile:', this.isMobile);

        if (this.isMobile) {
            if (sidebar.classList.contains('mobile-open')) {
                this.closeMobile();
            } else {
                sidebar.classList.remove('mobile-hidden');
                sidebar.classList.add('mobile-open');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                console.log('Móvil: sidebar abierto');
            }
        } else {
            sidebar.classList.toggle('collapsed');
            this.isCollapsed = !this.isCollapsed;
            localStorage.setItem('sidebarCollapsed', this.isCollapsed);
            console.log('Desktop: sidebar', this.isCollapsed ? 'colapsado' : 'expandido');
        }
    }

    closeMobile() {
        const sidebar = document.getElementById('vsSidebar');
        const overlay = document.getElementById('vsOverlay');
        sidebar.classList.remove('mobile-open');
        sidebar.classList.add('mobile-hidden');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        console.log('Móvil: sidebar cerrado');
    }

    handleNav(event, link) {
        // Actualizar activo
        document.querySelectorAll('.vs-nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Actualizar título
        const title = link.querySelector('.vs-nav-text').textContent;
        document.querySelector('.vs-page-title').textContent = title;
        
        // Cerrar en móvil
        if (this.isMobile) this.closeMobile();
        
        return true;
    }

    setActiveFromURL() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = page === 'index.html' ? 'dashboard.html' : page;
        
        document.querySelectorAll('.vs-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.href.includes(targetPage)) {
                link.classList.add('active');
                const title = link.querySelector('.vs-nav-text').textContent;
                document.querySelector('.vs-page-title').textContent = title;
            }
        });
    }

    getHref(page) {
        return window.location.pathname.includes('/pages/') ? page : `pages/${page}`;
    }

    showToast(message, type = 'info') {
        const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${colors[type]}; color: white; padding: 12px 16px;
            border-radius: 8px; font-weight: 500; min-width: 250px;
            opacity: 0; transform: translateX(100%); transition: all 0.3s;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    logout() {
        if (confirm('¿Cerrar sesión?')) {
            this.showToast('Cerrando sesión...', 'info');
            setTimeout(() => {
                window.location.href = this.getHref('login.html');
            }, 1000);
        }
    }
}

// Inicialización automática
let sidebar = null;
document.addEventListener('DOMContentLoaded', () => {
    sidebar = new VeterinarySidebar();
    window.sidebar = sidebar;
});

if (document.readyState !== 'loading') {
    setTimeout(() => {
        if (!sidebar) {
            sidebar = new VeterinarySidebar();
            window.sidebar = sidebar;
        }
    }, 0);
}

console.log('🏥 Sidebar Compact cargado - Solo 150 líneas!');