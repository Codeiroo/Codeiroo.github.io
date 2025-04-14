// main.js - Funcionalidad para la página principal

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar la fecha actual
    updateLastModifiedDate();
    
    // Detectar si hay nuevas aplicaciones añadidas
    highlightNewApps();
    
    // Añadir efecto hover en las tarjetas
    setupCardHoverEffects();
});

/**
 * Actualiza la fecha de última modificación en la página
 */
function updateLastModifiedDate() {
    // La fecha ya está establecida en el HTML, pero podríamos actualizarla dinámicamente
    // const dateElement = document.querySelector('.date-info');
    // if (dateElement) {
    //     const today = new Date();
    //     const options = { year: 'numeric', month: 'long', day: 'numeric' };
    //     dateElement.textContent = 'Última actualización: ' + today.toLocaleDateString('es-ES', options);
    // }
}

/**
 * Resalta las aplicaciones nuevas (añadidas en los últimos 30 días)
 */
function highlightNewApps() {
    // Aquí podrías implementar lógica para resaltar aplicaciones recién agregadas
    // Por ejemplo, añadiendo una etiqueta "Nuevo" a las apps añadidas recientemente
    
    // Ejemplo (simulado):
    // const appsWithDates = [
    //     { selector: '.app-card:nth-child(1)', date: new Date('2025-04-10') }
    // ];
    
    // const today = new Date();
    // const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
    // appsWithDates.forEach(app => {
    //     if (app.date > thirtyDaysAgo) {
    //         const appCard = document.querySelector(app.selector);
    //         if (appCard) {
    //             const newBadge = document.createElement('span');
    //             newBadge.className = 'new-badge';
    //             newBadge.textContent = 'Nuevo';
    //             appCard.appendChild(newBadge);
    //         }
    //     }
    // });
}

/**
 * Configurar efectos visuales al pasar el ratón sobre las tarjetas
 */
function setupCardHoverEffects() {
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        });
    });
}