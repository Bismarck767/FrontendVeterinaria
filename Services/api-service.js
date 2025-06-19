// api-service.js
// Servicio para manejar todas las llamadas a la API

// CONFIGURACIÓN DE LA API
const API_CONFIG = {
    baseURL: 'https://localhost:7273', // Tu URL de la API
    endpoints: {
        medicamentos: '/api/Medicamentos',
        proveedores: '/api/Proveedores',
        movimientos: '/api/MovimientosInventario'
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// SERVICIO DE API
class ApiService {
    /**
     * Realizar una petición HTTP a la API
     * @param {string} endpoint - Endpoint de la API
     * @param {object} options - Opciones de la petición
     * @returns {Promise<any>} - Respuesta de la API
     */
    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        const config = {
            headers: {
                ...API_CONFIG.headers,
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            // Verificar si la respuesta tiene contenido JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            // Para DELETE que no retornan contenido
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ========== MEDICAMENTOS ==========

    /**
     * Obtener todos los medicamentos
     * @returns {Promise<MedicamentoDto[]>}
     */
    static async getMedicamentos() {
        return await this.request(API_CONFIG.endpoints.medicamentos);
    }

    /**
     * Obtener un medicamento por ID
     * @param {number} id - ID del medicamento
     * @returns {Promise<MedicamentoDto>}
     */
    static async getMedicamento(id) {
        return await this.request(`${API_CONFIG.endpoints.medicamentos}/${id}`);
    }

    /**
     * Crear un nuevo medicamento
     * @param {object} medicamento - Datos del medicamento
     * @returns {Promise<MedicamentoDto>}
     */
    static async createMedicamento(medicamento) {
        // Convertir los datos al formato esperado por la API
        const medicamentoDto = {
            codigo: medicamento.codigo,
            nombre: medicamento.nombre,
            cantidad: parseInt(medicamento.cantidad),
            stockMinimo: parseInt(medicamento.stockMinimo),
            dosis: medicamento.dosis,
            tipoAnimal: medicamento.tipoAnimal,
            fechaVencimiento: medicamento.fechaVencimiento,
            proveedorId: parseInt(medicamento.proveedorId)
        };

        return await this.request(API_CONFIG.endpoints.medicamentos, {
            method: 'POST',
            body: JSON.stringify(medicamentoDto)
        });
    }

    /**
     * Actualizar un medicamento existente
     * @param {number} id - ID del medicamento
     * @param {object} medicamento - Datos actualizados del medicamento
     * @returns {Promise<MedicamentoDto>}
     */
    static async updateMedicamento(id, medicamento) {
        // Convertir los datos al formato esperado por la API
        const medicamentoDto = {
            id: id,
            codigo: medicamento.codigo,
            nombre: medicamento.nombre,
            cantidad: parseInt(medicamento.cantidad),
            stockMinimo: parseInt(medicamento.stockMinimo),
            dosis: medicamento.dosis,
            tipoAnimal: medicamento.tipoAnimal,
            fechaVencimiento: medicamento.fechaVencimiento,
            proveedorId: parseInt(medicamento.proveedorId)
        };

        return await this.request(`${API_CONFIG.endpoints.medicamentos}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(medicamentoDto)
        });
    }

    /**
     * Eliminar un medicamento
     * @param {number} id - ID del medicamento
     * @returns {Promise<Response>}
     */
    static async deleteMedicamento(id) {
        return await this.request(`${API_CONFIG.endpoints.medicamentos}/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== PROVEEDORES ==========

    /**
     * Obtener todos los proveedores
     * @returns {Promise<ProveedorDto[]>}
     */
    static async getProveedores() {
        return await this.request(API_CONFIG.endpoints.proveedores);
    }

    /**
     * Obtener un proveedor por ID
     * @param {number} id - ID del proveedor
     * @returns {Promise<ProveedorDto>}
     */
    static async getProveedor(id) {
        return await this.request(`${API_CONFIG.endpoints.proveedores}/${id}`);
    }

    /**
     * Crear un nuevo proveedor
     * @param {object} proveedor - Datos del proveedor
     * @returns {Promise<ProveedorDto>}
     */
    static async createProveedor(proveedor) {
        const proveedorDto = {
            nombre: proveedor.nombre,
            telefono: proveedor.telefono,
            email: proveedor.email,
            direccion: proveedor.direccion
        };

        return await this.request(API_CONFIG.endpoints.proveedores, {
            method: 'POST',
            body: JSON.stringify(proveedorDto)
        });
    }

    /**
     * Actualizar un proveedor existente
     * @param {number} id - ID del proveedor
     * @param {object} proveedor - Datos actualizados del proveedor
     * @returns {Promise<ProveedorDto>}
     */
    static async updateProveedor(id, proveedor) {
        const proveedorDto = {
            id: id,
            nombre: proveedor.nombre,
            telefono: proveedor.telefono,
            email: proveedor.email,
            direccion: proveedor.direccion
        };

        return await this.request(`${API_CONFIG.endpoints.proveedores}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(proveedorDto)
        });
    }

    /**
     * Eliminar un proveedor
     * @param {number} id - ID del proveedor
     * @returns {Promise<Response>}
     */
    static async deleteProveedor(id) {
        return await this.request(`${API_CONFIG.endpoints.proveedores}/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== MOVIMIENTOS DE INVENTARIO ==========

    /**
     * Obtener todos los movimientos de inventario
     * @returns {Promise<MovimientoInventarioDto[]>}
     */
    static async getMovimientos() {
        return await this.request(API_CONFIG.endpoints.movimientos);
    }

    /**
     * Obtener movimientos por medicamento
     * @param {number} medicamentoId - ID del medicamento
     * @returns {Promise<MovimientoInventarioDto[]>}
     */
    static async getMovimientosByMedicamento(medicamentoId) {
        return await this.request(`${API_CONFIG.endpoints.movimientos}/medicamento/${medicamentoId}`);
    }

    /**
     * Crear un nuevo movimiento de inventario
     * @param {object} movimiento - Datos del movimiento
     * @returns {Promise<MovimientoInventarioDto>}
     */
    static async createMovimiento(movimiento) {
        const movimientoDto = {
            medicamentoId: parseInt(movimiento.medicamentoId),
            cantidad: parseInt(movimiento.cantidad),
            tipoMovimiento: movimiento.tipoMovimiento, // "Entrada" o "Salida"
            usuario: movimiento.usuario,
            observaciones: movimiento.observaciones || ''
        };

        return await this.request(API_CONFIG.endpoints.movimientos, {
            method: 'POST',
            body: JSON.stringify(movimientoDto)
        });
    }

    // ========== MÉTODOS DE UTILIDAD ==========

    /**
     * Configurar la URL base de la API
     * @param {string} baseURL - Nueva URL base
     */
    static setBaseURL(baseURL) {
        API_CONFIG.baseURL = baseURL;
    }

    /**
     * Configurar headers adicionales
     * @param {object} headers - Headers adicionales
     */
    static setHeaders(headers) {
        API_CONFIG.headers = { ...API_CONFIG.headers, ...headers };
    }

    /**
     * Agregar token de autenticación
     * @param {string} token - Token de autenticación
     */
    static setAuthToken(token) {
        API_CONFIG.headers['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Remover token de autenticación
     */
    static removeAuthToken() {
        delete API_CONFIG.headers['Authorization'];
    }

    /**
     * Verificar si la API está disponible
     * @returns {Promise<boolean>}
     */
    static async checkApiHealth() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/health`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            return response.ok;
        } catch (error) {
            console.error('API Health Check Failed:', error);
            return false;
        }
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}