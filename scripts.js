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

    const mensajeHuffman = codificarTexto(textoActual, codigosHuffman);
    const tasaH = (textoActual.length * 8 / mensajeHuffman.length).toFixed(2);
    const efH = (tasaH / Math.log2(Object.keys(frecuencias).length)).toFixed(2);
    const longH = calcularLongitudPromedio(codigosHuffman, frecuencias).toFixed(2);

    document.getElementById("tasaHuffman").textContent = tasaH;
    document.getElementById("eficienciaHuffman").textContent = efH;
    document.getElementById("longitudHuffman").textContent = longH;

    const codigosSF = construirCodigosShannonFano(frecuencias);
    const mensajeSF = codificarTexto(textoActual, codigosSF);
    const tasaSF = (textoActual.length * 8 / mensajeSF.length).toFixed(2);
    const efSF = (tasaSF / Math.log2(Object.keys(frecuencias).length)).toFixed(2);
    const longSF = calcularLongitudPromedio(codigosSF, frecuencias).toFixed(2);

    document.getElementById("tasaSF").textContent = tasaSF;
    document.getElementById("eficienciaSF").textContent = efSF;
    document.getElementById("longitudSF").textContent = longSF;
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
    if (simbolos.length === 1) {
        codigos[simbolos[0].simbolo] = pref;
        return;
    }
    let total = simbolos.reduce((s, v) => s + v.frecuencia, 0);
    let acum = 0, i = 0;
    while (i < simbolos.length && acum < total / 2) {
        acum += simbolos[i].frecuencia;
        i++;
    }
    dividir(simbolos.slice(0, i), codigos, pref + '0');
    dividir(simbolos.slice(i), codigos, pref + '1');
}

function codificarTexto(texto, codigos) {
    return texto.split('').map(c => codigos[c]).join('');
}

function calcularLongitudPromedio(codigos, frec) {
    const total = Object.values(frec).reduce((a, b) => a + b, 0);
    return Object.entries(codigos).reduce((s, [simb, cod]) => s + cod.length * frec[simb], 0) / total;
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
