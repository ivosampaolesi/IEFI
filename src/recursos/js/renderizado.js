/*renderizado visual y manipulación del DOM*/

import { cargarProductos } from './productos.js'
import {
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
    COSTO_ENVIO_FIJO
} from './carrito.js'

/*Actualiza el contador numérico de prendas en el ícono del carrito*/
function actualizarContadorHeader() {
    const elementoContador = document.getElementById('productos-seleccionados')
    if (elementoContador) {
        elementoContador.textContent = `(${obtenerCantidadTotal()})`
    }
}

/*Renderiza la grilla de productos en el contenedor del catálogo*/
function renderizarCatalogo(contenedor, productos) {
    if (!contenedor) return

    if (productos.length === 0) {
        contenedor.innerHTML = '<p>No hay productos que coincidan con la búsqueda.</p>'
        return
    }

    const html = productos.map((producto) => `
        <article class="articulo-catalogo">
            <img class="imagen-catalogo" src="${producto.imagen}" alt="${producto.nombre}">
            <h4>${producto.nombre}</h4>
            <p>$${producto.precio}</p>
            <a href="producto.html?id=${producto.id}" class="enlace-ver-producto" data-id="${producto.id}">Ver producto</a>
            <button class="boton-agregar-producto" data-id="${producto.id}">Añadir al carro</button>
        </article>
    `).join('')

    contenedor.innerHTML = html
}

/*Renderiza la ficha técnica completa de un producto en la página de detalle*/
function renderizarDetalleProducto(contenedor, producto) {
    if (!contenedor || !producto) return

    const opcionesTalles = ['<option value="">Seleccionar talle</option>']
        .concat(producto.talles.map((talle) => `<option value="${talle}">${talle}</option>`))
        .join('')

    const opcionesColores = producto.colores
        .map((color) => `<option value="${color}">${color}</option>`)
        .join('')

    contenedor.innerHTML = `
        <!-- imágenes -->
        <section class="producto-imagenes">
            <img src="${producto.imagen}" alt="${producto.nombre}">
        </section>

        <!-- datos y configuración de compra -->
        <section class="producto-datos">
            <h2>${producto.nombre}</h2>
            <p class="precio">Precio: $${producto.precio}</p>
            <p class="cuotas">3 cuotas sin interés</p>
            <p><strong>Stock disponible</strong></p>

            <p class="descripcion">Descripción: ${producto.descripcion}</p>

            <!-- formulario de compra -->
            <form class="form-compra" action="carrito.html" method="get">
                <input type="hidden" name="id" value="${producto.id}">
                
                <label for="select-color">Color:</label>
                <select id="select-color" name="color" required>
                    ${opcionesColores}
                </select>
                
                <label for="select-talle">Talle:</label>
                <select id="select-talle" name="talle" required>
                    ${opcionesTalles}
                </select>
                
                <label for="input-cantidad">Cantidad:</label>
                <input type="number" id="input-cantidad" name="cantidad" value="1" min="1" required>
                
                <button type="submit" id="boton-agregar-detalle" data-id="${producto.id}">Agregar al carrito</button>
            </form>

            <!-- guía de medidas -->
            <section class="guia-medidas">
                <h3>Tabla de Medidas</h3>
                <table>
                    <caption>Medidas en centímetros</caption>
                    <thead>
                        <tr>
                            <th scope="col">Talle</th>
                            <th scope="col">Ancho</th>
                            <th scope="col">Largo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>S</td><td>54 cm</td><td>72 cm</td></tr>
                        <tr><td>M</td><td>56 cm</td><td>74 cm</td></tr>
                        <tr><td>L</td><td>58 cm</td><td>76 cm</td></tr>
                        <tr><td>XL</td><td>60 cm</td><td>78 cm</td></tr>
                    </tbody>
                </table>
            </section>

            <!-- cálculo de envío -->
            <section class="calculo-envio">
                <h3>Calcular Envío</h3>
                <form class="form-envio" action="#" method="get">
                    <label for="cp-envio">Código Postal:</label>
                    <input type="text" id="cp-envio" name="cp" placeholder="5000">
                    <button type="button">Calcular</button>
                </form>
            </section>
        </section>
    `

  
    const rutaProducto = document.getElementById('ruta-producto')
    if (rutaProducto) rutaProducto.textContent = producto.nombre

    document.title = `cba.urban - ${producto.nombre}`
    const tituloDetalleH1 = document.getElementById('titulo-detalle-h1')
    if (tituloDetalleH1) {
        tituloDetalleH1.textContent = `Detalle del producto: ${producto.nombre}`
    }
}

