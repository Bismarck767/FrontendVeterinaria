// Componente Modal para VeterinaryProject
class Modal {
    constructor(id, options = {}) {
        this.id = id;
        this.element = document.getElementById(id);
        this.options = {
            closeOnOverlay: true,
            closeOnEscape: true,
            showCloseButton: true,
            ...options
        };
        this.isOpen = false;
        this.init();
    }

    // Inicializar modal
    init() {
        if (!this.element) {
            console.warn(`Modal con ID ${this.id} no encontrado`);
            return;
        }

        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón de cerrar (X)
        const closeBtn = this.element.querySelector('.close');
        if (closeBtn && this.options.showCloseButton) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Cerrar al hacer clic en el overlay
        if (this.options.closeOnOverlay) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }

        // Cerrar con tecla Escape
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        // Botones de cancelar
        const cancelBtns = this.element.querySelectorAll('[data-modal-cancel]');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });
    }

    // Abrir modal
    open() {
        if (!this.element) return;

        this.element.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
        this.isOpen = true;

        // Enfocar el primer input si existe
        const firstInput = this.element.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        // Disparar evento personalizado
        this.element.dispatchEvent(new CustomEvent('modal:open', {
            detail: { modal: this }
        }));
    }

    // Cerrar modal
    close() {
        if (!this.element) return;

        this.element.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll del body
        this.isOpen = false;

        // Limpiar formulario si existe
        const form = this.element.querySelector('form');
        if (form) {
            form.reset();
            // Limpiar errores de validación
            if (window.Validators) {
                Validators.clearFormErrors(form);
            }
        }

        // Disparar evento personalizado
        this.element.dispatchEvent(new CustomEvent('modal:close', {
            detail: { modal: this }
        }));
    }

    // Alternar estado del modal
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    // Cambiar título del modal
    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-header h3, .modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Cambiar contenido del modal
    setContent(content) {
        const contentElement = this.element.querySelector('.modal-body, .modal-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        }
    }

    // Mostrar loading en el modal
    showLoading(message = 'Cargando...') {
        const content = `
            <div class="text-center">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        this.setContent(content);
    }

    // Obtener datos del formulario del modal
    getFormData() {
        const form = this.element.querySelector('form');
        if (!form) return null;

        return new FormData(form);
    }

    // Establecer datos en el formulario del modal
    setFormData(data) {
        const form = this.element.querySelector('form');
        if (!form) return;

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    // Validar formulario del modal
    validateForm(validationRules) {
        const form = this.element.querySelector('form');
        if (!form || !window.Validators) return { isValid: true, errors: {} };

        return Validators.validateForm(form, validationRules);
    }

    // Destruir modal
    destroy() {
        if (this.element) {
            this.close();
            this.element.remove();
        }
    }
}

// Manager para manejar múltiples modales
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    // Inicializar manager
    init() {
        this.autoRegisterModals();
        this.setupGlobalListeners();
    }

    // Registrar automáticamente todos los modales en el DOM
    autoRegisterModals() {
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(element => {
            if (element.id) {
                this.register(element.id);
            }
        });
    }

    // Configurar listeners globales
    setupGlobalListeners() {
        // Botones que abren modales
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-target]');
            if (trigger) {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal-target');
                this.open(modalId);
            }
        });
    }

    // Registrar un modal
    register(id, options = {}) {
        if (!this.modals.has(id)) {
            const modal = new Modal(id, options);
            this.modals.set(id, modal);
        }
        return this.modals.get(id);
    }

    // Obtener un modal
    get(id) {
        return this.modals.get(id);
    }

    // Abrir un modal
    open(id) {
        const modal = this.get(id);
        if (modal) {
            // Cerrar otros modales abiertos
            this.closeAll();
            modal.open();
        } else {
            console.warn(`Modal ${id} no está registrado`);
        }
    }

    // Cerrar un modal
    close(id) {
        const modal = this.get(id);
        if (modal) {
            modal.close();
        }
    }

    // Cerrar todos los modales
    closeAll() {
        this.modals.forEach(modal => {
            if (modal.isOpen) {
                modal.close();
            }
        });
    }

    // Crear modal dinámicamente
    create(id, content, options = {}) {
        // Remover modal existente si existe
        this.destroy(id);

        // Crear elemento del modal
        const modalElement = document.createElement('div');
        modalElement.id = id;
        modalElement.className = 'modal';
        modalElement.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${options.title || 'Modal'}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.showFooter !== false ? `
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancelar</button>
                        ${options.confirmText ? `<button type="button" class="btn btn-primary" data-modal-confirm>${options.confirmText}</button>` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modalElement);

        // Registrar y abrir
        const modal = this.register(id, options);
        
        // Configurar botón de confirmación
        if (options.onConfirm) {
            const confirmBtn = modalElement.querySelector('[data-modal-confirm]');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    options.onConfirm(modal);
                });
            }
        }

        return modal;
    }

    // Mostrar modal de confirmación
    confirm(message, title = 'Confirmar', options = {}) {
        return new Promise((resolve) => {
            const modalId = 'confirmModal';
            const content = `<p>${message}</p>`;
            
            const modal = this.create(modalId, content, {
                title,
                confirmText: options.confirmText || 'Confirmar',
                onConfirm: () => {
                    resolve(true);
                    modal.close();
                },
                ...options
            });

            // Resolver con false si se cierra sin confirmar
            modal.element.addEventListener('modal:close', () => {
                resolve(false);
                setTimeout(() => this.destroy(modalId), 300);
            }, { once: true });

            modal.open();
        });
    }

    // Mostrar modal de alerta
    alert(message, title = 'Información', type = 'info') {
        return new Promise((resolve) => {
            const modalId = 'alertModal';
            const icon = {
                'info': 'ℹ️',
                'success': '✅',
                'warning': '⚠️',
                'error': '❌'
            }[type] || 'ℹ️';
            
            const content = `
                <div class="text-center">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
                    <p>${message}</p>
                </div>
            `;
            
            const modal = this.create(modalId, content, {
                title,
                confirmText: 'Aceptar',
                showFooter: true,
                onConfirm: () => {
                    resolve(true);
                    modal.close();
                }
            });

            modal.element.addEventListener('modal:close', () => {
                resolve(true);
                setTimeout(() => this.destroy(modalId), 300);
            }, { once: true });

            modal.open();
        });
    }

    // Destruir un modal
    destroy(id) {
        const modal = this.get(id);
        if (modal) {
            modal.destroy();
            this.modals.delete(id);
        }
    }

    // Destruir todos los modales
    destroyAll() {
        this.modals.forEach((modal, id) => {
            modal.destroy();
        });
        this.modals.clear();
    }
}

// Inicializar manager global
document.addEventListener('DOMContentLoaded', () => {
    window.modalManager = new ModalManager();
});

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.Modal = Modal;
    window.ModalManager = ModalManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Modal, ModalManager };
}