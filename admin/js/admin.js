// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Referencias DOM
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMsg = document.getElementById('errorMsg');
const errorMsgContainer = document.getElementById('errorMsgContainer');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDisplay = document.getElementById('userEmail');

// Referencias para las pestañas
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Referencias para el modal de error
const errorModal = document.getElementById('errorModal');
const modalTitle = document.getElementById('modalTitle');
const errorForm = document.getElementById('errorForm');
const saveErrorBtn = document.getElementById('saveErrorBtn');
const cancelErrorBtn = document.getElementById('cancelErrorBtn');
const addErrorBtn = document.getElementById('addErrorBtn');
const closeModalBtn = document.querySelector('.close-modal');
const modalError = document.getElementById('modalError');
const addLinkBtn = document.getElementById('addLinkBtn');

// Referencias para la búsqueda de errores
const errorSearchBtn = document.getElementById('errorSearchBtn');
const errorSearchInput = document.getElementById('errorSearchInput');
const errorBrandFilter = document.getElementById('errorBrandFilter');
const errorsTableBody = document.getElementById('errorsTableBody');

// API URLs
const apiBaseUrl = '/api/errorcodes';

// Estado de la aplicación
let currentUser = null;
let errorCodes = [];
let currentPage = 1;
let errorsPerPage = 10;
let totalPages = 1;

// Evento para el inicio de sesión con Google
googleLoginBtn.addEventListener('click', async function() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Error de inicio de sesión con Google:', error);
        let errorMessage = 'Error al iniciar sesión. Intente nuevamente.';
        
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = 'La ventana emergente fue bloqueada. Por favor, permita las ventanas emergentes e intente nuevamente.';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = 'El proceso de inicio de sesión fue cancelado. Intente nuevamente.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'Ya existe una cuenta asociada con esta dirección de correo electrónico.';
                break;
            default:
                errorMessage = `Error al iniciar sesión: ${error.message}`;
                break;
        }
        
        showLoginError(errorMessage);
    }
});

// Cerrar sesión
logoutBtn.addEventListener('click', async function() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});

// Observador de estado de autenticación
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuario autenticado
        currentUser = user;
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email || user.displayName;
        
        // Cargar datos iniciales
        loadErrorCodes();
        loadStatsData();
    } else {
        // Usuario no autenticado
        currentUser = null;
        loginContainer.style.display = 'flex';
        adminContainer.style.display = 'none';
        userEmailDisplay.textContent = '';
    }
});

// Cambio de pestañas
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Desactivar todas las pestañas
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activar la pestaña seleccionada
        this.classList.add('active');
        document.getElementById(tabId + 'Tab').classList.add('active');
    });
});

// Cargar códigos de error desde la API
async function loadErrorCodes() {
    try {
        const response = await fetch(apiBaseUrl);
        
        if (!response.ok) {
            throw new Error('Error al cargar los códigos de error');
        }
        
        errorCodes = await response.json();
        
        // Actualizar la tabla
        updateErrorsTable(errorCodes);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('Error al cargar los datos. Por favor, intente nuevamente.', 'error');
    }
}

// Buscar códigos de error
errorSearchBtn.addEventListener('click', searchErrors);

async function searchErrors() {
    try {
        const searchTerm = errorSearchInput.value.trim();
        const brand = errorBrandFilter.value.trim();
        
        // Construir la URL de consulta
        let url = `${apiBaseUrl}/search?`;
        if (brand) url += `brand=${encodeURIComponent(brand)}&`;
        if (searchTerm) {
            // Buscar en código, modelo o título
            url += `q=${encodeURIComponent(searchTerm)}&`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error al buscar códigos de error');
        }
        
        errorCodes = await response.json();
        
        // Actualizar la tabla con los resultados
        updateErrorsTable(errorCodes);
    } catch (error) {
        console.error('Error al buscar:', error);
        showNotification('Error al buscar. Por favor, intente nuevamente.', 'error');
    }
}

