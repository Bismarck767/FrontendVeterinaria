// ========== NAVEGACIÓN GLOBAL RESPONSIVE MEJORADA ==========
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

// ========== CSS AUTOMÁTICO MEJORADO ==========
// Agregar CSS si no existe
if (!document.getElementById('globalNavStyles')) {
    const style = document.createElement('style');
    style.id = 'globalNavStyles';
    style.textContent = `
        /* ========== NAVEGACIÓN RESPONSIVE GLOBAL MEJORADA ========== */
        .nav {
            position: relative;
            background: #1f2937; /* FONDO OSCURO FIJO */
            border-bottom: 1px solid #374151;
            padding: 1rem;
            min-height: 60px; /* ALTURA MÍNIMA GARANTIZADA */
            display: flex;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* SOMBRA SUTIL */
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
            border-radius: 4px; /* BORDES REDONDEADOS */
            transition: background 0.3s ease;
        }

        .nav-toggle:hover {
            background: rgba(75, 85, 99, 0.3); /* HOVER SUTIL */
        }

        .hamburger-line {
            width: 25px;
            height: 3px;
            background: #f9fafb; /* LÍNEAS BLANCAS */
            border-radius: 2px;
            transition: 0.3s ease;
        }

        /* Lista de navegación */
        .nav-list {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
            gap: 1rem; /* ESPACIO REDUCIDO */
            width: 100%;
        }

        .nav-link {
            display: block;
            padding: 0.75rem 1.5rem; /* PADDING MEJORADO */
            text-decoration: none;
            color: #d1d5db; /* COLOR CLARO */
            font-weight: 500;
            transition: all 0.3s ease;
            border-radius: 8px; /* BORDES REDONDEADOS */
            background: rgba(55, 65, 81, 0.3); /* FONDO SEMI-TRANSPARENTE */
            border: 1px solid transparent;
        }

        .nav-link:hover {
            color: #60a5fa;
            background: #374151;
            transform: translateY(-2px); /* EFECTO ELEVACIÓN */
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .nav-link.active {
            color: #60a5fa;
            background: #374151;
            border-color: #60a5fa;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2); /* GLOW EFFECT */
        }

        /* ========== RESPONSIVE MEJORADO ========== */
        @media (max-width: 768px) {
            .nav {
                flex-direction: column;
                align-items: stretch;
                padding: 1rem;
            }
            
            /* Mostrar botón hamburguesa */
            .nav-toggle {
                display: flex;
                position: absolute;
                top: 1rem;
                right: 1rem;
                transform: none;
            }
            
            /* Ocultar lista por defecto */
            .nav-list {
                display: none;
                width: 100%;
                flex-direction: column;
                gap: 0.5rem;
                margin-top: 3rem; /* ESPACIO PARA LA HAMBURGUESA */
                padding: 1rem 0;
                border-top: 1px solid #374151;
                background: #1f2937; /* FONDO CONSISTENTE */
            }
            
            /* Mostrar lista cuando está activa */
            .nav-list.active {
                display: flex;
                animation: slideDown 0.3s ease-out; /* ANIMACIÓN SUAVE */
            }
            
            /* Ajustar enlaces en móvil */
            .nav-link {
                padding: 1rem;
                margin: 0;
                text-align: center;
                background: rgba(55, 65, 81, 0.5);
                border: 1px solid #374151;
            }
            
            .nav-link.active {
                background: #2563eb;
                color: white;
                border-color: #3b82f6;
                box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
            }
            
            .nav-link:hover {
                background: #374151;
                transform: none; /* SIN ELEVACIÓN EN MÓVIL */
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

        /* ANIMACIÓN PARA EL MENÚ MÓVIL */
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* MODO OSCURO MEJORADO */
        @media (prefers-color-scheme: dark) {
            .nav {
                background: #111827; /* MÁS OSCURO */
                border-bottom-color: #374151;
            }
            
            .nav-link {
                background: rgba(31, 41, 55, 0.8);
            }
            
            .nav-link:hover {
                background: #1f2937;
            }
            
            .nav-link.active {
                background: #1e40af;
                color: #dbeafe;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS de navegación mejorado inyectado');
}