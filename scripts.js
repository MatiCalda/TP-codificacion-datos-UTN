let textoActual = ""; // Variable para almacenar el texto actual

function cargarTexto() {
    const textoDirecto = document.getElementById('textoIng').value;
    const archivo = document.getElementById('file').files[0];
    
    if (textoDirecto) {
        textoActual = textoDirecto; // Actualizar el texto actual
    } else if (archivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contenido = e.target.result;
            textoActual = contenido; // Actualizar el texto actual
        };
        reader.readAsText(archivo);
    }
}

function mostrarTexto(texto) {
    console.log('Texto cargado:', texto);
    // Aquí puedes mostrar el texto en la pagina o guardarlo en una variable
}

function calcularFrecuencias() {
    if (!textoActual) {
        alert("Por favor, cargue un texto antes de calcular las frecuencias.");
        return;
    }

    const frecuencias = {};
    
    for (const char of textoActual) {
        if (frecuencias[char]) {
            frecuencias[char]++;
        } else {
            frecuencias[char] = 1;
        }
    }
    
    console.log('Frecuencias:', frecuencias);
    mostrarFrecuencias(frecuencias);
    graficarFrecuencias(frecuencias);
}

function mostrarFrecuencias(frecuencias) {
    const divFrecuencias = document.getElementById('frecuencias');
    divFrecuencias.innerHTML = '<h3>Frecuencias de Símbolos</h3>';
    const tabla = document.createElement('table');
    const filaCabecera = document.createElement('tr');
    filaCabecera.innerHTML = '<th>Símbolo</th><th>Frecuencia</th>';
    tabla.appendChild(filaCabecera);
    
    for (const [simbolo, frecuencia] of Object.entries(frecuencias)) {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${simbolo}</td><td>${frecuencia}</td>`;
        tabla.appendChild(fila);
    }
    
    divFrecuencias.appendChild(tabla);
}

function graficarFrecuencias(frecuencias) {
    const ctx = document.getElementById('grafico-frecuencias').getContext('2d');
    const labels = Object.keys(frecuencias);
    const data = Object.values(frecuencias);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frecuencias',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}