// Actualizar la tabla de errores con paginación
function updateErrorsTable(data) {
    errorsTableBody.innerHTML = '';
    
    // Calcular paginación
    totalPages = Math.ceil(data.length / errorsPerPage);
    const startIndex = (currentPage - 1) * errorsPerPage;
    const endIndex = Math.min(startIndex + errorsPerPage, data.length);
    const currentPageData = data.slice(startIndex, endIndex);
    
    if (currentPageData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No se encontraron códigos de error</td>
        `;
        errorsTableBody.appendChild(emptyRow);
    } else {
        // Crear filas para los datos
        currentPageData.forEach(errorCode => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${errorCode.id}</td>
                <td>${errorCode.errorCode}</td>
                <td>${errorCode.brandName}</td>
                <td>${errorCode.model}</td>
                <td>${errorCode.title}</td>
                <td>
                    <span class="severity-badge severity-${errorCode.severity}">
                        ${getSeverityText(errorCode.severity)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-edit" data-id="${errorCode.id}">Editar</button>
                        <button class="btn btn-small btn-delete" data-id="${errorCode.id}">Eliminar</button>
                    </div>
                </td>
            `;
            
            errorsTableBody.appendChild(row);
        });
        
        // Añadir event listeners para los botones de acciones
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', () => editError(parseInt(button.dataset.id)));
        });
        
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', () => deleteError(parseInt(button.dataset.id)));
        });
    }
    
    // Actualizar la paginación
    updatePagination(data.length);
}

// Actualizar controles de paginación
function updatePagination(totalItems) {
    const paginationContainer = document.getElementById('errorsPagination');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botón de página anterior
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.classList.add('btn', 'btn-small');
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateErrorsTable(errorCodes);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('btn', 'btn-small');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateErrorsTable(errorCodes);
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Botón de página siguiente
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.classList.add('btn', 'btn-small');
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateErrorsTable(errorCodes);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Convertir nivel de severidad a texto
function getSeverityText(severity) {
    switch(severity) {
        case 'bajo': return 'Bajo';
        case 'medio': return 'Medio';
        case 'alto': return 'Alto';
        case 'crítico': return 'Crítico';
        default: return 'No especificado';
    }
}

// Abrir modal para agregar código de error
addErrorBtn.addEventListener('click', function() {
    modalTitle.textContent = 'Agregar Código de Error';
    resetErrorForm();
    openModal();
});

// Editar código de error
function editError(id) {
    const errorToEdit = errorCodes.find(error => error.id === id);
    if (!errorToEdit) return;
    
    modalTitle.textContent = `Editar Código de Error: ${errorToEdit.errorCode}`;
    
    // Llenar el formulario con los datos
    document.getElementById('errorId').value = errorToEdit.id;
    document.getElementById('errorCode').value = errorToEdit.errorCode;
    document.getElementById('errorBrand').value = errorToEdit.brand;
    document.getElementById('errorModel').value = errorToEdit.model;
    document.getElementById('errorTitle').value = errorToEdit.title;
    document.getElementById('errorDescription').value = errorToEdit.description;
    document.getElementById('errorSeverity').value = errorToEdit.severity;
    document.getElementById('errorDiagram').value = errorToEdit.diagram || '';
    
    // Causas y soluciones (convertir arrays a texto con líneas)
    document.getElementById('errorCauses').value = errorToEdit.causes.join('\n');
    document.getElementById('errorSolutions').value = errorToEdit.solutions.join('\n');
    
    // Enlaces a manuales
    const manualLinksContainer = document.getElementById('manualLinksContainer');
    manualLinksContainer.innerHTML = '';
    
    if (errorToEdit.manualLinks && errorToEdit.manualLinks.length > 0) {
        errorToEdit.manualLinks.forEach(link => {
            addManualLinkRow(link.text, link.url);
        });
    } else {
        addManualLinkRow('', '');
    }
    
    openModal();
}

// Eliminar código de error
async function deleteError(id) {
    if (!confirm('¿Está seguro de que desea eliminar este código de error? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`${apiBaseUrl}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el código de error');
        }
        
        // Actualizar datos después de eliminar
        loadErrorCodes();
        loadStatsData();
        showNotification('Código de error eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error al eliminar:', error);
        showNotification('Error al eliminar el código de error', 'error');
    }
}

