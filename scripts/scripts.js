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

        reader.onload = function (event) {
            const xmlInput = event.target.result;

            // Expresiones regulares para extraer los datos principales
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



            // Extraer los detalles de los productos
            const regexDetalles = /<detalle>.*?<descripcion>(.*?)<\/descripcion>.*?<precioUnitario>(.*?)<\/precioUnitario>.*?<\/detalle>/gs;
            let detalles = [];
            let match;
            while ((match = regexDetalles.exec(xmlInput)) !== null) {
                detalles.push({
                    descripcion: match[1].trim(),
                    precioUnitario: parseFloat(match[2].trim()).toFixed(2)
                });
            }

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
                numeroAutorizacion,
                detalles
            });

            // Mostrar los datos agrupados
            displayTable();
        };

        reader.readAsText(file);
    }
}

function displayTable() {
    const tableBody = document.getElementById('tableBody');
    const dataTable = document.getElementById('dataTable');
    tableBody.innerHTML = '';

    // Recorrer cada razón social y agregar sus datos en la tabla
    for (let razonSocial in currentData) {
        const group = currentData[razonSocial];

        // Crear una fila para la razón social
        let groupRow = `<tr><td colspan="10" style="font-weight: bold;">${razonSocial}</td></tr>`;

        // Agregar cada factura bajo esa razón social
        group.forEach(data => {
            // Agregar una fila por cada producto
            data.detalles.forEach((detalle, index) => {
                groupRow += `
                <tr>
                  ${index === 0 ? `
                    <td rowspan="${data.detalles.length}">${data.fechaEmision}</td>
                    <td rowspan="${data.detalles.length}">${data.razonSocial}</td>
                    <td rowspan="${data.detalles.length}">${data.ruc}</td>
                  ` : ''}
                  <td>${detalle.descripcion}</td>
                  <td>${detalle.precioUnitario}</td>
                  ${index === 0 ? `
                    <td rowspan="${data.detalles.length}">${data.baseImponible}</td>
                    <td rowspan="${data.detalles.length}">${data.numeroAutorizacion}</td>
                  ` : ''}
                </tr>
              `;
            });

            // Agregar una fila para el total de la factura
            groupRow += `
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
              <td>${data.importeTotal}</td>
              <td colspan="5"></td>
            </tr>
          `;
        });

        tableBody.innerHTML += groupRow;
    }

    dataTable.style.display = 'table';
}

function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [];

    // Encabezados de la tabla
    const headers = [
        "Fecha de Emisión",
        "Razón Social",
        "RUC",
        "Descripción",
        "Valor",
        "Base Imponible",
        "Número de Autorización"
    ];
    worksheetData.push(headers);

    // Recorrer cada razón social y agregar sus datos
    for (let razonSocial in currentData) {
        const group = currentData[razonSocial];

        // Agregar una fila para la razón social (encabezado de grupo)
        worksheetData.push([razonSocial, "", "", "", "", "", "", ""]);

        // Agregar cada factura bajo esa razón social
        group.forEach(data => {
            // Agregar una fila por cada producto
            data.detalles.forEach((detalle, index) => {
                const row = [
                    index === 0 ? data.fechaEmision : "", // Fecha de emisión solo en la primera fila
                    index === 0 ? data.razonSocial : "",  // Razón social solo en la primera fila
                    index === 0 ? data.ruc : "",          // RUC solo en la primera fila
                    detalle.descripcion,                  // Descripción del producto
                    detalle.precioUnitario,               // Valor del producto
                    index === 0 ? data.baseImponible : "", // Base imponible solo en la primera fila
                    index === 0 ? data.numeroAutorizacion : "" // Número de autorización solo en la primera fila
                ];
                worksheetData.push(row);
            });

            // Agregar una fila para el total de la factura
            worksheetData.push(["", "", "", "", "Total:", data.importeTotal, "", ""]);
        });
    }

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Aplicar estilos a los encabezados y totales
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];

            if (R === 0) {
                // Estilo para los encabezados
                if (!cell.s) cell.s = {};
                cell.s.font = { bold: true };
                cell.s.fill = { fgColor: { rgb: "D3D3D3" } }; // Fondo gris
            } else if (worksheetData[R][C] === "Total:") {
                // Estilo para las filas de total
                if (!cell.s) cell.s = {};
                cell.s.font = { bold: true };
                cell.s.fill = { fgColor: { rgb: "F0F0F0" } }; // Fondo gris claro
            }
        }
    }

    // Agregar la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");

    // Escribir el archivo y descargarlo
    XLSX.writeFile(workbook, "facturas.xlsx");
}