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
     * Carga las marcas desde el archivo folders.json
     */
    function loadBrands() {
        fetch('Databases/folders.json')
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
        fetch('Databases/folders.json')
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