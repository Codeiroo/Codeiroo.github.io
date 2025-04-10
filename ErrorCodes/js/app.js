document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    const errorCodeFilter = document.getElementById('errorCodeFilter');
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const errorDetail = document.getElementById('errorDetail');
    const closeDetailBtn = document.getElementById('closeDetail');
    const initDbBtn = document.getElementById('initDbBtn');
    const dbStatus = document.getElementById('dbStatus');
    
    // Variables de estado
    let filteredErrors = [];
    let currentPage = 1;
    const errorsPerPage = 10;
    const apiBaseUrl = '/api/errorcodes'; // URL base para la API

    // Ocultar detalles al inicio
    errorDetail.style.display = 'none';

    // Inicializar tabla
    updateResults([]);
    
    // Event Listeners
    searchBtn.addEventListener('click', performSearch);
    resetBtn.addEventListener('click', resetFilters);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    closeDetailBtn.addEventListener('click', hideErrorDetails);
    initDbBtn.addEventListener('click', initializeDatabase);

    // También permitir búsqueda al presionar Enter en los campos de filtro
    [modelFilter, errorCodeFilter].forEach(filter => {
        filter.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    });

    /**
     * Realiza la búsqueda basada en los filtros
     */
    async function performSearch() {
        try {
            const brand = brandFilter.value.toLowerCase().trim();
            const model = modelFilter.value.toLowerCase().trim();
            const errorCode = errorCodeFilter.value.toLowerCase().trim();
            
            // Construir la URL de consulta
            let url = `${apiBaseUrl}/search?`;
            if (brand) url += `brand=${encodeURIComponent(brand)}&`;
            if (model) url += `model=${encodeURIComponent(model)}&`;
            if (errorCode) url += `errorCode=${encodeURIComponent(errorCode)}&`;
            
            // Mostrar estado de carga
            resultsCount.textContent = 'Cargando...';
            resultsTable.style.display = 'none';
            noResults.style.display = 'none';
            
            // Realizar la petición a la API
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Error al obtener datos de la API');
            }
            
            filteredErrors = await response.json();
            
            // Resetear a la primera página
            currentPage = 1;
            
            // Mostrar resultados
            updateResults(filteredErrors);
        } catch (error) {
            console.error('Error al buscar errores:', error);
            resultsCount.textContent = 'Error al cargar datos';
            noResults.style.display = 'block';
            noResults.textContent = 'Error al comunicarse con el servidor. Por favor, intente nuevamente más tarde.';
            resultsTable.style.display = 'none';
        }
    }
    
    /**
     * Restablece todos los filtros
     */
    function resetFilters() {
        brandFilter.value = '';
        modelFilter.value = '';
        errorCodeFilter.value = '';
        
        // Limpiar resultados
        filteredErrors = [];
        currentPage = 1;
        updateResults([]);
    }
    
    /**
     * Actualiza la tabla de resultados
     */
    function updateResults(errors) {
        // Calcular paginación
        const totalErrors = errors.length;
        const totalPages = Math.ceil(totalErrors / errorsPerPage);
        const startIndex = (currentPage - 1) * errorsPerPage;
        const endIndex = Math.min(startIndex + errorsPerPage, totalErrors);
        const currentErrors = errors.slice(startIndex, endIndex);
        
        // Actualizar contador
        resultsCount.textContent = `${totalErrors} código${totalErrors !== 1 ? 's' : ''} de error encontrado${totalErrors !== 1 ? 's' : ''}`;
        
        // Actualizar paginación
        currentPageSpan.textContent = `Página ${currentPage} de ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
        
        // Mostrar mensaje de no resultados si aplica
        if (currentErrors.length === 0) {
            resultsTable.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            resultsTable.style.display = 'table';
            noResults.style.display = 'none';
            
            // Limpiar tabla
            resultsBody.innerHTML = '';
            
            // Generar filas
            currentErrors.forEach(error => {
                const row = document.createElement('tr');
                
                // Celda Marca
                const brandCell = document.createElement('td');
                brandCell.textContent = error.brandName;
                row.appendChild(brandCell);
                
                // Celda Modelo
                const modelCell = document.createElement('td');
                modelCell.textContent = error.model;
                row.appendChild(modelCell);
                
                // Celda Código
                const codeCell = document.createElement('td');
                codeCell.textContent = error.errorCode;
                row.appendChild(codeCell);
                
                // Celda Descripción
                const descCell = document.createElement('td');
                descCell.textContent = error.description;
                row.appendChild(descCell);
                
                // Celda Acciones
                const actionsCell = document.createElement('td');
                const viewButton = document.createElement('button');
                viewButton.textContent = 'Ver detalles';
                viewButton.classList.add('view-details-btn');
                viewButton.addEventListener('click', () => showErrorDetails(error));
                actionsCell.appendChild(viewButton);
                row.appendChild(actionsCell);
                
                resultsBody.appendChild(row);
            });
        }
    }
    
    /**
     * Navega a la página anterior
     */
    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            updateResults(filteredErrors);
        }
    }
    
    /**
     * Navega a la página siguiente
     */
    function goToNextPage() {
        const totalPages = Math.ceil(filteredErrors.length / errorsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateResults(filteredErrors);
        }
    }
    
    /**
     * Muestra los detalles de un error específico
     */
    function showErrorDetails(error) {
        // Actualizar el contenido de la sección de detalles
        document.getElementById('detailErrorCode').textContent = error.errorCode;
        document.getElementById('detailErrorCode2').textContent = error.errorCode;
        document.getElementById('detailErrorTitle').textContent = error.title;
        document.getElementById('detailModel').textContent = error.model;
        document.getElementById('detailDescription').textContent = error.description;
        
        // Logo de la marca (simulado con texto por ahora)
        document.getElementById('detailBrandLogo').textContent = error.brandName[0];
        document.getElementById('detailBrandLogo').classList.add(error.brand);
        
        // Listas de causas y soluciones
        const causesList = document.getElementById('detailCauses');
        causesList.innerHTML = '';
        error.causes.forEach(cause => {
            const li = document.createElement('li');
            li.textContent = cause;
            causesList.appendChild(li);
        });
        
        const solutionsList = document.getElementById('detailSolutions');
        solutionsList.innerHTML = '';
        error.solutions.forEach(solution => {
            const li = document.createElement('li');
            li.textContent = solution;
            solutionsList.appendChild(li);
        });
        
        // Nivel de gravedad
        const severityDiv = document.getElementById('detailSeverity');
        severityDiv.innerHTML = '';
        const severityIndicator = document.createElement('div');
        severityIndicator.classList.add('severity-indicator', `severity-${error.severity}`);
        
        const severityText = document.createElement('span');
        let severityLabel;
        switch(error.severity) {
            case 'bajo':
                severityLabel = 'Bajo - Informativo';
                break;
            case 'medio':
                severityLabel = 'Medio - Precaución';
                break;
            case 'alto':
                severityLabel = 'Alto - Atención Inmediata';
                break;
            case 'crítico':
                severityLabel = 'Crítico - Peligro';
                break;
            default:
                severityLabel = 'No especificado';
        }
        severityText.textContent = severityLabel;
        
        severityDiv.appendChild(severityIndicator);
        severityDiv.appendChild(severityText);
        
        // Imagen o diagrama
        const diagramContainer = document.getElementById('detailDiagramContainer');
        const diagramImage = document.getElementById('detailDiagram');
        
        if (error.diagram) {
            diagramImage.src = error.diagram;
            diagramContainer.style.display = 'block';
        } else {
            diagramContainer.style.display = 'none';
        }
        
        // Enlaces a manuales
        const linksDiv = document.getElementById('detailLinks');
        linksDiv.innerHTML = '';
        
        if (error.manualLinks && error.manualLinks.length > 0) {
            error.manualLinks.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.textContent = link.text;
                a.target = '_blank';
                a.classList.add('manual-link');
                linksDiv.appendChild(a);
                
                // Agregar separador excepto en el último enlace
                if (link !== error.manualLinks[error.manualLinks.length - 1]) {
                    const separator = document.createElement('span');
                    separator.textContent = ' | ';
                    separator.classList.add('link-separator');
                    linksDiv.appendChild(separator);
                }
            });
        } else {
            linksDiv.textContent = 'No hay enlaces disponibles';
        }
        
        // Mostrar la sección de detalles
        errorDetail.style.display = 'block';
        
        // Desplazarse a la sección de detalles
        errorDetail.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Oculta la sección de detalles
     */
    function hideErrorDetails() {
        errorDetail.style.display = 'none';
        // Limpiar clase de marca
        document.getElementById('detailBrandLogo').className = 'brand-logo';
    }
    
    // Cargar datos al inicio
    performSearch();
    
    // Función para inicializar la base de datos (solo para desarrollo)
    // Añadir un botón en la UI para llamar a esta función si es necesario
    async function initializeDatabase() {
        try {
            // Cambiar el estado del botón
            initDbBtn.disabled = true;
            dbStatus.textContent = 'Inicializando base de datos...';
            
            const response = await fetch('/api/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al inicializar la base de datos');
            }
            
            const result = await response.json();
            dbStatus.textContent = `Base de datos inicializada correctamente: ${result.count} registros importados.`;
            dbStatus.classList.add('success');
            
            // Recargar datos
            performSearch();
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            dbStatus.textContent = 'Error al inicializar la base de datos. Ver consola para detalles.';
            dbStatus.classList.add('error');
        } finally {
            initDbBtn.disabled = false;
            
            // Limpiar el mensaje después de 5 segundos
            setTimeout(() => {
                dbStatus.textContent = '';
                dbStatus.className = '';
            }, 5000);
        }
    }
    
    // Exponer la función para que sea accesible desde la consola para pruebas
    window.initializeDatabase = initializeDatabase;
});