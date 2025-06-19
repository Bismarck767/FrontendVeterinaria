// Componente de Tabla para VeterinaryProject
class DataTable {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            data: [],
            columns: [],
            sortable: true,
            searchable: true,
            paginated: true,
            itemsPerPage: 10,
            showInfo: true,
            showExport: false,
            className: 'table',
            emptyMessage: 'No hay datos disponibles',
            ...options
        };
        
        this.currentData = [];
        this.filteredData = [];
        this.sortConfig = { field: null, direction: 'asc' };
        this.pagination = { currentPage: 1, totalPages: 1 };
        this.searchTerm = '';
        
        this.init();
    }

    // Inicializar tabla
    init() {
        if (!this.container) {
            console.error(`Contenedor ${this.containerId} no encontrado`);
            return;
        }
        
        this.currentData = [...this.options.data];
        this.render();
    }

    // Renderizar tabla completa
    render() {
        this.container.innerHTML = '';
        
        // Crear estructura
        const wrapper = document.createElement('div');
        wrapper.className = 'datatable-wrapper';
        
        // Header con búsqueda y exportar
        if (this.options.searchable || this.options.showExport) {
            wrapper.appendChild(this.createHeader());
        }
        
        // Tabla
        wrapper.appendChild(this.createTable());
        
        // Paginación
        if (this.options.paginated) {
            wrapper.appendChild(this.createPagination());
        }
        
        // Info
        if (this.options.showInfo) {
            wrapper.appendChild(this.createInfo());
        }
        
        this.container.appendChild(wrapper);
        this.updateData();
    }

    // Crear header con controles
    createHeader() {
        const header = document.createElement('div');
        header.className = 'datatable-header';
        
        let headerContent = '';
        
        if (this.options.searchable) {
            headerContent += `
                <div class="datatable-search">
                    <input type="text" 
                           id="${this.containerId}_search" 
                           placeholder="Buscar..." 
                           class="form-control">
                </div>
            `;
        }
        
        if (this.options.showExport) {
            headerContent += `
                <div class="datatable-export">
                    <button type="button" 
                            id="${this.containerId}_export" 
                            class="btn btn-secondary btn-sm">
                        📄 Exportar CSV
                    </button>
                </div>
            `;
        }
        
        header.innerHTML = headerContent;
        
        // Event listeners
        if (this.options.searchable) {
            const searchInput = header.querySelector(`#${this.containerId}_search`);
            searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }
        
        if (this.options.showExport) {
            const exportBtn = header.querySelector(`#${this.containerId}_export`);
            exportBtn.addEventListener('click', () => {
                this.export();
            });
        }
        
        return header;
    }

    // Crear tabla
    createTable() {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'datatable-container';
        
        const table = document.createElement('table');
        table.className = this.options.className;
        table.id = `${this.containerId}_table`;
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        this.options.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title || column.field;
            
            if (this.options.sortable && column.sortable !== false) {
                th.className = 'sortable-header';
                th.dataset.field = column.field;
                th.addEventListener('click', () => {
                    this.sort(column.field);
                });
            }
            
            if (column.width) {
                th.style.width = column.width;
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        tbody.id = `${this.containerId}_tbody`;
        table.appendChild(tbody);
        
        tableContainer.appendChild(table);
        return tableContainer;
    }

    // Crear paginación
    createPagination() {
        const pagination = document.createElement('div');
        pagination.className = 'datatable-pagination';
        pagination.id = `${this.containerId}_pagination`;
        return pagination;
    }

    // Crear información
    createInfo() {
        const info = document.createElement('div');
        info.className = 'datatable-info';
        info.id = `${this.containerId}_info`;
        return info;
    }

    // Actualizar datos
    updateData() {
        this.applyFilters();
        this.renderTable();
        this.renderPagination();
        this.renderInfo();
        this.updateSortIndicators();
    }

    // Aplicar filtros
    applyFilters() {
        let filtered = [...this.currentData];
        
        // Aplicar búsqueda
        if (this.searchTerm) {
            filtered = filtered.filter(row => {
                return this.options.columns.some(column => {
                    const value = this.getCellValue(row, column);
                    return String(value).toLowerCase().includes(this.searchTerm.toLowerCase());
                });
            });
        }
        
        // Aplicar ordenamiento
        if (this.sortConfig.field) {
            filtered.sort((a, b) => {
                const aVal = this.getCellValue(a, { field: this.sortConfig.field });
                const bVal = this.getCellValue(b, { field: this.sortConfig.field });
                
                let comparison = 0;
                if (aVal > bVal) comparison = 1;
                if (aVal < bVal) comparison = -1;
                
                return this.sortConfig.direction === 'desc' ? -comparison : comparison;
            });
        }
        
        this.filteredData = filtered;
        
        // Actualizar paginación
        if (this.options.paginated) {
            this.pagination.totalPages = Math.ceil(filtered.length / this.options.itemsPerPage);
            if (this.pagination.currentPage > this.pagination.totalPages) {
                this.pagination.currentPage = 1;
            }
        }
    }

    // Renderizar tabla
    renderTable() {
        const tbody = document.getElementById(`${this.containerId}_tbody`);
        if (!tbody) return;
        
        let dataToShow = this.filteredData;
        
        // Aplicar paginación
        if (this.options.paginated) {
            const start = (this.pagination.currentPage - 1) * this.options.itemsPerPage;
            const end = start + this.options.itemsPerPage;
            dataToShow = this.filteredData.slice(start, end);
        }
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (dataToShow.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = this.options.columns.length;
            emptyCell.className = 'text-center';
            emptyCell.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>${this.options.emptyMessage}</p>
                </div>
            `;
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }
        
        // Renderizar filas
        dataToShow.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            
            this.options.columns.forEach(column => {
                const td = document.createElement('td');
                const value = this.getCellValue(row, column);
                
                if (column.render) {
                    td.innerHTML = column.render(value, row, index);
                } else {
                    td.textContent = value;
                }
                
                if (column.className) {
                    td.className = column.className;
                }
                
                tr.appendChild(td);
            });
            
            // Evento de click en fila
            if (this.options.onRowClick) {
                tr.addEventListener('click', () => {
                    this.options.onRowClick(row, index);
                });
                tr.style.cursor = 'pointer';
            }
            
            tbody.appendChild(tr);
        });
    }

    // Renderizar paginación
    renderPagination() {
        if (!this.options.paginated) return;
        
        const paginationContainer = document.getElementById(`${this.containerId}_pagination`);
        if (!paginationContainer) return;
        
        if (this.pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        const currentPage = this.pagination.currentPage;
        const totalPages = this.pagination.totalPages;
        
        let paginationHtml = '<div class="pagination">';
        
        // Botón anterior
        paginationHtml += `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    data-page="${currentPage - 1}" 
                    ${currentPage === 1 ? 'disabled' : ''}>
                ← Anterior
            </button>
        `;
        
        // Números de página
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Botón siguiente
        paginationHtml += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    data-page="${currentPage + 1}" 
                    ${currentPage === totalPages ? 'disabled' : ''}>
                Siguiente →
            </button>
        `;
        
        paginationHtml += '</div>';
        paginationContainer.innerHTML = paginationHtml;
        
        // Event listeners para paginación
        paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                    this.goToPage(page);
                }
            });
        });
    }

    // Renderizar información
    renderInfo() {
        if (!this.options.showInfo) return;
        
        const infoContainer = document.getElementById(`${this.containerId}_info`);
        if (!infoContainer) return;
        
        const start = this.options.paginated 
            ? (this.pagination.currentPage - 1) * this.options.itemsPerPage + 1
            : 1;
        const end = this.options.paginated 
            ? Math.min(this.pagination.currentPage * this.options.itemsPerPage, this.filteredData.length)
            : this.filteredData.length;
        
        infoContainer.innerHTML = `
            Mostrando ${start} - ${end} de ${this.filteredData.length} registros
            ${this.filteredData.length !== this.currentData.length ? 
                `(filtrado de ${this.currentData.length} total)` : ''}
        `;
    }

    // Actualizar indicadores de ordenamiento
    updateSortIndicators() {
        if (!this.options.sortable) return;
        
        const headers = this.container.querySelectorAll('.sortable-header');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.field === this.sortConfig.field) {
                header.classList.add(`sort-${this.sortConfig.direction}`);
            }
        });
    }

    // Obtener valor de celda
    getCellValue(row, column) {
        if (column.field.includes('.')) {
            // Soporte para campos anidados como 'user.name'
            return column.field.split('.').reduce((obj, key) => obj?.[key], row);
        }
        return row[column.field];
    }

    // Buscar
    search(term) {
        this.searchTerm = term;
        this.pagination.currentPage = 1;
        this.updateData();
    }

    // Ordenar
    sort(field) {
        if (this.sortConfig.field === field) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.field = field;
            this.sortConfig.direction = 'asc';
        }
        
        this.updateData();
    }

    // Ir a página
    goToPage(page) {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.currentPage = page;
        this.updateData();
    }

    // Actualizar datos
    setData(data) {
        this.currentData = [...data];
        this.pagination.currentPage = 1;
        this.updateData();
    }

    // Agregar fila
    addRow(row) {
        this.currentData.push(row);
        this.updateData();
    }

    // Actualizar fila
    updateRow(index, row) {
        if (index >= 0 && index < this.currentData.length) {
            this.currentData[index] = row;
            this.updateData();
        }
    }

    // Eliminar fila
    removeRow(index) {
        if (index >= 0 && index < this.currentData.length) {
            this.currentData.splice(index, 1);
            this.updateData();
        }
    }

    // Exportar datos
    export(format = 'csv') {
        const dataToExport = this.filteredData.map(row => {
            const exportRow = {};
            this.options.columns.forEach(column => {
                if (column.exportable !== false) {
                    exportRow[column.title || column.field] = this.getCellValue(row, column);
                }
            });
            return exportRow;
        });

        const filename = `${this.containerId}_${new Date().toISOString().split('T')[0]}`;
        
        if (format === 'csv') {
            Helpers.exportToCSV(dataToExport, `${filename}.csv`);
        } else if (format === 'json') {
            Helpers.exportToJSON(dataToExport, `${filename}.json`);
        }
    }

    // Limpiar búsqueda
    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById(`${this.containerId}_search`);
        if (searchInput) {
            searchInput.value = '';
        }
        this.updateData();
    }

    // Obtener datos filtrados
    getFilteredData() {
        return [...this.filteredData];
    }

    // Obtener fila seleccionada
    getSelectedRow() {
        const selectedRow = this.container.querySelector('tr.selected');
        if (selectedRow) {
            const index = parseInt(selectedRow.dataset.index);
            return this.filteredData[index];
        }
        return null;
    }

    // Seleccionar fila
    selectRow(index) {
        // Limpiar selección anterior
        const previousSelected = this.container.querySelector('tr.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Seleccionar nueva fila
        const rows = this.container.querySelectorAll('tbody tr');
        if (rows[index]) {
            rows[index].classList.add('selected');
        }
    }

    // Refrescar tabla
    refresh() {
        this.updateData();
    }

    // Destruir tabla
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Factory para crear tablas específicas
class TableFactory {
    
    // Crear tabla de medicamentos
    static createMedicineTable(containerId, medicines) {
        return new DataTable(containerId, {
            data: medicines,
            columns: [
                {
                    field: 'code',
                    title: 'Código',
                    width: '100px',
                    render: (value, row) => {
                        return `<strong>${value}</strong>${row.quantity === 0 ? ' <span class="badge badge-danger">Sin Stock</span>' : ''}`;
                    }
                },
                {
                    field: 'name',
                    title: 'Medicamento',
                    render: (value, row) => {
                        return `
                            <div class="medicine-info">
                                <strong>${value}</strong>
                                <small class="text-light">Dosis: ${row.dose}</small>
                            </div>
                        `;
                    }
                },
                {
                    field: 'quantity',
                    title: 'Stock',
                    width: '100px',
                    render: (value, row) => {
                        const isLow = value <= row.minStock;
                        return `
                            <span class="quantity-display ${isLow ? 'text-danger' : ''}">${value}</span>
                            <small class="text-light">/ ${row.minStock} mín</small>
                        `;
                    }
                },
                {
                    field: 'animalType',
                    title: 'Tipo',
                    width: '100px',
                    render: (value) => `<span class="badge badge-secondary">${Helpers.capitalize(value)}</span>`
                },
                {
                    field: 'expiryDate',
                    title: 'Vencimiento',
                    width: '120px',
                    render: (value) => {
                        const warning = TableFactory.getExpiryWarning(value);
                        return `
                            <div class="expiry-info">
                                ${Helpers.formatDate(value)}
                                ${warning}
                            </div>
                        `;
                    }
                },
                {
                    field: 'status',
                    title: 'Estado',
                    width: '100px',
                    render: (value, row) => {
                        const status = TableFactory.getMedicineStatus(row);
                        return TableFactory.getStatusBadge(status);
                    },
                    exportable: false
                },
                {
                    field: 'actions',
                    title: 'Acciones',
                    width: '150px',
                    sortable: false,
                    exportable: false,
                    render: (value, row) => {
                        return `
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-primary" onclick="inventoryManager.viewMedicine(${row.id})" title="Ver">👁️</button>
                                <button class="btn btn-sm btn-secondary" onclick="inventoryManager.editMedicine(${row.id})" title="Editar">✏️</button>
                                <button class="btn btn-sm btn-danger" onclick="inventoryManager.deleteMedicine(${row.id})" title="Eliminar">🗑️</button>
                            </div>
                        `;
                    }
                }
            ],
            sortable: true,
            searchable: true,
            paginated: true,
            itemsPerPage: 10,
            showExport: true,
            emptyMessage: 'No hay medicamentos registrados'
        });
    }

    // Crear tabla de movimientos
    static createMovementTable(containerId, movements) {
        return new DataTable(containerId, {
            data: movements,
            columns: [
                {
                    field: 'timestamp',
                    title: 'Fecha',
                    width: '120px',
                    render: (value) => Helpers.formatDate(value)
                },
                {
                    field: 'type',
                    title: 'Tipo',
                    width: '80px',
                    render: (value) => {
                        const badge = value === 'input' ? 'success' : 'warning';
                        const text = value === 'input' ? 'Entrada' : 'Salida';
                        return `<span class="badge badge-${badge}">${text}</span>`;
                    }
                },
                {
                    field: 'medicineName',
                    title: 'Medicamento'
                },
                {
                    field: 'quantity',
                    title: 'Cantidad',
                    width: '80px',
                    render: (value, row) => {
                        const sign = row.type === 'input' ? '+' : '-';
                        const color = row.type === 'input' ? 'text-success' : 'text-warning';
                        return `<span class="${color}">${sign}${value}</span>`;
                    }
                },
                {
                    field: 'reason',
                    title: 'Motivo'
                },
                {
                    field: 'userId',
                    title: 'Usuario',
                    width: '100px'
                }
            ],
            sortable: true,
            searchable: true,
            paginated: true,
            showExport: true,
            emptyMessage: 'No hay movimientos registrados'
        });
    }

    // Crear tabla de alertas
    static createAlertTable(containerId, alerts) {
        return new DataTable(containerId, {
            data: alerts,
            columns: [
                {
                    field: 'type',
                    title: 'Tipo',
                    width: '100px',
                    render: (value) => {
                        const types = {
                            'expiring': { text: 'Por Vencer', class: 'warning' },
                            'expired': { text: 'Vencido', class: 'danger' },
                            'lowstock': { text: 'Stock Bajo', class: 'warning' },
                            'outofstock': { text: 'Sin Stock', class: 'danger' }
                        };
                        const type = types[value] || { text: value, class: 'secondary' };
                        return `<span class="badge badge-${type.class}">${type.text}</span>`;
                    }
                },
                {
                    field: 'priority',
                    title: 'Prioridad',
                    width: '80px',
                    render: (value) => {
                        const priorities = {
                            'high': { text: 'Alta', class: 'danger' },
                            'medium': { text: 'Media', class: 'warning' },
                            'low': { text: 'Baja', class: 'secondary' }
                        };
                        const priority = priorities[value] || { text: value, class: 'secondary' };
                        return `<span class="badge badge-${priority.class}">${priority.text}</span>`;
                    }
                },
                {
                    field: 'medicine.name',
                    title: 'Medicamento'
                },
                {
                    field: 'message',
                    title: 'Mensaje'
                },
                {
                    field: 'timestamp',
                    title: 'Fecha',
                    width: '120px',
                    render: (value) => Helpers.formatDate(value)
                }
            ],
            sortable: true,
            searchable: true,
            paginated: true,
            emptyMessage: 'No hay alertas activas'
        });
    }

    // Métodos auxiliares
    static getMedicineStatus(medicine) {
        const now = new Date();
        const expiryDate = new Date(medicine.expiryDate);
        
        if (expiryDate < now) return 'expired';
        if (medicine.quantity <= medicine.minStock) return 'low';
        if (medicine.quantity === 0) return 'outofstock';
        return 'available';
    }

    static getStatusBadge(status) {
        const badges = {
            'available': '<span class="status-badge status-available">Disponible</span>',
            'low': '<span class="status-badge status-low">Stock Bajo</span>',
            'expired': '<span class="status-badge status-expired">Vencido</span>',
            'outofstock': '<span class="status-badge status-expired">Sin Stock</span>'
        };
        return badges[status] || badges['available'];
    }

    static getExpiryWarning(expiryDate) {
        if (Helpers.isExpired(expiryDate)) {
            return '<small class="text-danger">❌ Vencido</small>';
        } else if (Helpers.isExpiringSoon(expiryDate, 30)) {
            const days = Helpers.daysBetween(new Date(), expiryDate);
            return `<small class="text-warning">⚠️ ${days} días</small>`;
        }
        return '';
    }
}

// CSS adicional para tablas
const tableStyles = `
.datatable-wrapper {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    overflow: hidden;
}

.datatable-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--light-color);
}

.datatable-search {
    flex: 1;
    max-width: 300px;
}

.datatable-search .form-control {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
}

.datatable-export {
    margin-left: 1rem;
}

.datatable-container {
    overflow-x: auto;
}

.datatable-pagination {
    padding: 1rem;
    text-align: center;
    border-top: 1px solid var(--border-color);
}

.datatable-info {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: var(--text-light);
    text-align: center;
    background-color: var(--light-color);
}

.sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
}

.sortable-header:hover {
    background-color: var(--light-color);
}

.sortable-header.sort-asc::after {
    content: " ↑";
    color: var(--primary-color);
    font-weight: bold;
}

.sortable-header.sort-desc::after {
    content: " ↓";
    color: var(--primary-color);
    font-weight: bold;
}

.medicine-info {
    display: flex;
    flex-direction: column;
}

.medicine-info strong {
    margin-bottom: 0.25rem;
}

.medicine-info small {
    font-size: 0.75rem;
}

.quantity-display {
    font-weight: 600;
    font-size: 1.1rem;
}

.expiry-info {
    display: flex;
    flex-direction: column;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.action-buttons .btn {
    padding: 0.25rem 0.5rem;
    min-width: auto;
}

tr.selected {
    background-color: var(--primary-color) !important;
    color: white;
}

tr.selected td {
    border-color: var(--primary-color);
}

.table tbody tr:hover {
    background-color: var(--light-color);
}

@media (max-width: 768px) {
    .datatable-header {
        flex-direction: column;
        gap: 1rem;
    }
    
    .datatable-search {
        max-width: none;
        width: 100%;
    }
    
    .datatable-export {
        margin-left: 0;
        width: 100%;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .datatable-container {
        font-size: 0.875rem;
    }
}
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = tableStyles;
    document.head.appendChild(style);
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.DataTable = DataTable;
    window.TableFactory = TableFactory;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataTable, TableFactory };
}