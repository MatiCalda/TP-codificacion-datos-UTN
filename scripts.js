let textoActual = "";
let graficoFrecuencias = null;
let graficoCodigos = null;


// Carga deL texto ingresado, ya sea por texto o un archivo
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

    const codigosSF = construirCodigosShannonFano(frecuencias);
    mostrarTablaCodigos(codigosSF, frecuencias);
    graficarLongitudes(codigosHuffman);

    // Calcular la entropía
    const entropia = calcularEntropia(frecuencias);

    // Calcular longitud promedio para Shannon-Fano
    const longSF = calcularLongitudPromedio(codigosSF, frecuencias);
    
    // Calcular eficiencia
    const efSF = ((entropia / longSF)  * 100).toFixed(3);

    // Mostrar resultados
    document.getElementById("entropiaSF").textContent = entropia;
    //document.getElementById("tasaSF").textContent = tasaSF;
    document.getElementById("eficienciaSF").textContent = efSF;
    document.getElementById("longitudSF").textContent = longSF;

    console.log("Texto actual:", textoActual);
    console.log("Codigos SF:", codigosSF);
    console.log("Mensaje SF:", mensajeSF);
    console.log("Entropía:", entropia);
    console.log("Longitud promedio:", longSF);
    console.log("Eficiencia:", efSF);
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

function construirCodigosShannonFano(frecuencias) {
    // Convertir a lista de objetos
    const simbolos = Object.entries(frecuencias).map(([simbolo, frecuencia]) => ({
        simbolo,
        frecuencia
    }));

    // Ordenar de mayor a menor frecuencia
    simbolos.sort((a, b) => b.frecuencia - a.frecuencia);

    // Detectar el símbolo más frecuente (para asegurarnos que reciba '0')
    const simboloMasFrecuente = simbolos[0].simbolo;

    const codigos = {};
    dividir(simbolos, codigos, '', simboloMasFrecuente); // pasamos símbolo más frecuente
    return codigos;
}

function dividir(simbolos, codigos, pref = '', simboloMasFrecuente) {
    if (simbolos.length === 1) {
        codigos[simbolos[0].simbolo] = pref;
        return;
    }

    let mejorDiferencia = Infinity;
    let mejorI = 1;

    for (let i = 1; i < simbolos.length; i++) {
        const grupo1 = simbolos.slice(0, i);
        const grupo2 = simbolos.slice(i);
        const suma1 = grupo1.reduce((s, x) => s + x.frecuencia, 0);
        const suma2 = grupo2.reduce((s, x) => s + x.frecuencia, 0);
        const diferencia = Math.abs(suma1 - suma2);

        if (diferencia < mejorDiferencia) {
            mejorDiferencia = diferencia;
            mejorI = i;
        }
    }

    let grupo1 = simbolos.slice(0, mejorI);
    let grupo2 = simbolos.slice(mejorI);

    // 📌 Asegurarse que el grupo con el símbolo más frecuente reciba '0'
    const grupo1TieneMasFrecuente = grupo1.some(s => s.simbolo === simboloMasFrecuente);
    const grupo2TieneMasFrecuente = grupo2.some(s => s.simbolo === simboloMasFrecuente);

    if (grupo2TieneMasFrecuente) {
        [grupo1, grupo2] = [grupo2, grupo1]; // invertimos si está en el segundo grupo
    }

    dividir(grupo1, codigos, pref + '0', simboloMasFrecuente);
    dividir(grupo2, codigos, pref + '1', simboloMasFrecuente);
}


function mostrarTablaCodigos(codigos, frecuencias) {
    const contenedor = document.getElementById("tabla-codigos");
    contenedor.innerHTML = '<h3>Tabla de Códigos</h3>';
    
    const tabla = document.createElement('table');
    tabla.innerHTML = '<tr><th>Símbolo</th><th>Código</th><th>Longitud</th>';

    // Ordenar los símbolos por frecuencia descendente
    const simbolosOrdenados = Object.keys(codigos).sort((a, b) => frecuencias[b] - frecuencias[a]);

    for (const simbolo of simbolosOrdenados) {
        const codigo = codigos[simbolo];
        const frecuencia = frecuencias[simbolo];
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${simbolo}</td><td>${codigo}</td><td>${codigo.length}</td>`;
        tabla.appendChild(fila);
    }

    contenedor.appendChild(tabla);
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