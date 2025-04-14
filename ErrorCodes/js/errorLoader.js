/**
 * errorLoader.js - Manejo de procesamiento de archivos JSON
 * 
 * Este script carga y procesa archivos JSON previamente guardados
 * y muestra sus datos en una tabla dinámica. La primera entrada se toma como títulos de columnas.
 */

// Ya no necesitamos la biblioteca SheetJS (xlsx)
// Inicializamos el cargador de JSON directamente
(function() {
    console.log('Inicializando cargador de JSON');
    initExcelLoader();
})();

// Variables globales para manejar los datos del JSON
let jsonData = null;
let jsonHeaders = null;
let currentSearchResults = [];
let itemsPerPage = 10;
let currentPage = 1;

// Función para determinar la ruta base según el entorno (GitHub Pages o local)
function getBasePath() {
    // Verificar si estamos en GitHub Pages (la URL contiene github.io)
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // En GitHub Pages, necesitamos incluir el nombre del repositorio en la ruta
        const pathSegments = window.location.pathname.split('/');
        
        // Eliminar segmentos vacíos
        const filteredSegments = pathSegments.filter(segment => segment.length > 0);
        
        // El primer segmento no vacío es el nombre del repositorio
        const repoName = filteredSegments.length > 0 ? filteredSegments[0] : '';
        
        console.log("Ejecutando en GitHub Pages. Nombre del repositorio:", repoName);
        console.log("Ruta base ajustada a: /" + repoName);
        
        return repoName ? '/' + repoName : '';
    } else {
        // En desarrollo local
        console.log("Ejecutando en entorno local. Ruta base: ''");
        return '';
    }
}