/*Obtiene el ID del producto seleccionado*/
function obtenerIdProductoSeleccionado() {
    try {
        const parametros = new URLSearchParams(window.location.search)
        const idParam = parametros.get('id')
        if (idParam) return parseInt(idParam, 10)
    } catch (e) {
        console.error(e)
    }

    try {
        const idGuardado = localStorage.getItem('productoSeleccionado')
        if (idGuardado) return parseInt(idGuardado, 10)
    } catch (e) {
        console.error(e)
    }

    return 1
}

/*Inicia y controla la vista en la página de Detalle de Producto*/
function iniciarPaginaProducto(productos) {
    const contenedorDetalle = document.getElementById('contenedor-detalle-producto')
    if (!contenedorDetalle) return

    const idSeleccionado = obtenerIdProductoSeleccionado()
    const producto = productos.find((item) => item.id === idSeleccionado)

    if (!producto) {
        contenedorDetalle.textContent = 'No encontramos el producto seleccionado.'
        return
    }

    renderizarDetalleProducto(contenedorDetalle, producto)

    const formCompra = contenedorDetalle.querySelector('.form-compra')
    if (formCompra) {
        formCompra.addEventListener('submit', (evento) => {
            evento.preventDefault()
            const datos = new FormData(formCompra)
            const cantidad = Number(datos.get('cantidad'))

            if (!Number.isInteger(cantidad) || cantidad < 1) {
                alert('Ingresá una cantidad válida.')
                return
            }

            agregarAlCarrito({
                id: producto.id,
                talle: String(datos.get('talle')),
                color: String(datos.get('color')),
                cantidad
            })

            actualizarContadorHeader()
            window.location.href = 'carrito.html'
        })
    }
}

/*Renderiza los artículos y totales en la página del carrito*/
function renderizarVistaCarrito(contenedorCarrito, productos) {
    const carrito = obtenerCarrito()
    actualizarContadorHeader()

    const tituloCarrito = document.getElementById('titulo-carrito')
    const resumenSubtotal = document.getElementById('resumen-subtotal')
    const resumenEnvio = document.getElementById('resumen-envio')
    const resumenTotal = document.getElementById('resumen-total')
    const costoEnvioTexto = document.getElementById('costo-envio-texto')

    if (tituloCarrito) {
        tituloCarrito.textContent = `MI CARRITO (${obtenerCantidadTotal(carrito)})`
    }

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = `
            <p class="mensaje-carrito-vacio">
                Tu carrito está actualmente vacío. Podés explorar nuestras prendas en el
                <a href="catalogo.html">Catálogo</a>.
            </p>
        `
        if (resumenSubtotal) resumenSubtotal.textContent = '$0'
        if (resumenEnvio) resumenEnvio.textContent = '$0'
        if (resumenTotal) resumenTotal.textContent = '$0'
        if (costoEnvioTexto) costoEnvioTexto.textContent = 'Costo de envío estimado: $0'
        return
    }

    let subtotal = 0
    let html = ''

    carrito.forEach((linea, indice) => {
        const producto = productos.find((p) => p.id === linea.id)
        if (producto) {
            subtotal += producto.precio * linea.cantidad
            html += `
                <article>
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div>
                        <h4>${producto.nombre}</h4>
                        <p>Color: ${linea.color} · Talle: ${linea.talle}</p>
                        <p>Precio unitario: $${producto.precio}</p>
                    </div>
                    <div>
                        <span>Cantidad: ${linea.cantidad}</span>
                        <button type="button" class="boton-eliminar" data-indice="${indice}">
                            Eliminar producto
                        </button>
                    </div>
                </article>
            `
        }
    })

    contenedorCarrito.innerHTML = html

    const costoEnvio = COSTO_ENVIO_FIJO
    const total = calcularTotal(subtotal, costoEnvio)

    if (resumenSubtotal) resumenSubtotal.textContent = `$${subtotal}`
    if (resumenEnvio) resumenEnvio.textContent = `$${costoEnvio}`
    if (resumenTotal) resumenTotal.textContent = `$${total}`
    if (costoEnvioTexto) costoEnvioTexto.textContent = `Costo de envío estimado: $${costoEnvio}`

    
    contenedorCarrito.querySelectorAll('.boton-eliminar').forEach((boton) => {
        boton.addEventListener('click', () => {
            const indice = Number(boton.dataset.indice)
            eliminarDelCarrito(indice)
            renderizarVistaCarrito(contenedorCarrito, productos)
        })
    })
}

