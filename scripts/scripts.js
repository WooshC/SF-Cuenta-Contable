let currentData = {}; // Objeto para almacenar los datos agrupados por razón social
let processedAuthNumbers = new Set(); // Conjunto para almacenar los números de autorización procesados

// Función para seleccionar una carpeta
function chooseFolder() {
    document.getElementById('folderInput').click();
}

// Función para seleccionar múltiples archivos
function chooseFiles() {
    document.getElementById('filesInput').click();
}

// Función para extraer los datos del XML
function extractData() {
    const folderInput = document.getElementById('folderInput');
    const filesInput = document.getElementById('filesInput');
    const files = folderInput.files.length > 0 ? folderInput.files : filesInput.files;

    if (files.length === 0) {
        alert("Por favor, seleccione al menos un archivo XML o una carpeta.");
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(event) {
            const xmlInput = event.target.result;

            // Expresiones regulares para extraer los datos
            const regexFechaEmision = /<fechaEmision>(.*?)<\/fechaEmision>/;
            const regexRazonSocial = /<razonSocial>(.*?)<\/razonSocial>/;
            const regexRuc = /<ruc>(.*?)<\/ruc>/;
            const regexBaseImponible = /<baseImponible>(.*?)<\/baseImponible>/;
            const regexImporteTotal = /<importeTotal>(.*?)<\/importeTotal>/;
            const regexNumeroAutorizacion = /<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/;

            // Extraer los valores con las expresiones regulares
            const fechaEmision = (xmlInput.match(regexFechaEmision) || [])[1] || 'N/A';
            const razonSocial = (xmlInput.match(regexRazonSocial) || [])[1] || 'N/A';
            const ruc = (xmlInput.match(regexRuc) || [])[1] || 'N/A';
            const baseImponible = parseFloat((xmlInput.match(regexBaseImponible) || [])[1] || 0);
            const importeTotal = parseFloat((xmlInput.match(regexImporteTotal) || [])[1] || 0);
            const numeroAutorizacion = (xmlInput.match(regexNumeroAutorizacion) || [])[1] || 'N/A';

            // Verificar si el número de autorización ya fue procesado
            if (processedAuthNumbers.has(numeroAutorizacion)) {
                return; // Detener el procesamiento de este archivo
            }

            // Marcar el número de autorización como procesado
            processedAuthNumbers.add(numeroAutorizacion);

            // Calcular el IVA
            const iva = ((importeTotal - baseImponible) / baseImponible * 100).toFixed(2);

            // Almacenar los datos agrupados por razón social
            if (!currentData[razonSocial]) {
                currentData[razonSocial] = [];
            }

            currentData[razonSocial].push({
                fechaEmision,
                razonSocial,
                ruc,
                baseImponible: baseImponible.toFixed(2),
                importeTotal: importeTotal.toFixed(2),
                iva,
                numeroAutorizacion
            });

            // Mostrar los datos agrupados
            displayTable();
        };

        reader.readAsText(file);
    }
}

// Función para mostrar los datos agrupados en la tabla
function displayTable() {
    const tableBody = document.getElementById('tableBody');
    const dataTable = document.getElementById('dataTable');
    tableBody.innerHTML = '';

    // Recorrer cada razón social y agregar sus datos en la tabla
    for (let razonSocial in currentData) {
        const group = currentData[razonSocial];

        // Crear una fila para la razón social
        let groupRow = `<tr><td colspan="8" style="font-weight: bold;">${razonSocial}</td></tr>`;

        // Agregar cada factura bajo esa razón social
        group.forEach(data => {
            groupRow += `
            <tr>
              <td>${data.fechaEmision}</td>
              <td>${data.razonSocial}</td>
              <td>${data.ruc}</td>
              <td>${data.baseImponible}</td>
              <td>${data.importeTotal}</td>
              <td>${data.iva}</td>
              <td>${data.numeroAutorizacion}</td>
              <td><button onclick="editData('${data.ruc}')">Editar</button></td>
            </tr>
          `;
        });

        tableBody.innerHTML += groupRow;
    }

    dataTable.style.display = 'table';
}

// Función para mostrar el formulario de edición (modificada para usar RUC como identificador)
function editData(ruc) {
    const group = currentData;

    // Buscar la factura a editar usando el RUC
    let selectedData;
    for (let razonSocial in group) {
        selectedData = group[razonSocial].find(item => item.ruc === ruc);
        if (selectedData) break;
    }

    // Rellenar el formulario con los datos de la factura seleccionada
    document.getElementById('editForm').style.display = 'block';
    document.getElementById('fechaEmisionEdit').value = selectedData.fechaEmision;
    document.getElementById('razonSocialEdit').value = selectedData.razonSocial;
    document.getElementById('rucEdit').value = selectedData.ruc;
    document.getElementById('baseImponibleEdit').value = selectedData.baseImponible;
    document.getElementById('importeTotalEdit').value = selectedData.importeTotal;
    document.getElementById('ivaEdit').value = selectedData.iva;
    document.getElementById('numeroAutorizacionEdit').value = selectedData.numeroAutorizacion;
}

// Función para actualizar los datos
function updateData() {
    // Obtener el RUC y buscar la factura correspondiente
    const ruc = document.getElementById('rucEdit').value;
    let selectedData;
    for (let razonSocial in currentData) {
        selectedData = currentData[razonSocial].find(item => item.ruc === ruc);
        if (selectedData) break;
    }

    // Actualizar los datos
    selectedData.fechaEmision = document.getElementById('fechaEmisionEdit').value;
    selectedData.razonSocial = document.getElementById('razonSocialEdit').value;
    selectedData.baseImponible = parseFloat(document.getElementById('baseImponibleEdit').value).toFixed(2);
    selectedData.importeTotal = parseFloat(document.getElementById('importeTotalEdit').value).toFixed(2);
    selectedData.iva = document.getElementById('ivaEdit').value;
    selectedData.numeroAutorizacion = document.getElementById('numeroAutorizacionEdit').value;

    // Volver a mostrar la tabla con los datos actualizados
    displayTable();

    // Ocultar el formulario de edición
    document.getElementById('editForm').style.display = 'none';
}

// Función para cancelar la edición
function cancelEdit() {
    document.getElementById('editForm').style.display = 'none';
}
