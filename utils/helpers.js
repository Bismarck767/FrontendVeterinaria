// Funciones auxiliares para VeterinaryProject
class Helpers {
    
    // Formatear fechas
    static formatDate(date, format = 'dd/mm/yyyy') {
        if (!date) return '-';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'long':
                return d.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            default:
                return `${day}/${month}/${year}`;
        }
    }

    // Calcular días entre fechas
    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Verificar si una fecha está próxima a vencer
    static isExpiringSoon(expiryDate, daysThreshold = 15) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return diffDays <= daysThreshold && diffDays >= 0;
    }

    // Verificar si una fecha ya expiró
    static isExpired(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return expiry < today;
    }

    // Formatear números como moneda
    static formatCurrency(amount, currency = 'CRC') {
        const formatter = new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(amount);
    }

    // Formatear números con separadores de miles
    static formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    // Generar ID único simple
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Capitalizar primera letra
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Limpiar y normalizar texto
    static normalizeText(text) {
        if (!text) return '';
        return text.trim().toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
    }

    // Buscar en texto (sin acentos, case insensitive)
    static searchInText(searchTerm, text) {
        const normalizedSearch = Helpers.normalizeText(searchTerm);
        const normalizedText = Helpers.normalizeText(text);
        return normalizedText.includes(normalizedSearch);
    }

    // Debounce para búsquedas
    static debounce(func, wait) {
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

    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar código de medicamento
    static isValidMedicineCode(code) {
        // Ejemplo: MED001, VET-123, etc.
        const codeRegex = /^[A-Z]{2,4}[-]?\d{3,6}$/i;
        return codeRegex.test(code);
    }

    // Escapar HTML para prevenir XSS
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Obtener color por estado
    static getStatusColor(status) {
        const colors = {
            'available': '#059669',    // Verde
            'low': '#d97706',         // Naranja
            'expired': '#dc2626',     // Rojo
            'warning': '#eab308'      // Amarillo
        };
        return colors[status] || '#64748b'; // Gris por defecto
    }

    // Obtener icono por estado
    static getStatusIcon(status) {
        const icons = {
            'available': '✅',
            'low': '⚠️',
            'expired': '❌',
            'warning': '🔔',
            'success': '✅',
            'info': 'ℹ️',
            'error': '❌'
        };
        return icons[status] || '📋';
    }

    // Obtener clase CSS por estado
    static getStatusClass(status) {
        const classes = {
            'available': 'status-available',
            'low': 'status-low',
            'expired': 'status-expired',
            'warning': 'status-warning'
        };
        return classes[status] || 'status-default';
    }

    // Truncar texto
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Ordenar array por campo
    static sortBy(array, field, direction = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Manejar fechas
            if (field.includes('Date') || field.includes('date')) {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            // Manejar números
            if (typeof aVal === 'string' && !isNaN(aVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    }

    // Filtrar array por múltiples criterios
    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                if (!filterValue) return true; // Si no hay filtro, incluir
                
                const itemValue = item[key];
                if (typeof filterValue === 'string') {
                    return Helpers.searchInText(filterValue, String(itemValue));
                }
                return itemValue === filterValue;
            });
        });
    }

    // Agrupar array por campo
    static groupBy(array, field) {
        return array.reduce((groups, item) => {
            const key = item[field];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }

    // Mostrar notificación toast
    static showToast(message, type = 'info', duration = 5000) {
        // Crear contenedor si no existe
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${Helpers.getStatusIcon(type)}</span>
            <div class="toast-content">
                <div class="toast-message">${Helpers.escapeHtml(message)}</div>
            </div>
            <span class="toast-close">&times;</span>
        `;

        // Agregar event listener para cerrar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Agregar al contenedor
        container.appendChild(toast);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    // Confirmar acción
    static async confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }

    // Exportar datos como CSV
    static exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','), // Headers
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Escapar comillas y envolver en comillas si contiene comas
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        Helpers.downloadFile(csvContent, filename, 'text/csv');
    }

    // Exportar datos como JSON
    static exportToJSON(data, filename = 'export.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        Helpers.downloadFile(jsonContent, filename, 'application/json');
    }

    // Descargar archivo
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Leer archivo
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Parsear CSV
    static parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    // Validar archivo
    static validateFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const errors = [];

        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`);
        }

        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            errors.push(`Archivo muy grande. Tamaño máximo: ${maxSizeMB}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Formatear tamaño de archivo
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generar código de medicamento automático
    static generateMedicineCode(animalType, sequence) {
        const prefixes = {
            'perros': 'DOG',
            'gatos': 'CAT',
            'general': 'GEN'
        };
        
        const prefix = prefixes[animalType] || 'MED';
        const paddedSequence = String(sequence).padStart(3, '0');
        
        return `${prefix}${paddedSequence}`;
    }

    // Calcular stock promedio
    static calculateAverageStock(medicines) {
        if (!medicines || medicines.length === 0) return 0;
        const total = medicines.reduce((sum, med) => sum + med.quantity, 0);
        return Math.round(total / medicines.length);
    }

    // Obtener medicamentos con stock crítico
    static getCriticalStockMedicines(medicines, threshold = 0.5) {
        return medicines.filter(med => {
            const stockRatio = med.quantity / med.minStock;
            return stockRatio <= threshold;
        });
    }

    // Calcular valor total del inventario
    static calculateInventoryValue(medicines, priceField = 'price') {
        return medicines.reduce((total, med) => {
            const price = med[priceField] || 10; // Precio por defecto si no existe
            return total + (med.quantity * price);
        }, 0);
    }

    // Obtener resumen de tipos de animales
    static getAnimalTypeSummary(medicines) {
        const summary = Helpers.groupBy(medicines, 'animalType');
        return Object.keys(summary).map(type => ({
            type: Helpers.capitalize(type),
            count: summary[type].length,
            totalStock: summary[type].reduce((sum, med) => sum + med.quantity, 0)
        }));
    }

    // Detectar dispositivo móvil
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Copiar texto al portapapeles
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores más antiguos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            return false;
        }
    }

    // Obtener información del navegador
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        return {
            browser,
            userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.Helpers = Helpers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}