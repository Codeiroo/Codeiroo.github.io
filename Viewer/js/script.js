document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const loadFilesBtn = document.getElementById('loadFiles');
    const fileList = document.getElementById('fileList');
    const tabContainer = document.getElementById('tabContainer');
    
    let loadedFiles = [];
    
    loadFilesBtn.addEventListener('click', async function() {
        const files = fileInput.files;
        if (files.length === 0) {
            alert('Por favor, selecciona al menos un archivo.');
            return;
        }
        
        loadedFiles = [];
        fileList.innerHTML = '';
        
        // Mostrar estado de carga
        loadFilesBtn.disabled = true;
        loadFilesBtn.textContent = 'Procesando...';
        
        try {
            await Promise.all(Array.from(files).map(async file => {
                try {
                    const fileData = await readFile(file);
                    loadedFiles.push({
                        name: file.name,
                        type: getFileType(file.name),
                        content: fileData,
                        parsedData: await parseFile(file, fileData)
                    });
                } catch (error) {
                    console.error(`Error procesando archivo ${file.name}:`, error);
                    loadedFiles.push({
                        name: file.name,
                        type: getFileType(file.name),
                        error: error.message
                    });
                }
            }));
            
            updateFileList();
            displayData();
        } catch (error) {
            console.error('Error al procesar archivos:', error);
            alert('Ocurrió un error al procesar los archivos.');
        } finally {
            loadFilesBtn.disabled = false;
            loadFilesBtn.textContent = 'Cargar Archivos';
        }
    });
    
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            
            reader.onerror = function() {
                reject(new Error(`Error al leer el archivo ${file.name}`));
            };
            
            if (file.name.endsWith('.csv') || file.name.endsWith('.xml') || file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }
    
    function getFileType(filename) {
        if (filename.endsWith('.xml')) return 'xml';
        if (filename.endsWith('.json')) return 'json';
        if (filename.endsWith('.csv')) return 'csv';
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return 'excel';
        return 'unknown';
    }
    
    function getFileIcon(type) {
        const icons = {
            'xml': '📄',
            'json': '📋',
            'csv': '📊',
            'excel': '📈',
            'unknown': '📁'
        };
        return icons[type] || icons['unknown'];
    }
    
    async function parseFile(file, content) {
        const type = getFileType(file.name);
        
        switch (type) {
            case 'xml':
                return parseXML(content);
            case 'json':
                return parseJSON(content);
            case 'csv':
                return parseCSV(content);
            case 'excel':
                return await parseExcel(content);
            default:
                throw new Error('Formato de archivo no soportado');
        }
    }
    
    function parseXML(content) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, "text/xml");
            
            // Verificar errores de parseo
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error(xmlDoc.getElementsByTagName("parsererror")[0].textContent);
            }
            
            return xmlToTableData(xmlDoc);
        } catch (error) {
            throw new Error(`Error XML: ${error.message}`);
        }
    }
    
    function parseJSON(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Error JSON: ${error.message}`);
        }
    }
    
    function parseCSV(content) {
        try {
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = lines[i].split(',');
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });
                
                data.push(row);
            }
            
            return {
                headers,
                data
            };
        } catch (error) {
            throw new Error(`Error CSV: ${error.message}`);
        }
    }
    
    async function parseExcel(content) {
        try {
            // Cargar la librería de Excel solo cuando sea necesaria
            const XLSX = await loadXLSX();
            const workbook = XLSX.read(content, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            return XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        } catch (error) {
            throw new Error(`Error Excel: ${error.message}`);
        }
    }
    
    function loadXLSX() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) {
                resolve(window.XLSX);
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                script.onload = () => resolve(window.XLSX);
                script.onerror = () => reject(new Error('Error al cargar la librería XLSX'));
                document.head.appendChild(script);
            }
        });
    }
    
    function xmlToTableData(xmlDoc) {
        const root = xmlDoc.documentElement;
        const data = [];
        
        function processNode(node, path = []) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const nodeName = node.nodeName;
                const currentPath = [...path, nodeName];
                
                // Obtener atributos
                const attributes = {};
                if (node.attributes && node.attributes.length > 0) {
                    Array.from(node.attributes).forEach(attr => {
                        attributes[attr.name] = attr.value;
                    });
                }
                
                // Obtener valor del nodo
                let nodeValue = '';
                const textNodes = [];
                
                // Procesar hijos
                const children = [];
                Array.from(node.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '') {
                        textNodes.push(child.textContent.trim());
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        children.push(child);
                    }
                });
                
                nodeValue = textNodes.join(' | ');
                
                // Crear objeto para este nodo
                const nodeData = {
                    path: currentPath.join(' > '),
                    name: nodeName,
                    value: nodeValue,
                    attributes,
                    children: []
                };
                
                // Procesar hijos recursivamente
                children.forEach(child => {
                    const childData = processNode(child, currentPath);
                    nodeData.children.push(childData);
                });
                
                data.push(nodeData);
                return nodeData;
            }
            return null;
        }
        
        // Procesar nodo raíz
        Array.from(root.childNodes).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                processNode(child);
            }
        });
        
        return data;
    }
    
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (loadedFiles.length === 0) {
            fileList.innerHTML = '<p>No hay archivos cargados.</p>';
            return;
        }
        
        loadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            fileIcon.textContent = getFileIcon(file.type);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileType = document.createElement('span');
            fileType.className = 'file-type';
            fileType.textContent = file.type.toUpperCase();
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileType);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Eliminar';
            removeBtn.addEventListener('click', function() {
                loadedFiles.splice(index, 1);
                updateFileList();
                displayData();
            });
            
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });
    }
    
    function displayData() {
        tabContainer.innerHTML = '';
        
        if (loadedFiles.length === 0) {
            tabContainer.innerHTML = '<div class="no-files">No hay archivos cargados. Selecciona archivos para visualizarlos.</div>';
            return;
        }
        
        const tabButtons = document.createElement('div');
        tabButtons.className = 'tab-buttons';
        
        const tabContents = document.createElement('div');
        
        loadedFiles.forEach((file, index) => {
            // Crear botón de pestaña
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button' + (index === 0 ? ' active' : '');
            tabButton.textContent = file.name;
            tabButton.addEventListener('click', function() {
                // Ocultar todos los contenidos
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                // Desactivar todos los botones
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Mostrar el contenido correspondiente
                document.getElementById(`content-${index}`).classList.add('active');
                this.classList.add('active');
            });
            tabButtons.appendChild(tabButton);
            
            // Crear contenido de pestaña
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content' + (index === 0 ? ' active' : '');
            tabContent.id = `content-${index}`;
            
            if (file.error) {
                tabContent.innerHTML = `
                    <div class="error-message">
                        <strong>Error al procesar el archivo:</strong> ${file.error}
                    </div>
                `;
            } else {
                try {
                    switch (file.type) {
                        case 'xml':
                            tabContent.appendChild(displayXML(file.parsedData));
                            break;
                        case 'json':
                            tabContent.appendChild(displayJSON(file.parsedData));
                            break;
                        case 'csv':
                            tabContent.appendChild(displayCSV(file.parsedData));
                            break;
                        case 'excel':
                            tabContent.appendChild(displayExcel(file.parsedData));
                            break;
                        default:
                            tabContent.innerHTML = `<p>Formato no soportado: ${file.type}</p>`;
                    }
                } catch (error) {
                    tabContent.innerHTML = `
                        <div class="error-message">
                            <strong>Error al mostrar el archivo:</strong> ${error.message}
                        </div>
                    `;
                }
            }
            
            tabContents.appendChild(tabContent);
        });
        
        tabContainer.appendChild(tabButtons);
        tabContainer.appendChild(tabContents);
    }
    
    function displayXML(data) {
        const container = document.createElement('div');
        
        if (data.length === 0) {
            container.innerHTML = '<p>El archivo XML no contiene datos.</p>';
            return container;
        }
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        // Encabezados
        const headerRow = document.createElement('tr');
        ['Elemento', 'Atributos', 'Valor'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Función recursiva para agregar filas
        function addRows(nodes, depth = 0) {
            nodes.forEach(node => {
                const row = document.createElement('tr');
                
                // Elemento (con sangrado para anidamiento)
                const nameCell = document.createElement('td');
                nameCell.innerHTML = `${'&nbsp;&nbsp;'.repeat(depth)}<span class="xml-tag">${node.name}</span>`;
                row.appendChild(nameCell);
                
                // Atributos
                const attrsCell = document.createElement('td');
                if (Object.keys(node.attributes).length > 0) {
                    const attrsList = document.createElement('div');
                    Object.entries(node.attributes).forEach(([name, value]) => {
                        const attrDiv = document.createElement('div');
                        attrDiv.innerHTML = `<span class="xml-attribute">${name}</span>: <span class="xml-value">${value}</span>`;
                        attrsList.appendChild(attrDiv);
                    });
                    attrsCell.appendChild(attrsList);
                }
                row.appendChild(attrsCell);
                
                // Valor
                const valueCell = document.createElement('td');
                if (node.value) {
                    valueCell.innerHTML = `<span class="xml-value">${node.value}</span>`;
                }
                row.appendChild(valueCell);
                
                tbody.appendChild(row);
                
                // Procesar hijos recursivamente
                if (node.children && node.children.length > 0) {
                    addRows(node.children, depth + 1);
                }
            });
        }
        
        addRows(data);
        table.appendChild(tbody);
        container.appendChild(table);
        return container;
    }
    
    function displayJSON(data) {
        const container = document.createElement('div');
        
        if (!data || (typeof data !== 'object')) {
            container.innerHTML = '<p>El archivo JSON no contiene datos válidos.</p>';
            return container;
        }
        
        // Intentar mostrar como tabla si es un array de objetos con la misma estructura
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            
            // Encabezados (claves del primer objeto)
            const headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Filas de datos
            data.forEach(item => {
                const row = document.createElement('tr');
                Object.values(item).forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            container.appendChild(table);
        } else {
            // Mostrar como JSON formateado
            const pre = document.createElement('div');
            pre.className = 'json-viewer';
            pre.textContent = JSON.stringify(data, null, 2);
            container.appendChild(pre);
        }
        
        return container;
    }
    
    function displayCSV(data) {
        const container = document.createElement('div');
        
        if (!data || !data.headers || !data.data) {
            container.innerHTML = '<p>El archivo CSV no contiene datos válidos.</p>';
            return container;
        }
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        // Encabezados
        const headerRow = document.createElement('tr');
        data.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Filas de datos
        data.data.forEach(rowData => {
            const row = document.createElement('tr');
            data.headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = rowData[header] || '';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        return container;
    }
    
    function displayExcel(data) {
        const container = document.createElement('div');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>El archivo Excel no contiene datos válidos.</p>';
            return container;
        }
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        // Encabezados (primera fila)
        const headerRow = document.createElement('tr');
        const headers = data[0] || [];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header || '';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Filas de datos (resto de filas)
        for (let i = 1; i < data.length; i++) {
            const rowData = data[i] || [];
            const row = document.createElement('tr');
            
            rowData.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell || '';
                row.appendChild(td);
            });
            
            // Asegurar que tenga el mismo número de celdas que los encabezados
            while (row.cells.length < headers.length) {
                const td = document.createElement('td');
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
        return container;
    }
});