// ========== INVENTORY.JS SIMPLIFICADO ==========
// Ya no maneja ApiService propio, usa GlobalApiService

// ========== TIPOS DE ANIMALES ORGANIZADOS ==========
const ANIMAL_CATEGORIES = {
    'Mascotas Comunes': ['perros', 'gatos', 'conejos', 'hamsters', 'aves-domesticas'],
    'Animales de Granja': ['vacas', 'cerdos', 'cabras', 'ovejas', 'pollos', 'gallinas', 'caballos'],
    'Aves': ['canarios', 'loros', 'periquitos', 'patos', 'gansos', 'pavos'],
    'Reptiles y Anfibios': ['tortugas', 'iguanas', 'serpientes', 'ranas', 'sapos'],
    'Acuáticos': ['peces-ornamentales', 'peces-marinos', 'peces-agua-dulce'],
    'Otros': ['general', 'erizos', 'hurones']
};

// ========== PÁGINA DE INVENTARIO ==========
class InventoryPage {
    constructor() {
        this.medicines = [];
        this.proveedores = [];
        this.filteredMedicines = [];
        this.currentSort = { field: null, direction: 'asc' };
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.isLoading = false;
    }

    async init() {
        console.log('🚀 Inicializando Inventory...');
        
        // Verificar que GlobalApiService esté disponible
        if (typeof GlobalApiService === 'undefined') {
            console.error('❌ GlobalApiService no disponible');
            this.showError('Error: Servicio API no disponible');
            return;
        }
        
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadInitialData();
        this.handleUrlActions();
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

    // ========== CARGA DE DATOS ==========
    async loadInitialData() {
        try {
            this.showLoading(true);
            await Promise.all([
                this.loadMedicamentos(),
                this.loadProveedores()
            ]);
            this.loadAnimalTypes();
            this.applyFilters();
            this.updateStats();
            GlobalHelpers.showToast('Datos cargados correctamente', 'success');
        } catch (error) {
            console.error('Error loading initial data:', error);
            GlobalHelpers.showToast('Error al cargar los datos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadMedicamentos() {
        try {
            this.medicines = await GlobalApiService.getMedicamentos();
        } catch (error) {
            console.error('Error loading medicamentos:', error);
            this.medicines = [];
            GlobalHelpers.showToast('Error cargando medicamentos', 'error');
        }
    }

    async loadProveedores() {
        try {
            this.proveedores = await GlobalApiService.getProveedores();
            this.loadProvidersInSelect();
        } catch (error) {
            console.error('Error loading proveedores:', error);
            this.proveedores = this.getDemoProviders();
            this.loadProvidersInSelect();
            GlobalHelpers.showToast('Error cargando proveedores', 'error');
        }
    }

    loadAnimalTypes() {
        this.loadAnimalTypesInFilter();
        this.loadAnimalTypesInModal();
    }

    loadAnimalTypesInFilter() {
        const filterTypeSelect = document.getElementById('filterType');
        if (!filterTypeSelect) return;
        
        filterTypeSelect.innerHTML = '<option value="">Todos los tipos</option>';
        
        const commonTypes = ['perros', 'gatos', 'aves-domesticas', 'vacas', 'cerdos', 'caballos', 'peces-ornamentales'];
        commonTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${this.getTypeIcon(type)} ${this.formatAnimalName(type)}`;
            filterTypeSelect.appendChild(option);
        });
        
        const otherOption = document.createElement('option');
        otherOption.value = 'otros';
        otherOption.textContent = '🐾 Otros animales';
        filterTypeSelect.appendChild(otherOption);
    }

    loadAnimalTypesInModal() {
        const medTypeSelect = document.getElementById('medType');
        if (!medTypeSelect) return;

        medTypeSelect.innerHTML = '<option value="">Seleccionar tipo de animal</option>';
        
        Object.entries(ANIMAL_CATEGORIES).forEach(([category, types]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `${this.getTypeIcon(type)} ${this.formatAnimalName(type)}`;
                optgroup.appendChild(option);
            });
            
            medTypeSelect.appendChild(optgroup);
        });
    }

    loadProvidersInSelect() {
        const supplierSelect = document.getElementById('medSupplier');
        if (!supplierSelect) return;
        
        supplierSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
        this.proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id;
            option.textContent = proveedor.nombre;
            supplierSelect.appendChild(option);
        });
    }

    getDemoProviders() {
        return [
            { id: 1, nombre: 'VetPharma' },
            { id: 2, nombre: 'HealthyPets' },
            { id: 3, nombre: 'VetSupply' }
        ];
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Botones principales
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('addMedBtn')?.addEventListener('click', () => this.showAddModal());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

        // Filtros
        document.getElementById('searchInput')?.addEventListener('input', 
            this.debounce(() => this.applyFilters(), 300));
        document.getElementById('filterType')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterStatus')?.addEventListener('change', () => this.applyFilters());

        // Ordenamiento
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sort));
        });

        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('medicineModal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('medicineForm');

        closeBtn?.addEventListener('click', () => this.closeModal());
        cancelBtn?.addEventListener('click', () => this.closeModal());
        form?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========== LOGOUT ==========
    async logout() {
        if (!confirm('¿Estás seguro que quieres cerrar sesión?')) return;
        
        try {
            await GlobalApiService.logout();
            GlobalHelpers.showToast('Cerrando sesión...', 'info');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = 'login.html';
        }
    }

    // ========== UTILIDADES ==========
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
                    <h2>Error en Inventario</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
    }

    formatAnimalName(type) {
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    // ========== FILTROS Y BÚSQUEDA ==========
    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('filterType')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';

        this.filteredMedicines = this.medicines.filter(med => {
            const matchesSearch = !searchTerm || 
                med.nombre.toLowerCase().includes(searchTerm) ||
                med.codigo.toLowerCase().includes(searchTerm);
            
            let matchesType = true;
            if (typeFilter) {
                if (typeFilter === 'otros') {
                    const commonTypes = ['perros', 'gatos', 'aves-domesticas', 'vacas', 'cerdos', 'caballos', 'peces-ornamentales'];
                    matchesType = !commonTypes.includes(med.tipoAnimal);
                } else {
                    matchesType = med.tipoAnimal === typeFilter;
                }
            }
            
            const matchesStatus = !statusFilter || this.getMedicineStatus(med) === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });

        this.currentPage = 1;
        this.renderTable();
        this.updateResultsCount();
    }

    getMedicineStatus(medicine) {
        const now = new Date();
        const expiryDate = new Date(medicine.fechaVencimiento);
        
        if (expiryDate < now) return 'expired';
        if (medicine.cantidad <= medicine.stockMinimo) return 'low';
        return 'available';
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterStatus').value = '';
        this.applyFilters();
    }

    // ========== MODAL OPERATIONS ==========
    showAddModal() {
        if (!this.canCreate()) {
            GlobalHelpers.showToast('No tienes permisos para agregar medicamentos', 'error');
            return;
        }

        const modal = document.getElementById('medicineModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('medicineForm');
        
        title.textContent = 'Agregar Medicamento';
        form.reset();
        delete form.dataset.editId;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('medExpiry').min = today;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async editMedicine(id) {
        if (!this.canEdit()) {
            GlobalHelpers.showToast('No tienes permisos para editar medicamentos', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const medicine = this.medicines.find(m => m.id === id);
            
            if (!medicine) {
                GlobalHelpers.showToast('Medicamento no encontrado', 'error');
                return;
            }
            
            const modal = document.getElementById('medicineModal');
            const title = document.getElementById('modalTitle');
            const form = document.getElementById('medicineForm');
            
            title.textContent = 'Editar Medicamento';
            
            // Llenar formulario con datos del medicamento
            document.getElementById('medCode').value = medicine.codigo || '';
            document.getElementById('medName').value = medicine.nombre || '';
            document.getElementById('medQuantity').value = medicine.cantidad || '';
            document.getElementById('medMinStock').value = medicine.stockMinimo || '';
            document.getElementById('medDose').value = medicine.dosis || '';
            document.getElementById('medType').value = medicine.tipoAnimal || '';
            document.getElementById('medExpiry').value = medicine.fechaVencimiento ? 
                medicine.fechaVencimiento.split('T')[0] : '';
            document.getElementById('medSupplier').value = medicine.proveedorId || '';

            form.dataset.editId = id;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading medicine for edit:', error);
            GlobalHelpers.showToast('Error al cargar los datos del medicamento: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteMedicine(id) {
        if (!this.canDelete()) {
            GlobalHelpers.showToast('No tienes permisos para eliminar medicamentos', 'error');
            return;
        }

        const medicine = this.medicines.find(med => med.id === id);
        if (!medicine) return;

        if (confirm(`¿Eliminar "${medicine.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            try {
                this.showLoading(true);
                await GlobalApiService.deleteMedicamento(id);
                await this.loadMedicamentos();
                this.applyFilters();
                this.updateStats();
                GlobalHelpers.showToast('Medicamento eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error deleting medicine:', error);
                GlobalHelpers.showToast('Error al eliminar el medicamento: ' + error.message, 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const medicineData = {
            codigo: formData.get('codigo'),
            nombre: formData.get('nombre'),
            cantidad: parseInt(formData.get('cantidadActual')),
            stockMinimo: parseInt(formData.get('stockMinimo')),
            dosis: formData.get('dosis'),
            tipoAnimal: formData.get('tipoAnimal'),
            fechaVencimiento: formData.get('fechaVencimiento'),
            proveedorId: parseInt(formData.get('proveedorId'))
        };
        
        const editId = e.target.dataset.editId;

        if (!this.validateMedicineData(medicineData)) {
            return;
        }

        try {
            this.showLoading(true);
            
            if (editId) {
                await GlobalApiService.updateMedicamento(parseInt(editId), medicineData);
                GlobalHelpers.showToast('Medicamento actualizado correctamente', 'success');
            } else {
                await GlobalApiService.createMedicamento(medicineData);
                GlobalHelpers.showToast('Medicamento agregado correctamente', 'success');
            }

            this.closeModal();
            await this.loadMedicamentos();
            this.applyFilters();
            this.updateStats();
        } catch (error) {
            console.error('Error saving medicine:', error);
            GlobalHelpers.showToast('Error al guardar el medicamento: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateMedicineData(data) {
        if (!data.codigo || !data.nombre || data.cantidad === null || data.stockMinimo === null || 
            !data.dosis || !data.tipoAnimal || !data.fechaVencimiento || !data.proveedorId) {
            GlobalHelpers.showToast('Por favor, completa todos los campos requeridos', 'error');
            return false;
        }

        if (data.cantidad < 0 || data.stockMinimo < 0) {
            GlobalHelpers.showToast('Las cantidades no pueden ser negativas', 'error');
            return false;
        }

        const expiryDate = new Date(data.fechaVencimiento);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
            GlobalHelpers.showToast('La fecha de vencimiento no puede ser anterior a hoy', 'error');
            return false;
        }

        return true;
    }

    closeModal() {
        const modal = document.getElementById('medicineModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('medicineForm').reset();
    }

    // ========== RENDERIZADO DE TABLA ==========
    renderTable() {
        let data = [...this.filteredMedicines];
        
        if (this.currentSort.field) {
            data.sort((a, b) => {
                let aVal = a[this.currentSort.field];
                let bVal = b[this.currentSort.field];
                
                if (this.currentSort.field.includes('fecha')) {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                const comparison = aVal > bVal ? 1 : -1;
                return this.currentSort.direction === 'desc' ? -comparison : comparison;
            });
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedData = data.slice(startIndex, startIndex + this.itemsPerPage);

        const tbody = document.getElementById('medicineTableBody');
        if (!tbody) return;

        if (paginatedData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-message">
                        <div class="empty-state">
                            <div class="empty-icon">📦</div>
                            <p>No se encontraron medicamentos</p>
                            <button class="btn btn-primary" onclick="inventoryPage.showAddModal()">
                                Agregar Primer Medicamento
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = paginatedData.map(med => this.renderMedicineRow(med)).join('');
        this.renderPagination(data.length);
    }

    renderMedicineRow(medicine) {
        const status = this.getMedicineStatus(medicine);
        const statusBadge = this.getStatusBadge(status);
        const expiryWarning = this.getExpiryWarning(medicine.fechaVencimiento);

        return `
            <tr class="medicine-row ${status}" data-id="${medicine.id}">
                <td>
                    <div class="code-cell">
                        <strong>${medicine.codigo}</strong>
                        ${medicine.cantidad === 0 ? '<span class="stock-warning">Sin Stock</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="medicine-info">
                        <div class="medicine-name">${medicine.nombre}</div>
                        <div class="medicine-dose">Dosis: ${medicine.dosis}</div>
                    </div>
                </td>
                <td>
                    <div class="stock-info">
                        <span class="stock-current ${medicine.cantidad <= medicine.stockMinimo ? 'low' : ''}">${medicine.cantidad}</span>
                        <span class="stock-min">/ ${medicine.stockMinimo} mín</span>
                    </div>
                </td>
                <td>
                    <span class="type-badge ${medicine.tipoAnimal}">
                        ${this.getTypeIcon(medicine.tipoAnimal)} ${this.formatAnimalName(medicine.tipoAnimal)}
                    </span>
                </td>
                <td>
                    <div class="expiry-info">
                        <div class="expiry-date">${GlobalHelpers.formatDate(medicine.fechaVencimiento)}</div>
                        ${expiryWarning}
                    </div>
                </td>
                <td>${medicine.proveedorNombre || 'Sin proveedor'}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="inventoryPage.viewMedicine(${medicine.id})" title="Ver detalles">
                            👁️
                        </button>
                        <button class="action-btn edit" onclick="inventoryPage.editMedicine(${medicine.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="inventoryPage.deleteMedicine(${medicine.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'available': '<span class="status-badge available">✅ Disponible</span>',
            'low': '<span class="status-badge low">⚠️ Stock Bajo</span>',
            'expired': '<span class="status-badge expired">❌ Vencido</span>'
        };
        return badges[status] || badges['available'];
    }

    getTypeIcon(type) {
        const icons = {
            'perros': '🐕', 'gatos': '🐱', 'general': '🏥', 'conejos': '🐰', 'hamsters': '🐹',
            'cobayas': '🐹', 'chinchillas': '🐭', 'hurones': '🦫', 'aves-domesticas': '🐦', 
            'canarios': '🐤', 'loros': '🦜', 'periquitos': '🦜', 'peces-ornamentales': '🐠',
            'tortugas': '🐢', 'iguanas': '🦎', 'serpientes': '🐍', 'erizos': '🦔', 'vacas': '🐄',
            'cerdos': '🐷', 'cabras': '🐐', 'ovejas': '🐑', 'pollos': '🐓', 'gallinas': '🐔',
            'patos': '🦆', 'gansos': '🦢', 'pavos': '🦃', 'caballos': '🐴'
        };
        return icons[type] || '🐾';
    }

    getExpiryWarning(dateString) {
        const expiryDate = new Date(dateString);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return '<div class="expiry-warning expired">❌ Vencido</div>';
        } else if (daysUntilExpiry <= 30) {
            return `<div class="expiry-warning warning">⚠️ ${daysUntilExpiry} días</div>`;
        }
        return '';
    }

    // ========== ORDENAMIENTO ==========
    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        this.renderTable();
        this.updateSortIcons();
    }

    updateSortIcons() {
        document.querySelectorAll('.sortable').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (th.dataset.sort === this.currentSort.field) {
                icon.textContent = this.currentSort.direction === 'asc' ? '↑' : '↓';
            } else {
                icon.textContent = '↕️';
            }
        });
    }

    // ========== PAGINACIÓN ==========
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const container = document.getElementById('paginationContainer');
        
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        
        html += `<button class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        onclick="inventoryPage.goToPage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>← Anterior</button>`;

        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="inventoryPage.goToPage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        onclick="inventoryPage.goToPage(${this.currentPage + 1})" 
                        ${this.currentPage === totalPages ? 'disabled' : ''}>Siguiente →</button>`;

        html += '</div>';
        
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        html += `<div class="pagination-info">Mostrando ${start} - ${end} de ${totalItems} medicamentos</div>`;

        container.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredMedicines.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    }

    // ========== ESTADÍSTICAS ==========
    updateStats() {
        const total = this.medicines.length;
        const lowStock = this.medicines.filter(med => med.cantidad <= med.stockMinimo).length;
        const expiring = this.medicines.filter(med => {
            const expiryDate = new Date(med.fechaVencimiento);
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            return expiryDate <= thirtyDays && expiryDate >= new Date();
        }).length;
        const totalValue = this.medicines.reduce((sum, med) => sum + (med.cantidad * 10), 0);

        document.getElementById('totalMedicines').textContent = total;
        document.getElementById('lowStockCount').textContent = lowStock;
        document.getElementById('expiringCount').textContent = expiring;
        document.getElementById('totalValue').textContent = GlobalHelpers.formatCurrency(totalValue);
    }

    updateResultsCount() {
        const count = this.filteredMedicines.length;
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `${count} medicamento${count !== 1 ? 's' : ''}`;
        }
    }

    // ========== PERMISOS ==========
    canCreate() {
        return GlobalApiService.currentUser?.role === 'admin' || GlobalApiService.currentUser?.role === 'employee';
    }

    canEdit() {
        return GlobalApiService.currentUser?.role === 'admin' || GlobalApiService.currentUser?.role === 'employee';
    }

    canDelete() {
        return GlobalApiService.currentUser?.role === 'admin';
    }

    viewMedicine(id) {
        const medicine = this.medicines.find(med => med.id === id);
        if (!medicine) return;

        const proveedorNombre = medicine.proveedorNombre || 'Sin proveedor';
        const status = this.getMedicineStatus(medicine);
        const statusText = {
            'available': 'Disponible',
            'low': 'Stock Bajo',
            'expired': 'Vencido'
        };

        const details = [
            `Medicamento: ${medicine.nombre} (${medicine.codigo})`,
            `Dosis: ${medicine.dosis}`,
            `Tipo: ${this.getTypeIcon(medicine.tipoAnimal)} ${this.formatAnimalName(medicine.tipoAnimal)}`,
            `Stock: ${medicine.cantidad} / ${medicine.stockMinimo} mín`,
            `Proveedor: ${proveedorNombre}`,
            `Vencimiento: ${GlobalHelpers.formatDate(medicine.fechaVencimiento)}`,
            `Estado: ${statusText[status]}`
        ].join('\n');

        alert(details);
    }

    // ========== EXPORTACIÓN ==========
    exportData() {
        const data = this.filteredMedicines.map(med => ({
            'Código': med.codigo,
            'Nombre': med.nombre,
            'Cantidad': med.cantidad,
            'Stock Mínimo': med.stockMinimo,
            'Dosis': med.dosis,
            'Tipo Animal': this.formatAnimalName(med.tipoAnimal),
            'Fecha Vencimiento': GlobalHelpers.formatDate(med.fechaVencimiento),
            'Proveedor': med.proveedorNombre || 'Sin proveedor',
            'Estado': this.getMedicineStatus(med)
        }));

        this.downloadCSV(data, `inventario_${new Date().toISOString().split('T')[0]}.csv`);
        GlobalHelpers.showToast('Inventario exportado correctamente', 'success');
    }

    downloadCSV(data, filename) {
        const csv = this.convertToCSV(data);
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

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        return csvContent;
    }

    // ========== MANEJO DE ACCIONES URL ==========
    handleUrlActions() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const highlight = urlParams.get('highlight');
        
        if (action === 'add') {
            setTimeout(() => this.showAddModal(), 500);
        } else if (action === 'search') {
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView();
                }
            }, 500);
        }
        
        if (highlight) {
            setTimeout(() => this.highlightMedicine(highlight), 1000);
        }
    }

    highlightMedicine(medicineId) {
        const row = document.querySelector(`[data-id="${medicineId}"]`);
        if (row) {
            row.style.backgroundColor = '#fff3cd';
            row.style.border = '2px solid #ffc107';
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                row.style.backgroundColor = '';
                row.style.border = '';
            }, 5000);
        }
    }
}

// ========== INICIALIZACIÓN ==========
let inventoryPage;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Inventory...');
    
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
    
    inventoryPage = new InventoryPage();
    inventoryPage.init();
});

// Hacer disponible globalmente
window.inventoryPage = inventoryPage;