/*Inicia y controla los eventos de la página del carrito*/
function iniciarPaginaCarrito(productos) {
    const contenedorCarrito = document.getElementById('contenedor-carrito')
    if (!contenedorCarrito) return

    const botonCalcularEnvio = document.getElementById('boton-calcular-envio')
    const inputCP = document.getElementById('cp-calc')
    const costoEnvioTexto = document.getElementById('costo-envio-texto')
    const formCheckout = document.getElementById('form-checkout')

    if (botonCalcularEnvio && inputCP && costoEnvioTexto) {
        botonCalcularEnvio.addEventListener('click', () => {
            const resultado = calcularCostoEnvio(inputCP.value)
            costoEnvioTexto.textContent = resultado.mensaje
        })
    }

    
    document.querySelectorAll('.boton-sugerido').forEach((boton) => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.id)
            const producto = productos.find((p) => p.id === id)
            if (producto) {
                agregarAlCarrito({
                    id: producto.id,
                    talle: producto.talles[0] || 'M',
                    color: producto.colores[0] || 'Negro',
                    cantidad: 1
                })
                renderizarVistaCarrito(contenedorCarrito, productos)
            }
        })
    })

    
    if (formCheckout) {
        formCheckout.addEventListener('submit', (evento) => {
            const carrito = obtenerCarrito()
            if (carrito.length === 0) {
                evento.preventDefault()
                alert('Tu carrito está vacío. Agregá un producto antes de continuar.')
                return
            }

            if (inputCP && !/^[0-9]{4,8}$/.test(inputCP.value.trim())) {
                evento.preventDefault()
                if (costoEnvioTexto) {
                    costoEnvioTexto.textContent = 'Ingresá un código postal válido (de 4 a 8 números).'
                }
                inputCP.focus()
                return
            }

            const datosComprador = new FormData(formCheckout)
            const pedido = crearPedido({
                nombre: String(datosComprador.get('nombre') || ''),
                direccion: String(datosComprador.get('direccion') || ''),
                carrito,
                listaProductos: productos
            })

            sessionStorage.setItem('pedidoPendiente', JSON.stringify(pedido))
        })
    }

    renderizarVistaCarrito(contenedorCarrito, productos)
}

/*Inicializa y controla la vista en la página de Confirmación*/
function iniciarPaginaConfirmacion() {
    const contenedorConfirmacion = document.getElementById('confirmacion-compra')
    if (!contenedorConfirmacion) return

    const pedido = JSON.parse(sessionStorage.getItem('pedidoPendiente') || 'null')

    if (!pedido || !pedido.articulos || pedido.articulos.length === 0) {
        contenedorConfirmacion.innerHTML = `
            <h2>No hay una compra para confirmar</h2>
            <p>Podés revisar el carrito y completar el pedido.</p>
            <p><a href="carrito.html">Volver al carrito</a></p>
        `
        return
    }

    const itemsHTML = pedido.articulos.map((art) => `
        <li>${art.nombre} - talle ${art.talle}, color ${art.color}, cantidad ${art.cantidad}</li>
    `).join('')

    contenedorConfirmacion.innerHTML = `
        <h2>Pedido confirmado</h2>
        <p>Gracias, ${pedido.nombre}.</p>
        <p>Dirección de entrega: ${pedido.direccion}</p>
        <ul>${itemsHTML}</ul>
        <p>Subtotal: $${pedido.subtotal}</p>
        <p>Envío estimado: $${pedido.envio}</p>
        <p>Total: <strong>$${pedido.total}</strong></p>
        <p>Esta compra es una simulación. No se procesó un pago real.</p>
        <p><a href="catalogo.html">Seguir comprando</a></p>
    `

    vaciarCarrito()
    sessionStorage.removeItem('pedidoPendiente')
    actualizarContadorHeader()
}


async function iniciarUI() {
    actualizarContadorHeader()

    const necesitaProductos = Boolean(
        document.getElementById('contenedor-detalle-producto') ||
        document.getElementById('contenedor-carrito')
    )

    if (necesitaProductos) {
        try {
            const productos = await cargarProductos()
            iniciarPaginaProducto(productos)
            iniciarPaginaCarrito(productos)
        } catch (error) {
            console.error('Error al inicializar vistas con productos:', error)
        }
    }

    iniciarPaginaConfirmacion()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarUI)
} else {
    iniciarUI()
}

export {
    actualizarContadorHeader,
    renderizarCatalogo,
    renderizarDetalleProducto,
    renderizarVistaCarrito,
    iniciarPaginaProducto,
    iniciarPaginaCarrito,
    iniciarPaginaConfirmacion,
    iniciarUI
}