// Cargar datos estadísticos
async function loadStatsData() {
    try {
        // Cargar estadísticas generales
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        
        const stats = await response.json();
        
        // Actualizar valores de estadísticas
        document.getElementById('totalErrorsCount').textContent = stats.totalErrors || 0;
        document.getElementById('totalBrandsCount').textContent = stats.totalBrands || 0;
        document.getElementById('lastUpdateDate').textContent = stats.lastUpdate || 'No disponible';
        
        // Aquí se implementaría la lógica para los gráficos
        // Por ejemplo, usando Chart.js para crear gráficos de distribución
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Guardar código de error
saveErrorBtn.addEventListener('click', saveError);

async function saveError() {
    // Validar formulario
    if (!validateErrorForm()) {
        return;
    }
    
    try {
        // Recopilar datos del formulario
        const errorId = document.getElementById('errorId').value;
        const isEditing = errorId !== '';
        
        // Construir objeto de datos
        const errorData = {
            errorCode: document.getElementById('errorCode').value,
            brand: document.getElementById('errorBrand').value,
            brandName: document.getElementById('errorBrand').options[document.getElementById('errorBrand').selectedIndex].text,
            model: document.getElementById('errorModel').value,
            title: document.getElementById('errorTitle').value,
            description: document.getElementById('errorDescription').value,
            severity: document.getElementById('errorSeverity').value,
            causes: document.getElementById('errorCauses').value.split('\n').filter(cause => cause.trim() !== ''),
            solutions: document.getElementById('errorSolutions').value.split('\n').filter(solution => solution.trim() !== ''),
            diagram: document.getElementById('errorDiagram').value || null
        };
        
        // Recopilar enlaces a manuales
        const manualLinks = [];
        document.querySelectorAll('.manual-link-row').forEach(row => {
            const textInput = row.querySelector('.manual-link-text');
            const urlInput = row.querySelector('.manual-link-url');
            
            if (textInput.value.trim() && urlInput.value.trim()) {
                manualLinks.push({
                    text: textInput.value.trim(),
                    url: urlInput.value.trim()
                });
            }
        });
        
        errorData.manualLinks = manualLinks;
        
        // Determinar si es una actualización o una creación
        let url = apiBaseUrl;
        let method = 'POST';
        
        if (isEditing) {
            url = `${apiBaseUrl}/${errorId}`;
            method = 'PUT';
        }
        
        // Enviar datos a la API
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorData)
        });
        
        if (!response.ok) {
            throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el código de error`);
        }
        
        // Cerrar modal y actualizar datos
        closeModal();
        loadErrorCodes();
        loadStatsData();
        showNotification(`Código de error ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');
    } catch (error) {
        console.error('Error al guardar:', error);
        modalError.textContent = error.message;
    }
}

// Validar formulario de error
function validateErrorForm() {
    const requiredFields = [
        'errorBrand',
        'errorModel',
        'errorCode',
        'errorTitle',
        'errorDescription',
        'errorCauses',
        'errorSolutions'
    ];
    
    let isValid = true;
    modalError.textContent = '';
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        modalError.textContent = 'Por favor, complete todos los campos requeridos.';
    }
    
    return isValid;
}

// Agregar fila de enlace manual
addLinkBtn.addEventListener('click', function() {
    addManualLinkRow('', '');
});

function addManualLinkRow(text, url) {
    const container = document.getElementById('manualLinksContainer');
    const row = document.createElement('div');
    row.className = 'manual-link-row';
    
    row.innerHTML = `
        <input type="text" class="manual-link-text" placeholder="Texto del enlace" value="${escapeHTML(text)}">
        <input type="text" class="manual-link-url" placeholder="URL del manual" value="${escapeHTML(url)}">
        <button type="button" class="btn btn-small btn-remove">-</button>
    `;
    
    container.appendChild(row);
    
    // Event listener para el botón de eliminar
    row.querySelector('.btn-remove').addEventListener('click', function() {
        if (container.childElementCount > 1) {
            container.removeChild(row);
        } else {
            row.querySelector('.manual-link-text').value = '';
            row.querySelector('.manual-link-url').value = '';
        }
    });
}

// Funciones de utilidad
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showLoginError(message) {
    errorMsg.textContent = message;
    errorMsgContainer.style.display = 'block';
}

function clearLoginForm() {
    loginForm.reset();
    errorMsgContainer.style.display = 'none';
}

function openModal() {
    errorModal.style.display = 'block';
    modalError.textContent = '';
}

function closeModal() {
    errorModal.style.display = 'none';
    resetErrorForm();
}

function resetErrorForm() {
    errorForm.reset();
    document.getElementById('errorId').value = '';
    document.getElementById('manualLinksContainer').innerHTML = '';
    addManualLinkRow('', '');
    modalError.textContent = '';
    
    // Limpiar clases de error
    const formFields = errorForm.querySelectorAll('input, select, textarea');
    formFields.forEach(field => field.classList.remove('error'));
}

// Event listeners para cerrar modal
closeModalBtn.addEventListener('click', closeModal);
cancelErrorBtn.addEventListener('click', closeModal);

// Mostrar notificación
function showNotification(message, type) {
    // Esta función puede ser implementada para mostrar notificaciones al usuario
    // Por ahora, usamos alert para simplificar
    alert(message);
}

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario ya está autenticado
    const user = auth.currentUser;
    if (user) {
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        loadErrorCodes();
        loadStatsData();
    }
});