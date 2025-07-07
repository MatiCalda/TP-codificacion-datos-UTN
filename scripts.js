let textoActual = "";
let graficoFrecuencias = null;
let graficoCodigos = null;

function cargarTexto() {
    const textoDirecto = document.getElementById('textoIng').value;
    const archivo = document.getElementById('file').files[0];

    if (textoDirecto) {
        textoActual = textoDirecto;
    } else if (archivo) {
        const reader = new FileReader();
        reader.onload = function (e) {
            textoActual = e.target.result;
        };
        reader.readAsText(archivo);
    }
}

//chatgpt
function calcularFrecuencias() {
    if (!textoActual) {
        alert("Por favor, cargue un texto antes de calcular las frecuencias.");
        return;
    }

    const frecuencias = {};
    for (const char of textoActual) {
        frecuencias[char] = (frecuencias[char] || 0) + 1;
    }

    mostrarFrecuencias(frecuencias);
    graficarFrecuencias(frecuencias);

    const arbolHuffman = construirArbolHuffman(frecuencias);
    const codigosHuffman = generarCodigos(arbolHuffman);
    mostrarTablaCodigos(codigosHuffman, 'tabla-simbolos');
    graficarLongitudes(codigosHuffman);

    const codigosSF = construirCodigosShannonFano(frecuencias);
    const mensajeSF = codificarTexto(textoActual, codigosSF);
    const tasaSF = (textoActual.length * 8 / mensajeSF.length).toFixed(2);

    // Calcular la entropía
    const entropia = calcularEntropia(frecuencias);

    // Calcular longitud promedio para Shannon-Fano
    const longSF = calcularLongitudPromedio(codigosSF, frecuencias);
    
    // Calcular eficiencia
    const efSF = (entropia / longSF).toFixed(2);

    // Mostrar resultados
    document.getElementById("entropiaSF").textContent = entropia;
    document.getElementById("tasaSF").textContent = tasaSF;
    document.getElementById("eficienciaSF").textContent = efSF;
    document.getElementById("longitudSF").textContent = longSF;
}

function calcularLongitudPromedio(codigos, frecuencias) {
    const total = Object.values(frecuencias).reduce((a, b) => a + b, 0);
    let longitudPromedio = 0;

    for (const simbolo in codigos) {
        const prob = frecuencias[simbolo] / total;
        const longitud = codigos[simbolo].length;
        longitudPromedio += prob * longitud;
    }

    return longitudPromedio; // No usamos .toFixed() aquí, ya que queremos el valor numérico
}

function calcularEntropia(frecuencias) {
    const total = Object.values(frecuencias).reduce((a, b) => a + b, 0);
    let entropia = 0;

    for (const freq of Object.values(frecuencias)) {
        const p = freq / total;
        if (p > 0) {
            entropia += p * Math.log2(1 / p);
        }
    }

    return entropia; // Lo devolvés con 4 decimales
}

function mostrarFrecuencias(freq) {
    const cont = document.getElementById('frecuencias');
    cont.innerHTML = '<h3>Frecuencias</h3>';
    const tabla = document.createElement('table');
    tabla.innerHTML = '<tr><th>Simbolo</th><th>Frecuencia</th></tr>';
    for (const [s, f] of Object.entries(freq)) {
        tabla.innerHTML += `<tr><td>${s}</td><td>${f}</td></tr>`;
    }
    cont.appendChild(tabla);
}

function graficarFrecuencias(frecuencias) {
    const ctx = document.getElementById('grafico-frecuencias').getContext('2d');
    if (graficoFrecuencias) graficoFrecuencias.destroy();
    graficoFrecuencias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(frecuencias),
            datasets: [{
                label: 'Frecuencias',
                data: Object.values(frecuencias),
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function graficarLongitudes(codigos) {
    const ctx = document.getElementById('grafico-codigos').getContext('2d');
    if (graficoCodigos) graficoCodigos.destroy();
    graficoCodigos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(codigos),
            datasets: [{
                label: 'Longitud de Código',
                data: Object.values(codigos).map(c => c.length),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function construirArbolHuffman(frec) {
    const nodos = Object.entries(frec).map(([s, f]) => ({ simbolo: s, frecuencia: f, izq: null, der: null }));
    while (nodos.length > 1) {
        nodos.sort((a, b) => a.frecuencia - b.frecuencia);
        const izq = nodos.shift(), der = nodos.shift();
        nodos.push({ simbolo: izq.simbolo + der.simbolo, frecuencia: izq.frecuencia + der.frecuencia, izq, der });
    }
    return nodos[0];
}

function generarCodigos(nodo, pref = '', codigos = {}) {
    if (!nodo.izq && !nodo.der) {
        codigos[nodo.simbolo] = pref;
    } else {
        generarCodigos(nodo.izq, pref + '0', codigos);
        generarCodigos(nodo.der, pref + '1', codigos);
    }
    return codigos;
}

function construirCodigosShannonFano(frec) {
    const simbolos = Object.entries(frec).map(([simbolo, frecuencia]) => ({ simbolo, frecuencia }));
    simbolos.sort((a, b) => b.frecuencia - a.frecuencia);
    
    const codigos = {};
    dividir(simbolos, codigos);
    
    return codigos;
}

function dividir(simbolos, codigos, pref = '') {
    // Caso base: cuando sólo queda un símbolo, asignamos el código
    if (simbolos.length === 1) {
        codigos[simbolos[0].simbolo] = pref;
        return;
    }

    // Calcular el total de frecuencias
    let total = simbolos.reduce((s, v) => s + v.frecuencia, 0);
    let acum = 0;
    let i = 0;

    // Buscar el punto de corte, donde las frecuencias de ambas mitades sean lo más equilibradas posible
    while (i < simbolos.length && acum + simbolos[i].frecuencia <= total / 2) {
        acum += simbolos[i].frecuencia;
        i++;
    }

    // Dividir en dos grupos y continuar la recursión
    dividir(simbolos.slice(0, i), codigos, pref + '0');
    dividir(simbolos.slice(i), codigos, pref + '1');
}

function codificarTexto(texto, codigos) {
    return texto.split('').map(c => codigos[c]).join('');
}

function mostrarTablaCodigos(codigos, elementoId) {
    const contenedor = document.getElementById(elementoId);
    contenedor.innerHTML = '<h3>Tabla de Códigos</h3>';
    const tabla = document.createElement('table');
    tabla.innerHTML = '<tr><th>Símbolo</th><th>Código</th><th>Longitud</th></tr>';
    for (const [simbolo, codigo] of Object.entries(codigos)) {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${simbolo}</td><td>${codigo}</td><td>${codigo.length}</td>`;
        tabla.appendChild(fila);
    }
    contenedor.appendChild(tabla);
}
