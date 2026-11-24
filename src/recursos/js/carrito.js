/*contiene reglas de negocio y persistencia del carrito*/
const CLAVE_CARRITO = 'carrito'
const COSTO_ENVIO_FIJO = 3500

/* Normaliza y sanea la estructura de los artículos del carrito*/
function normalizarCarrito(carrito) {
    if (!Array.isArray(carrito)) {
        return []
    }

    const carritoNormalizado = []

    carrito.forEach((articulo) => {
        const linea = typeof articulo === 'number'
            ? { id: articulo, talle: 'Sin especificar', color: 'Sin especificar', cantidad: 1 }
            : {
                id: Number(articulo.id),
                talle: articulo.talle || 'Sin especificar',
                color: articulo.color || 'Sin especificar',
                cantidad: Math.max(1, Number(articulo.cantidad) || 1)
            }

        const existente = carritoNormalizado.find((item) => {
            return item.id === linea.id && item.talle === linea.talle && item.color === linea.color
        })

        if (existente) {
            existente.cantidad += linea.cantidad
        } else if (Number.isFinite(linea.id)) {
            carritoNormalizado.push(linea)
        }
    })

    return carritoNormalizado
}

/* Obtiene los artículos del carrito almacenados en localStorage*/
function obtenerCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO)
        if (guardado) {
            return normalizarCarrito(JSON.parse(guardado))
        }
    } catch (error) {
        console.error('Error al leer el carrito de localStorage:', error)
    }
    return []
}


function guardarCarrito(carrito) {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(normalizarCarrito(carrito)))
    } catch (error) {
        console.error('Error al guardar el carrito en localStorage:', error)
    }
}


function vaciarCarrito() {
    try {
        localStorage.removeItem(CLAVE_CARRITO)
    } catch (error) {
        console.error('Error al vaciar el carrito:', error)
    }
}

/*Agrega un producto al carrito*/
function agregarAlCarrito({ id, talle = 'Sin especificar', color = 'Sin especificar', cantidad = 1 }) {
    const carrito = obtenerCarrito()
    const idNumerico = Number(id)
    const cantidadNumerica = Math.max(1, Number(cantidad) || 1)

    const itemExistente = carrito.find((item) => {
        return item.id === idNumerico && item.talle === talle && item.color === color
    })

    if (itemExistente) {
        itemExistente.cantidad += cantidadNumerica
    } else {
        carrito.push({
            id: idNumerico,
            talle,
            color,
            cantidad: cantidadNumerica
        })
    }

    guardarCarrito(carrito)
    return carrito
}


function eliminarDelCarrito(indice) {
    const carrito = obtenerCarrito()
    if (indice >= 0 && indice < carrito.length) {
        carrito.splice(indice, 1)
        guardarCarrito(carrito)
    }
    return carrito
}


function obtenerCantidadTotal(carrito = obtenerCarrito()) {
    return carrito.reduce((total, articulo) => total + articulo.cantidad, 0)
}

/*Calcula el subtotal en pesos sumando precio * cantidad de cada artículo*/
function calcularSubtotal(carrito, listaProductos) {
    return carrito.reduce((total, linea) => {
        const producto = listaProductos.find((p) => p.id === linea.id)
        return total + (producto ? producto.precio * linea.cantidad : 0)
    }, 0)
}


function calcularCostoEnvio(codigoPostal) {
    const cpLimpio = String(codigoPostal || '').trim()
    const esValido = /^[0-9]{4,8}$/.test(cpLimpio)

    if (!esValido) {
        return {
            valido: false,
            costo: 0,
            mensaje: 'Ingresá un código postal válido (de 4 a 8 números).'
        }
    }

    return {
        valido: true,
        costo: COSTO_ENVIO_FIJO,
        mensaje: `Envío estimado: $${COSTO_ENVIO_FIJO}. Es un costo fijo de referencia.`
    }
}

/*Suma el subtotal y el costo de envío*/
function calcularTotal(subtotal, costoEnvio) {
    return subtotal + costoEnvio
}

/*Construye el objeto de resumen de pedido para la confirmación de compra*/
function crearPedido({ nombre, email, direccion, pago, carrito, listaProductos }) {
    const subtotal = calcularSubtotal(carrito, listaProductos)
    const envio = carrito.length > 0 ? COSTO_ENVIO_FIJO : 0

    const articulos = carrito.map((linea) => {
        const producto = listaProductos.find((item) => item.id === linea.id)
        return {
            nombre: producto ? producto.nombre : 'Producto',
            talle: linea.talle,
            color: linea.color,
            cantidad: linea.cantidad,
            precio: producto ? producto.precio : 0
        }
    })

    return {
        nombre,
        email: email || '',
        direccion,
        pago: pago || 'No especificado',
        articulos,
        subtotal,
        envio,
        total: calcularTotal(subtotal, envio)
    }
}

/*Envía los datos del pedido a la plataforma de correos FormSubmit*/
async function enviarPedidoPorEmail(pedido) {
    const endpoint = 'https://formsubmit.co/ajax/ivodribe@gmail.com'

    const listaArticulosTexto = pedido.articulos
        .map((art) => `- ${art.nombre} (${art.talle}, ${art.color}) x${art.cantidad}: $${art.precio * art.cantidad}`)
        .join('\n')

    const datosEnvio = {
        _subject: `Nuevo pedido de ${pedido.nombre} - cba.urban`,
        _replyto: pedido.email,
        nombre: pedido.nombre,
        email: pedido.email,
        direccion: pedido.direccion,
        metodo_pago: pedido.pago,
        detalle_articulos: listaArticulosTexto,
        subtotal: `$${pedido.subtotal}`,
        costo_envio: `$${pedido.envio}`,
        total: `$${pedido.total}`
    }

    const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
    })

    if (!respuesta.ok) {
        throw new Error(`Error en el servidor de correo: ${respuesta.status}`)
    }

    return await respuesta.json()
}

export {
    CLAVE_CARRITO,
    COSTO_ENVIO_FIJO,
    normalizarCarrito,
    obtenerCarrito,
    guardarCarrito,
    vaciarCarrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    obtenerCantidadTotal,
    calcularSubtotal,
    calcularCostoEnvio,
    calcularTotal,
    crearPedido,
    enviarPedidoPorEmail
}
