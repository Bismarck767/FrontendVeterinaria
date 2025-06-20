// ========== NAVEGACIÓN GLOBAL RESPONSIVE ==========
// Agrega este script en TODAS tus páginas HTML

// Función para la hamburguesa
function toggleMobileNav() {
    const navList = document.getElementById('navList');
    const navToggle = document.querySelector('.nav-toggle');
    
    navList.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Inicialización automática cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧭 Inicializando navegación global...');
    
    // 1. Arreglar clase 'active' automáticamente
    setActiveNavLink();
    
    // 2. Configurar eventos de la hamburguesa
    setupMobileNavigation();
    
    // 3. Configurar eventos de redimensionado
    setupResponsiveEvents();
});

// ========== FUNCIONES PRINCIPALES ==========

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📍 Página actual:', currentPage);
    
    // Remover todas las clases active existentes
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mapeo de páginas a enlaces
    const pageMap = {
        'dashboard.html': 'dashboard.html',
        'inventory.html': 'inventory.html', 
        'alerts.html': 'alerts.html',
        'reports.html': 'reports.html',
        '': 'dashboard.html', // Para index.html o raíz
        'index.html': 'dashboard.html'
    };
    
    const targetPage = pageMap[currentPage] || 'dashboard.html';
    
    // Agregar clase active al enlace correcto
    const targetLink = document.querySelector(`a[href="${targetPage}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
        console.log('✅ Clase active aplicada a:', targetPage);
    }
}

function setupMobileNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navList = document.getElementById('navList');
    const navToggle = document.querySelector('.nav-toggle');
    
    // Cerrar menú al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && navList.classList.contains('active')) {
            navList.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

function setupResponsiveEvents() {
    const navList = document.getElementById('navList');
    const navToggle = document.querySelector('.nav-toggle');
    
    // Cerrar menú al redimensionar ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navList.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

// ========== CSS AUTOMÁTICO ==========
// Agregar CSS si no existe
if (!document.getElementById('globalNavStyles')) {
    const style = document.createElement('style');
    style.id = 'globalNavStyles';
    style.textContent = `
        /* ========== NAVEGACIÓN RESPONSIVE GLOBAL ========== */
        .nav {
            position: relative;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 0 1rem;
        }

        /* Botón hamburguesa */
        .nav-toggle {
            display: none;
            flex-direction: column;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            position: absolute;
            top: 50%;
            right: 1rem;
            transform: translateY(-50%);
            z-index: 1001;
        }

        .hamburger-line {
            width: 25px;
            height: 3px;
            background: #374151;
            border-radius: 2px;
            transition: 0.3s ease;
        }

        /* Lista de navegación */
        .nav-list {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
            gap: 2rem;
        }

        .nav-link {
            display: block;
            padding: 1rem 0;
            text-decoration: none;
            color: #6b7280;
            font-weight: 500;
            transition: color 0.2s;
            border-bottom: 2px solid transparent;
        }

        .nav-link:hover {
            color: #3b82f6;
        }

        .nav-link.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
            /* Mostrar botón hamburguesa */
            .nav-toggle {
                display: flex;
            }
            
            /* Ocultar lista por defecto */
            .nav-list {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                flex-direction: column;
                gap: 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                border-top: 1px solid #e5e7eb;
            }
            
            /* Mostrar lista cuando está activa */
            .nav-list.active {
                display: flex;
            }
            
            /* Ajustar enlaces en móvil */
            .nav-link {
                padding: 1rem;
                border-bottom: 1px solid #f3f4f6;
                border-left: none;
                margin: 0;
            }
            
            .nav-link.active {
                background: #eff6ff;
                border-bottom: 1px solid #f3f4f6;
                color: #2563eb;
            }
            
            .nav-link:hover {
                background: #f8fafc;
            }
            
            /* Animación hamburguesa cuando está activo */
            .nav-toggle.active .hamburger-line:nth-child(1) {
                transform: rotate(45deg) translate(6px, 6px);
            }
            
            .nav-toggle.active .hamburger-line:nth-child(2) {
                opacity: 0;
            }
            
            .nav-toggle.active .hamburger-line:nth-child(3) {
                transform: rotate(-45deg) translate(6px, -6px);
            }
        }

        /* Modo oscuro */
        @media (prefers-color-scheme: dark) {
            .nav {
                background: #1f2937;
                border-bottom-color: #374151;
            }
            
            .hamburger-line {
                background: #f9fafb;
            }
            
            .nav-list {
                background: #1f2937;
                border-top-color: #374151;
            }
            
            .nav-link {
                color: #d1d5db;
            }
            
            .nav-link:hover {
                color: #60a5fa;
                background: #374151;
            }
            
            .nav-link.active {
                color: #60a5fa;
                border-bottom-color: #60a5fa;
                background: #374151;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS de navegación inyectado');
}