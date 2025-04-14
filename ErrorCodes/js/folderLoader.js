/**
 * folderLoader.js - Carga la estructura de carpetas para la aplicación de códigos de error
 * 
 * Este script maneja la carga dinámica de las marcas y modelos desde folders.json
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const brandFilter = document.getElementById('brandFilter');
    const modelFilter = document.getElementById('modelFilter');
    
    // Carga inicial de marcas
    loadBrands();
    
    // Event listeners
    brandFilter.addEventListener('change', handleBrandChange);
    
    /**
     * Determina la ruta base según el entorno (GitHub Pages o local)
     */
    function getBasePath() {
        // Verificar si estamos en GitHub Pages (la URL contiene username.github.io o github.io)
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        if (isGitHubPages) {
            // En GitHub Pages, necesitamos incluir el nombre del repositorio en la ruta
            const pathSegments = window.location.pathname.split('/');
            let repoName = '';
            
            // Si es username.github.io/repo, el nombre del repositorio es el segundo segmento
            if (pathSegments.length > 1) {
                repoName = pathSegments[1];
            }
            
            console.log("Ejecutando en GitHub Pages. Ruta base ajustada a: /" + repoName);
            return repoName ? '/' + repoName : '';
        } else {
            // En desarrollo local
            console.log("Ejecutando en entorno local. Ruta base: ''");
            return '';
        }
    }
    
    /**
     * Carga las marcas desde el archivo folders.json
     */
    function loadBrands() {
        const basePath = getBasePath();
        fetch(`${basePath}/ErrorCodes/Databases/folders.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el archivo folders.json');
                }
                return response.json();
            })
            .then(data => {
                // Limpia las opciones actuales, excepto la primera
                while (brandFilter.options.length > 1) {
                    brandFilter.remove(1);
                }
                
                // Añade las marcas desde folders.json
                data.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.name.toLowerCase();
                    option.textContent = brand.name;
                    brandFilter.appendChild(option);
                });
                
                console.log('Marcas cargadas correctamente');
            })
            .catch(error => {
                console.error('Error al cargar las marcas:', error);
                alert('No se pudieron cargar las marcas. Por favor, intente de nuevo.');
            });
    }
    
    /**
     * Maneja el cambio de selección en el dropdown de marcas
     */
    function handleBrandChange() {
        // Limpia y deshabilita el dropdown de modelos
        while (modelFilter.options.length > 1) {
            modelFilter.remove(1);
        }
        
        // Si no hay marca seleccionada, deshabilita el dropdown de modelos
        if (!brandFilter.value) {
            modelFilter.disabled = true;
            return;
        }
        
        // Habilita el dropdown de modelos
        modelFilter.disabled = false;
        
        // Carga los modelos para la marca seleccionada
        const basePath = getBasePath();
        fetch(`${basePath}/ErrorCodes/Databases/folders.json`)
            .then(response => response.json())
            .then(data => {
                // Encuentra la marca seleccionada
                const selectedBrand = data.find(brand => 
                    brand.name.toLowerCase() === brandFilter.value.toLowerCase()
                );
                
                if (selectedBrand && selectedBrand.folders) {
                    // Añade los modelos al dropdown
                    selectedBrand.folders.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name.toLowerCase();
                        option.textContent = model.name;
                        modelFilter.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error al cargar los modelos:', error);
                alert('No se pudieron cargar los modelos. Por favor, intente de nuevo.');
            });
    }
});