function initExcelLoader() {
    // Elementos DOM
    const searchContainer = document.getElementById('searchContainer');
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const errorCodeFilter = document.getElementById('errorCodeFilter');
    const resultsTable = document.getElementById('resultsTable');
    const resultsTableHead = document.getElementById('resultsTableHead');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    
    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    resetBtn.addEventListener('click', resetSearch);
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));
    
    // Cuando cambia el modelo, intentamos cargar el JSON de esa carpeta
    modelFilter.addEventListener('change', tryLoadJsonForSelection);
    
    // Intenta cargar un JSON basado en la selección actual
    function tryLoadJsonForSelection() {
        const brand = brandFilter.value;
        const model = modelFilter.value;
        
        if (brand && model) {
            // Ocultamos el buscador mientras cargamos el JSON
            searchContainer.style.display = 'none';
            
            // Obtener la ruta base según el entorno
            const basePath = getBasePath();
            
            // Ruta base de la carpeta que contiene los archivos JSON
            const folderPath = `${basePath}/ErrorCodes/Databases/${brand}/${model}`;
            console.log(`Buscando archivo JSON en la carpeta: ${folderPath}`);
            
            // Ruta del archivo JSON
            const jsonPath = `${folderPath}/errores.json`;
            loadJsonFile(jsonPath);
        }
    }

    /**
     * Carga el archivo JSON desde la ruta especificada
     */
    function loadJsonFile(jsonPath) {
        // Mostrar indicador de carga
        resultsCount.textContent = 'Cargando archivo JSON...';
        noResults.textContent = 'Cargando datos. Por favor espere...';
        noResults.style.display = 'block';
        resultsTable.style.display = 'none';
        
        console.log("Intentando cargar JSON desde:", jsonPath);
        
        fetch(jsonPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`No se encontró el archivo JSON en ${jsonPath}`);
                }
                return response.json();
            })
            .then(processJsonData)
            .catch(error => {
                console.error('Error al cargar el archivo JSON:', error);
                alert(`No se pudo cargar el archivo JSON. Asegúrate de que existe el archivo errores.json en la carpeta seleccionada.`);
                resetJsonData();
            });
    }
    
    /**
     * Procesa los datos del JSON
     */
    function processJsonData(data) {
        try {
            // Verifica que hay datos
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('El archivo JSON no contiene datos válidos');
            }
            
            // Extrae los encabezados de las claves del primer objeto
            jsonHeaders = Object.keys(data[0]);
            
            // Guarda los datos
            jsonData = data;
            
            // Convierte los datos a formato de filas para la tabla
            const tableData = jsonData.map(item => jsonHeaders.map(header => item[header]));
            
            // Muestra los datos en la tabla
            displayJsonData(tableData);
            
            // Muestra el buscador de códigos de error ahora que el JSON está cargado
            searchContainer.style.display = 'flex';
            
            console.log('Archivo JSON cargado correctamente');
        } catch (error) {
            console.error('Error al procesar el archivo JSON:', error);
            alert(`Error al procesar el archivo JSON: ${error.message}`);
            resetJsonData();
        }
    }
    
    /**
     * Muestra los datos del JSON en la tabla
     */
    function displayJsonData(data, isSearchResult = false) {
        // Almacena los resultados actuales si es una búsqueda
        if (isSearchResult) {
            currentSearchResults = data;
        } else {
            currentSearchResults = data.slice(); // Copia todos los datos
        }
        
        // Actualiza el contador de resultados
        resultsCount.textContent = `${currentSearchResults.length} códigos de error encontrados`;
        
        // Mostrar/ocultar mensaje de no resultados
        noResults.style.display = currentSearchResults.length === 0 ? 'block' : 'none';
        resultsTable.style.display = currentSearchResults.length === 0 ? 'none' : 'table';
        
        // Reinicia la paginación
        currentPage = 1;
        updatePagination();
        
        // Crea los encabezados de la tabla
        const headerRow = document.createElement('tr');
        
        // Agrega los encabezados del JSON
        jsonHeaders.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        // Limpia los encabezados existentes y agrega los nuevos
        resultsTableHead.innerHTML = '';
        resultsTableHead.appendChild(headerRow);
        
        // Muestra la página actual
        displayCurrentPage();
    }
    
    /**
     * Muestra la página actual de resultados
     */
    function displayCurrentPage() {
        // Limpia el cuerpo de la tabla
        resultsBody.innerHTML = '';
        
        // Calcula los índices para la página actual
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, currentSearchResults.length);
        
        // Muestra los datos de la página actual
        for (let i = startIdx; i < endIdx; i++) {
            const row = currentSearchResults[i];
            const tr = document.createElement('tr');
            
            // Agrega las celdas con los datos
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            
            resultsBody.appendChild(tr);
        }
        
        // Actualiza el texto de la página actual
        currentPageSpan.textContent = `Página ${currentPage} de ${getTotalPages()}`;
    }
    
    /**
     * Actualiza los controles de paginación
     */
    function updatePagination() {
        const totalPages = getTotalPages();
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        currentPageSpan.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    
    /**
     * Cambia a la página anterior o siguiente
     */
    function changePage(direction) {
        const newPage = currentPage + direction;
        const totalPages = getTotalPages();
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            displayCurrentPage();
            updatePagination();
        }
    }
    
    /**
     * Obtiene el número total de páginas
     */
    function getTotalPages() {
        return Math.max(1, Math.ceil(currentSearchResults.length / itemsPerPage));
    }
    
    /**
     * Realiza una búsqueda en los datos del JSON
     */
    function performSearch() {
        if (!jsonData) return;
        
        const searchTerm = errorCodeFilter.value.trim().toLowerCase();
        
        // Si no hay término de búsqueda, muestra todos los datos
        if (!searchTerm) {
            // Convertir los datos JSON a formato de filas para la tabla
            const tableData = jsonData.map(item => jsonHeaders.map(header => item[header]));
            displayJsonData(tableData);
            return;
        }
        
        // Filtra los datos según los criterios
        const filteredData = jsonData
            .filter(item => {
                // Verifica si algún valor contiene el término de búsqueda
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                );
            })
            .map(item => jsonHeaders.map(header => item[header])); // Convierte a formato de filas
        
        // Muestra los resultados filtrados
        displayJsonData(filteredData, true);
    }
    
    /**
     * Reinicia la búsqueda y muestra todos los datos
     */
    function resetSearch() {
        errorCodeFilter.value = '';
        
        // Si hay datos cargados, muestra todos
        if (jsonData) {
            // Convertir los datos JSON a formato de filas para la tabla
            const tableData = jsonData.map(item => jsonHeaders.map(header => item[header]));
            displayJsonData(tableData);
        }
    }
    
    /**
     * Reinicia los datos del JSON
     */
    function resetJsonData() {
        jsonData = null;
        jsonHeaders = null;
        currentSearchResults = [];
        searchContainer.style.display = 'none'; // Oculta el buscador cuando no hay datos
        resultsTable.style.display = 'none';
        noResults.style.display = 'block';
        noResults.textContent = 'No se encontraron códigos de error con los criterios especificados.';
        resultsCount.textContent = '0 códigos de error encontrados';
    }
}