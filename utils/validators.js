// Validadores para VeterinaryProject
class Validators {
    
    // Validar que un campo no esté vacío
    static required(value, fieldName = 'Campo') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return `${fieldName} es requerido`;
        }
        return null;
    }

    // Validar longitud mínima
    static minLength(value, min, fieldName = 'Campo') {
        if (!value || value.length < min) {
            return `${fieldName} debe tener al menos ${min} caracteres`;
        }
        return null;
    }

    // Validar longitud máxima
    static maxLength(value, max, fieldName = 'Campo') {
        if (value && value.length > max) {
            return `${fieldName} no puede tener más de ${max} caracteres`;
        }
        return null;
    }

    // Validar email
    static email(value, fieldName = 'Email') {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return `${fieldName} debe tener un formato válido`;
        }
        return null;
    }

    // Validar número
    static number(value, fieldName = 'Campo') {
        if (value && isNaN(value)) {
            return `${fieldName} debe ser un número válido`;
        }
        return null;
    }

    // Validar número entero
    static integer(value, fieldName = 'Campo') {
        if (value && (!Number.isInteger(Number(value)) || Number(value) < 0)) {
            return `${fieldName} debe ser un número entero positivo`;
        }
        return null;
    }

    // Validar rango numérico
    static range(value, min, max, fieldName = 'Campo') {
        const num = Number(value);
        if (isNaN(num) || num < min || num > max) {
            return `${fieldName} debe estar entre ${min} y ${max}`;
        }
        return null;
    }

    // Validar fecha
    static date(value, fieldName = 'Fecha') {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return `${fieldName} debe ser una fecha válida`;
        }
        return null;
    }

    // Validar fecha futura
    static futureDate(value, fieldName = 'Fecha') {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date <= today) {
            return `${fieldName} debe ser una fecha futura`;
        }
        return null;
    }

    // Validar fecha pasada
    static pastDate(value, fieldName = 'Fecha') {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        
        if (date >= today) {
            return `${fieldName} debe ser una fecha pasada`;
        }
        return null;
    }

    // Validar código de medicamento
    static medicineCode(value, fieldName = 'Código') {
        if (!value) return null;
        const codeRegex = /^[A-Z]{2,4}[-]?\d{3,6}$/i;
        if (!codeRegex.test(value)) {
            return `${fieldName} debe tener el formato: ABC123 o ABC-123`;
        }
        return null;
    }

    // Validar contraseña
    static password(value, fieldName = 'Contraseña') {
        if (!value) return null;
        
        const errors = [];
        
        if (value.length < 6) {
            errors.push('al menos 6 caracteres');
        }
        
        if (!/[A-Z]/.test(value)) {
            errors.push('una letra mayúscula');
        }
        
        if (!/[a-z]/.test(value)) {
            errors.push('una letra minúscula');
        }
        
        if (!/\d/.test(value)) {
            errors.push('un número');
        }
        
        if (errors.length > 0) {
            return `${fieldName} debe contener ${errors.join(', ')}`;
        }
        
        return null;
    }

    // Validar que dos campos coincidan
    static matches(value1, value2, fieldName = 'Campo') {
        if (value1 !== value2) {
            return `${fieldName} no coincide`;
        }
        return null;
    }

    // Validar selección de lista
    static selection(value, validOptions, fieldName = 'Campo') {
        if (!value || !validOptions.includes(value)) {
            return `${fieldName} debe ser una opción válida`;
        }
        return null;
    }

    // Validador personalizado para medicamentos
    static validateMedicine(medicineData) {
        const errors = {};
        
        // Código
        const codeError = Validators.required(medicineData.code, 'Código') || 
                         Validators.medicineCode(medicineData.code, 'Código');
        if (codeError) errors.code = codeError;
        
        // Nombre
        const nameError = Validators.required(medicineData.name, 'Nombre') ||
                         Validators.maxLength(medicineData.name, 100, 'Nombre');
        if (nameError) errors.name = nameError;
        
        // Cantidad
        const quantityError = Validators.required(medicineData.quantity, 'Cantidad') ||
                             Validators.integer(medicineData.quantity, 'Cantidad') ||
                             Validators.range(medicineData.quantity, 0, 99999, 'Cantidad');
        if (quantityError) errors.quantity = quantityError;
        
        // Stock mínimo
        const minStockError = Validators.required(medicineData.minStock, 'Stock Mínimo') ||
                             Validators.integer(medicineData.minStock, 'Stock Mínimo') ||
                             Validators.range(medicineData.minStock, 0, 9999, 'Stock Mínimo');
        if (minStockError) errors.minStock = minStockError;
        
        // Dosis
        const doseError = Validators.required(medicineData.dose, 'Dosis') ||
                         Validators.maxLength(medicineData.dose, 50, 'Dosis');
        if (doseError) errors.dose = doseError;
        
        // Tipo de animal
        const animalTypeError = Validators.required(medicineData.animalType, 'Tipo de Animal') ||
                               Validators.selection(medicineData.animalType, ['perros', 'gatos', 'general'], 'Tipo de Animal');
        if (animalTypeError) errors.animalType = animalTypeError;
        
        // Fecha de vencimiento
        const expiryError = Validators.required(medicineData.expiryDate, 'Fecha de Vencimiento') ||
                           Validators.date(medicineData.expiryDate, 'Fecha de Vencimiento') ||
                           Validators.futureDate(medicineData.expiryDate, 'Fecha de Vencimiento');
        if (expiryError) errors.expiryDate = expiryError;
        
        // Proveedor
        const supplierError = Validators.required(medicineData.supplier, 'Proveedor') ||
                             Validators.maxLength(medicineData.supplier, 100, 'Proveedor');
        if (supplierError) errors.supplier = supplierError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Validador para login
    static validateLogin(loginData) {
        const errors = {};
        
        // Usuario
        const usernameError = Validators.required(loginData.username, 'Usuario') ||
                             Validators.minLength(loginData.username, 3, 'Usuario') ||
                             Validators.maxLength(loginData.username, 20, 'Usuario');
        if (usernameError) errors.username = usernameError;
        
        // Contraseña
        const passwordError = Validators.required(loginData.password, 'Contraseña') ||
                             Validators.minLength(loginData.password, 3, 'Contraseña');
        if (passwordError) errors.password = passwordError;
        
        // Rol
        const roleError = Validators.required(loginData.role, 'Rol') ||
                         Validators.selection(loginData.role, ['admin', 'employee'], 'Rol');
        if (roleError) errors.role = roleError;
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Validador para búsqueda
    static validateSearch(searchData) {
        const errors = {};
        
        if (searchData.query && searchData.query.length > 100) {
            errors.query = 'La búsqueda no puede tener más de 100 caracteres';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Validador para reportes
    static validateReport(reportData) {
        const errors = {};
        
        // Tipo de reporte
        const typeError = Validators.required(reportData.type, 'Tipo de Reporte') ||
                         Validators.selection(reportData.type, ['consumption', 'mostUsed', 'inventory'], 'Tipo de Reporte');
        if (typeError) errors.type = typeError;
        
        // Fechas (si aplican)
        if (reportData.dateFrom || reportData.dateTo) {
            const dateFromError = Validators.date(reportData.dateFrom, 'Fecha Desde');
            if (dateFromError) errors.dateFrom = dateFromError;
            
            const dateToError = Validators.date(reportData.dateTo, 'Fecha Hasta');
            if (dateToError) errors.dateTo = dateToError;
            
            // Validar que fecha desde sea menor que fecha hasta
            if (reportData.dateFrom && reportData.dateTo) {
                const fromDate = new Date(reportData.dateFrom);
                const toDate = new Date(reportData.dateTo);
                
                if (fromDate > toDate) {
                    errors.dateFrom = 'La fecha desde debe ser anterior a la fecha hasta';
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Validador genérico para formularios
    static validateForm(formElement, validationRules) {
        const errors = {};
        const formData = new FormData(formElement);
        
        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const value = formData.get(fieldName);
            
            for (const rule of rules) {
                const error = rule.validator(value, rule.fieldName || fieldName);
                if (error) {
                    errors[fieldName] = error;
                    break; // Solo mostrar el primer error por campo
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            data: Object.fromEntries(formData)
        };
    }

    // Mostrar errores en el formulario
    static displayFormErrors(errors, formElement) {
        // Limpiar errores anteriores
        Validators.clearFormErrors(formElement);
        
        for (const [fieldName, errorMessage] of Object.entries(errors)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                // Agregar clase de error al campo
                field.classList.add('error');
                
                // Crear elemento de error
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.textContent = errorMessage;
                
                // Insertar después del campo
                field.parentNode.insertBefore(errorElement, field.nextSibling);
            }
        }
    }

    // Limpiar errores del formulario
    static clearFormErrors(formElement) {
        // Remover clases de error
        const errorFields = formElement.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        // Remover mensajes de error
        const errorMessages = formElement.querySelectorAll('.field-error');
        errorMessages.forEach(message => message.remove());
    }

    // Validación en tiempo real
    static setupRealTimeValidation(formElement, validationRules) {
        for (const fieldName of Object.keys(validationRules)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    const value = field.value;
                    const rules = validationRules[fieldName];
                    
                    // Limpiar error anterior
                    field.classList.remove('error');
                    const existingError = field.nextSibling;
                    if (existingError && existingError.classList && existingError.classList.contains('field-error')) {
                        existingError.remove();
                    }
                    
                    // Validar campo
                    for (const rule of rules) {
                        const error = rule.validator(value, rule.fieldName || fieldName);
                        if (error) {
                            field.classList.add('error');
                            const errorElement = document.createElement('div');
                            errorElement.className = 'field-error';
                            errorElement.textContent = error;
                            field.parentNode.insertBefore(errorElement, field.nextSibling);
                            break;
                        }
                    }
                });
            }
        }
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.Validators = Validators;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}