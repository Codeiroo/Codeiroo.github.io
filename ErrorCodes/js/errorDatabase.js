// Base de datos de códigos de error para materiales eléctricos
const errorDatabase = [
    // Schneider Electric
    {
        id: 1,
        brand: "schneider",
        brandName: "Schneider Electric",
        model: "ATV320",
        errorCode: "F0001",
        title: "Fallo de Precarga",
        description: "Circuito de precarga detecta niveles anormales de tensión en el bus DC.",
        causes: [
            "Relé de carga desgastado o dañado",
            "Resistencia de precarga con fallo",
            "Problema en el circuito de medición del bus DC",
            "Tensión de alimentación demasiado baja"
        ],
        solutions: [
            "Verificar la tensión de alimentación del variador",
            "Comprobar las conexiones de potencia",
            "Verificar que no existan cortocircuitos en la línea",
            "Si el problema persiste, reemplazar la placa de potencia"
        ],
        severity: "alto",
        diagram: "img/schneider/atv320_f0001.png",
        manualLinks: [
            {text: "Manual ATV320", url: "https://www.se.com/manuales/atv320"}
        ]
    },
    {
        id: 2,
        brand: "schneider",
        brandName: "Schneider Electric",
        model: "ATV320",
        errorCode: "F0002",
        title: "Sobrecalentamiento IGBT",
        description: "Temperatura excesiva en los módulos IGBT del inversor.",
        causes: [
            "Temperatura ambiente demasiado alta",
            "Ventilación insuficiente",
            "Ventilador bloqueado o defectuoso",
            "Frecuencia de conmutación demasiado alta para la temperatura ambiente"
        ],
        solutions: [
            "Verificar el estado del ventilador",
            "Limpiar las rejillas de ventilación",
            "Reducir la frecuencia de conmutación",
            "Asegurar que la temperatura ambiente está dentro de las especificaciones"
        ],
        severity: "alto",
        diagram: "img/schneider/atv320_f0002.png",
        manualLinks: [
            {text: "Manual ATV320", url: "https://www.se.com/manuales/atv320"},
            {text: "Guía de refrigeración", url: "https://www.se.com/guias/refrigeracion"}
        ]
    },
    {
        id: 3,
        brand: "schneider",
        brandName: "Schneider Electric",
        model: "M340",
        errorCode: "ERR12",
        title: "Error de Comunicación",
        description: "Fallo en la comunicación del bus de campo.",
        causes: [
            "Cableado incorrecto o dañado",
            "Interferencias electromagnéticas",
            "Configuración incorrecta de la red",
            "Dispositivo remoto no responde"
        ],
        solutions: [
            "Verificar el cableado y las conexiones",
            "Comprobar la configuración de red en ambos extremos",
            "Verificar que todos los dispositivos tengan direcciones únicas",
            "Utilizar cables apantallados para reducir interferencias"
        ],
        severity: "medio",
        diagram: "img/schneider/m340_err12.png",
        manualLinks: [
            {text: "Manual M340", url: "https://www.se.com/manuales/m340"}
        ]
    },
    
    // Siemens
    {
        id: 4,
        brand: "siemens",
        brandName: "Siemens",
        model: "SIMATIC S7-1200",
        errorCode: "SF001",
        title: "Fallo de Hardware",
        description: "Error de hardware en el módulo de CPU.",
        causes: [
            "Fallo interno de memoria",
            "Problemas en la circuitería interna",
            "Daño físico en el módulo",
            "Sobretensión en la alimentación"
        ],
        solutions: [
            "Reiniciar el sistema",
            "Verificar la alimentación del sistema",
            "Actualizar el firmware",
            "Contactar soporte técnico para reemplazo si el problema persiste"
        ],
        severity: "crítico",
        diagram: "img/siemens/s7-1200_sf001.png",
        manualLinks: [
            {text: "Manual S7-1200", url: "https://www.siemens.com/manuales/s7-1200"}
        ]
    },
    {
        id: 5,
        brand: "siemens",
        brandName: "Siemens",
        model: "SINAMICS G120",
        errorCode: "F30002",
        title: "Sobretensión en circuito intermedio",
        description: "La tensión del circuito intermedio ha superado el umbral permitido.",
        causes: [
            "Tiempo de deceleración demasiado corto",
            "Sobretensión en la red eléctrica",
            "Motor operando en modo generador",
            "Conexión a tierra deficiente"
        ],
        solutions: [
            "Aumentar el tiempo de deceleración",
            "Verificar la tensión de red",
            "Instalar una resistencia de frenado",
            "Activar el regulador de tensión del circuito intermedio"
        ],
        severity: "alto",
        diagram: "img/siemens/g120_f30002.png",
        manualLinks: [
            {text: "Manual SINAMICS G120", url: "https://www.siemens.com/manuales/g120"}
        ]
    },
    
    // ABB
    {
        id: 6,
        brand: "abb",
        brandName: "ABB",
        model: "ACS880",
        errorCode: "F0022",
        title: "Sobretemperatura del dispositivo",
        description: "La temperatura del módulo de potencia ha excedido el límite crítico.",
        causes: [
            "Temperatura ambiente elevada",
            "Ventilador bloqueado o con mal funcionamiento",
            "Aletas de refrigeración obstruidas",
            "Carga excesiva continua"
        ],
        solutions: [
            "Verificar el funcionamiento del ventilador",
            "Limpiar las aletas de refrigeración",
            "Asegurar ventilación adecuada del armario",
            "Reducir la carga o el ciclo de trabajo"
        ],
        severity: "alto",
        diagram: "img/abb/acs880_f0022.png",
        manualLinks: [
            {text: "Manual ACS880", url: "https://www.abb.com/manuales/acs880"}
        ]
    },
    {
        id: 7,
        brand: "abb",
        brandName: "ABB",
        model: "AC500",
        errorCode: "E4567",
        title: "Error de comunicación Ethernet",
        description: "Fallo en la comunicación Ethernet/IP.",
        causes: [
            "Configuración IP incorrecta",
            "Cable desconectado o dañado",
            "Switch defectuoso",
            "Conflicto de direcciones IP"
        ],
        solutions: [
            "Verificar la configuración IP",
            "Comprobar el estado del cable y las conexiones",
            "Validar el funcionamiento de los switches",
            "Asegurar que no existan direcciones IP duplicadas"
        ],
        severity: "medio",
        diagram: "img/abb/ac500_e4567.png",
        manualLinks: [
            {text: "Manual AC500", url: "https://www.abb.com/manuales/ac500"}
        ]
    },
    
    // General Electric
    {
        id: 8,
        brand: "ge",
        brandName: "General Electric",
        model: "Mark VIe",
        errorCode: "ALM556",
        title: "Falla de Comunicación CIMPLICITY",
        description: "Error de comunicación con el sistema SCADA CIMPLICITY.",
        causes: [
            "Problemas en la red Ethernet",
            "Servidor OPC no disponible",
            "Configuración incorrecta del proyecto",
            "Fallo en el servicio de comunicaciones"
        ],
        solutions: [
            "Reiniciar los servicios de comunicación",
            "Verificar la configuración del servidor OPC",
            "Comprobar las conexiones de red",
            "Validar los permisos de acceso"
        ],
        severity: "medio",
        diagram: "img/ge/markVIe_alm556.png",
        manualLinks: [
            {text: "Manual Mark VIe", url: "https://www.ge.com/manuales/markVIe"}
        ]
    },
    
    // Rockwell Automation
    {
        id: 9,
        brand: "rockwell",
        brandName: "Rockwell Automation",
        model: "PowerFlex 525",
        errorCode: "F012",
        title: "Sobrecorriente de Hardware",
        description: "El variador detectó una condición de sobrecorriente instantánea.",
        causes: [
            "Cortocircuito en los cables del motor",
            "Fallo a tierra en el motor",
            "Aceleración demasiado rápida",
            "Parámetros de motor incorrectos"
        ],
        solutions: [
            "Verificar las conexiones del motor",
            "Medir la resistencia de aislamiento",
            "Aumentar el tiempo de aceleración",
            "Realizar un autoajuste de parámetros del motor"
        ],
        severity: "alto",
        diagram: "img/rockwell/powerflex525_f012.png",
        manualLinks: [
            {text: "Manual PowerFlex 525", url: "https://www.rockwellautomation.com/manuales/powerflex525"}
        ]
    },
    {
        id: 10,
        brand: "rockwell",
        brandName: "Rockwell Automation",
        model: "ControlLogix",
        errorCode: "MALF01",
        title: "Fallo de Comunicación EtherNet/IP",
        description: "Interrupción en la comunicación EtherNet/IP.",
        causes: [
            "Dispositivo remoto apagado",
            "Cable desconectado o dañado",
            "Configuración incorrecta",
            "Conflicto en la red"
        ],
        solutions: [
            "Verificar el estado de los dispositivos remotos",
            "Comprobar las conexiones físicas",
            "Revisar la configuración del módulo ENB",
            "Ejecutar diagnóstico de red"
        ],
        severity: "medio",
        diagram: "img/rockwell/controllogix_malf01.png",
        manualLinks: [
            {text: "Manual ControlLogix", url: "https://www.rockwellautomation.com/manuales/controllogix"}
        ]
    },
    
    // Omron
    {
        id: 11,
        brand: "omron",
        brandName: "Omron",
        model: "NX1P2",
        errorCode: "A401",
        title: "Error de verificación no fatal",
        description: "Se detectó un error de verificación en la unidad de E/S.",
        causes: [
            "Configuración inconsistente",
            "Tarjeta de E/S defectuosa",
            "Interferencias electromagnéticas",
            "Error de programa"
        ],
        solutions: [
            "Verificar y corregir la configuración",
            "Reiniciar el controlador",
            "Comprobar el estado de las unidades de E/S",
            "Actualizar el firmware"
        ],
        severity: "bajo",
        diagram: "img/omron/nx1p2_a401.png",
        manualLinks: [
            {text: "Manual NX1P2", url: "https://www.omron.com/manuales/nx1p2"}
        ]
    },
    
    // Mitsubishi Electric
    {
        id: 12,
        brand: "mitsubishi",
        brandName: "Mitsubishi Electric",
        model: "FR-F800",
        errorCode: "E.OC1",
        title: "Sobrecorriente durante aceleración",
        description: "Se detectó sobrecorriente durante la fase de aceleración del motor.",
        causes: [
            "Tiempo de aceleración demasiado corto",
            "Carga excesiva",
            "Configuración incorrecta del motor",
            "Cortocircuito en los terminales de salida"
        ],
        solutions: [
            "Aumentar el tiempo de aceleración",
            "Verificar la carga mecánica",
            "Comprobar los parámetros del motor",
            "Verificar el cableado del motor"
        ],
        severity: "alto",
        diagram: "img/mitsubishi/fr-f800_eoc1.png",
        manualLinks: [
            {text: "Manual FR-F800", url: "https://www.mitsubishielectric.com/manuales/fr-f800"}
        ]
    }
];

// Exportar la base de datos para que esté disponible en otros scripts
window.errorDatabase = errorDatabase;