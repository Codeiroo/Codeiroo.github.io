/**
 * excelLoader.js - Manejo de procesamiento de archivos Excel
 * 
 * Este script carga y procesa archivos Excel (.xlsx, .xls) previamente guardados
 * y muestra sus datos en una tabla dinámica. La primera fila se toma como títulos de columnas.
 */

// Necesitamos incluir SheetJS (xlsx.full.min.js) para manejar archivos Excel
// Cargamos la biblioteca dinámicamente
(function loadXLSXLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = function() {
        console.log('Biblioteca XLSX cargada correctamente');
        initExcelLoader();
    };
    script.onerror = function() {
        console.error('Error al cargar la biblioteca XLSX');
        alert('No se pudo cargar la biblioteca para procesar archivos Excel. Verifique su conexión a Internet.');
    };
    document.head.appendChild(script);
})();

// Variables globales para manejar los datos del Excel
let excelData = null;
let excelHeaders = null;
let currentSearchResults = [];
let itemsPerPage = 10;
let currentPage = 1;

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
    
    // Cuando cambia el modelo, intentamos cargar el Excel de esa carpeta
    modelFilter.addEventListener('change', tryLoadExcelForSelection);
    
    // Intenta cargar un Excel basado en la selección actual
    function tryLoadExcelForSelection() {
        const brand = brandFilter.value;
        const model = modelFilter.value;
        
        if (brand && model) {
            // Ocultamos el buscador mientras cargamos el Excel
            searchContainer.style.display = 'none';
            
            // Ruta base de la carpeta que contiene los archivos Excel
            const folderPath = `Databases/${brand}/${model}`;
            console.log(`Buscando archivos Excel en la carpeta: ${folderPath}`);
            
            // Intenta buscar archivos Excel en la carpeta
            findAndLoadExcelInFolder(folderPath);
        }
    }

    /**
     * Busca y carga el primer archivo Excel encontrado en la carpeta especificada
     */
    function findAndLoadExcelInFolder(folderPath) {
        // Mostrar indicador de carga
        resultsCount.textContent = 'Buscando archivo Excel...';
        noResults.textContent = 'Buscando archivo Excel. Por favor espere...';
        noResults.style.display = 'block';
        resultsTable.style.display = 'none';
        
        // Array de extensiones de Excel comunes a probar
        const excelExtensions = ['.xlsx', '.xls', '.xlsm'];
        
        // Lista de nombres de archivo a intentar (incluyendo nombre de la carpeta + genéricos)
        const possibleFileNames = [
            `${folderPath.split('/').pop()}`, // Nombre basado en la carpeta
            'errores',
            'codigos_de_error',
            'Codigos_de_Error',
            'Codigos_de_Error_Schneider',
            'errors',
            'data'
        ];
        
        // Construir una lista de todas las combinaciones posibles
        const pathsToTry = [];
        
        // Crear todas las combinaciones de ruta posibles
        possibleFileNames.forEach(name => {
            excelExtensions.forEach(ext => {
                pathsToTry.push(`${folderPath}/${name}${ext}`);
            });
        });
        
        // Función para intentar cargar un archivo de la lista de rutas
        function tryNextPath(index) {
            if (index >= pathsToTry.length) {
                // Si hemos probado todas las rutas y ninguna funciona,
                // intentemos un último método: cargar directamente cualquier xlsx en la carpeta
                const lastResortPath = `${folderPath}/index.xlsx`;
                console.log(`Último intento con: ${lastResortPath}`);
                
                fetch(lastResortPath)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`No se encontró ningún archivo Excel en ${folderPath}`);
                        }
                        return response.arrayBuffer();
                    })
                    .then(processExcelData)
                    .catch(error => {
                        console.error('Error en el último intento:', error);
                        alert(`No se pudo encontrar un archivo Excel en la carpeta seleccionada. Por favor, verifica que existe un archivo Excel en la carpeta ${folderPath}.`);
                        resetExcelData();
                    });
                return;
            }
            
            const path = pathsToTry[index];
            console.log(`Intentando cargar: ${path}`);
            
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        // Si este archivo no existe, intenta el siguiente
                        console.log(`No se encontró el archivo en: ${path}`);
                        tryNextPath(index + 1);
                        return null;
                    }
                    console.log(`¡Archivo Excel encontrado!: ${path}`);
                    return response.arrayBuffer();
                })
                .then(data => {
                    if (data) {
                        processExcelData(data);
                    }
                })
                .catch(error => {
                    console.error(`Error al intentar cargar ${path}:`, error);
                    tryNextPath(index + 1);
                });
        }
        
        // Procesamiento de datos del Excel
        function processExcelData(data) {
            try {
                const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                
                // Obtiene la primera hoja del libro
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                
                // Convierte la hoja a JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Verifica que hay datos
                if (jsonData.length < 2) {
                    throw new Error('El archivo Excel no contiene suficientes datos');
                }
                
                // La primera fila son los encabezados
                excelHeaders = jsonData[0];
                
                // El resto son los datos
                excelData = jsonData.slice(1).filter(row => row.length > 0);
                
                // Muestra los datos en la tabla
                displayExcelData(excelData);
                
                // Muestra el buscador de códigos de error ahora que el Excel está cargado
                searchContainer.style.display = 'flex';
                
                console.log('Archivo Excel cargado correctamente');
            } catch (error) {
                console.error('Error al procesar el archivo Excel:', error);
                alert(`Error al procesar el archivo Excel: ${error.message}`);
                resetExcelData();
            }
        }
        
        // Comienza a intentar con el primer archivo
        tryNextPath(0);
    }
    
    /**
     * Muestra los datos del Excel en la tabla
     */
    function displayExcelData(data, isSearchResult = false) {
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
        
        // Agrega los encabezados del Excel
        excelHeaders.forEach(header => {
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
     * Realiza una búsqueda en los datos del Excel
     */
    function performSearch() {
        if (!excelData) return;
        
        const searchTerm = errorCodeFilter.value.trim().toLowerCase();
        
        // Si no hay término de búsqueda, muestra todos los datos
        if (!searchTerm) {
            displayExcelData(excelData);
            return;
        }
        
        // Filtra los datos según los criterios
        const filteredData = excelData.filter(row => {
            // Convierte todas las celdas a texto para búsqueda
            const rowText = row.map(cell => String(cell).toLowerCase());
            
            // Verifica si la fila contiene el término de búsqueda
            return rowText.some(cell => cell.includes(searchTerm));
        });
        
        // Muestra los resultados filtrados
        displayExcelData(filteredData, true);
    }
    
    /**
     * Reinicia la búsqueda y muestra todos los datos
     */
    function resetSearch() {
        errorCodeFilter.value = '';
        
        // Si hay datos cargados, muestra todos
        if (excelData) {
            displayExcelData(excelData);
        }
    }
    
    /**
     * Reinicia los datos del Excel
     */
    function resetExcelData() {
        excelData = null;
        excelHeaders = null;
        currentSearchResults = [];
        searchContainer.style.display = 'none'; // Oculta el buscador cuando no hay datos
        resultsTable.style.display = 'none';
        noResults.style.display = 'block';
        noResults.textContent = 'No se encontraron códigos de error con los criterios especificados.';
        resultsCount.textContent = '0 códigos de error encontrados';
    }
}