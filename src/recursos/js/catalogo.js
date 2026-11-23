/*controlador de la página de catálogo y filtros*/

import { cargarProductos } from './productos.js'
import { renderizarCatalogo, actualizarContadorHeader } from './renderizado.js'
import { agregarAlCarrito } from './carrito.js'

/*Filtra la lista de productos por talle*/
function filtrarPorTalle(productos, talle) {
    if (!talle || talle === 'todos') return productos
    return productos.filter((producto) => {
        return producto.talles.map((t) => t.toUpperCase()).includes(talle.toUpperCase())
    })
}

/*Filtra la lista de productos por categoría.*/
function filtrarPorCategoria(productos, categoria) {
    if (!categoria || categoria === 'todas') return productos
    return productos.filter((producto) => {
        return producto.categoria.toLowerCase() === categoria.toLowerCase()
    })
}

/*Filtra la lista de productos por coincidencia de texto*/
function filtrarPorTexto(productos, texto) {
    const busqueda = (texto || '').trim().toLowerCase()
    if (!busqueda) return productos

    return productos.filter((producto) => {
        const datosProducto = `${producto.nombre} ${producto.descripcion} ${producto.categoria} ${producto.colores.join(' ')}`
        return datosProducto.toLowerCase().includes(busqueda)
    })
}

function aplicarFiltros(productos, { texto, categoria, talle }) {
    let resultado = filtrarPorTexto(productos, texto)
    resultado = filtrarPorCategoria(resultado, categoria)
    resultado = filtrarPorTalle(resultado, talle)
    return resultado
}

function asignarEventosBotones(contenedor, productos, dialogo) {
    if (!contenedor) return

    const botonesAgregar = contenedor.querySelectorAll('.boton-agregar-producto')
    botonesAgregar.forEach((boton) => {
        boton.addEventListener('click', () => {
            const idProducto = parseInt(boton.dataset.id, 10)
            const producto = productos.find((item) => item.id === idProducto)
            if (!producto) return

            agregarAlCarrito({
                id: producto.id,
                talle: producto.talles[0] || 'M',
                color: producto.colores[0] || 'Negro',
                cantidad: 1
            })

            actualizarContadorHeader()

            if (dialogo && typeof dialogo.showModal === 'function') {
                dialogo.showModal()
            }
        })
    })

    const enlacesVer = contenedor.querySelectorAll('.enlace-ver-producto')
    enlacesVer.forEach((enlace) => {
        enlace.addEventListener('click', () => {
            const id = parseInt(enlace.dataset.id, 10)
            localStorage.setItem('productoSeleccionado', id)
        })
    })
}

/*Función principal que inicializa el catálogo y sus eventos*/
async function iniciarCatalogo() {
    const contenedorProductos = document.getElementById('contenedor-productos')
    if (!contenedorProductos) return

    const dialogo = document.getElementById('dialogo')
    const botonFiltrar = document.getElementById('boton-aplicar-filtros')
    const botonLimpiar = document.getElementById('boton-limpiar-filtros')
    const selectCategoria = document.getElementById('filtro-categoria')
    const selectTalle = document.getElementById('filtro-talle')
    const inputBuscar = document.getElementById('buscar-nav')

    actualizarContadorHeader()

    let productos = []

    try {
        productos = await cargarProductos()
    } catch (error) {
        console.error('Error al cargar productos en catálogo:', error)
        contenedorProductos.innerHTML = '<p role="alert">No se pudieron cargar los productos. Intentá recargar la página.</p>'
        return
    }

    const parametros = new URLSearchParams(window.location.search)
    if (inputBuscar && parametros.has('q')) {
        inputBuscar.value = parametros.get('q') || ''
    }

    function refrescarCatalogo() {
        const texto = inputBuscar ? inputBuscar.value : ''
        const categoria = selectCategoria ? selectCategoria.value : 'todas'
        const talle = selectTalle ? selectTalle.value : 'todos'

        const productosFiltrados = aplicarFiltros(productos, { texto, categoria, talle })
        renderizarCatalogo(contenedorProductos, productosFiltrados)
        asignarEventosBotones(contenedorProductos, productos, dialogo)
    }

    if (botonFiltrar) {
        botonFiltrar.addEventListener('click', refrescarCatalogo)
    }

    if (botonLimpiar) {
        botonLimpiar.addEventListener('click', () => {
            if (selectCategoria) selectCategoria.value = 'todas'
            if (selectTalle) selectTalle.value = 'todos'
            if (inputBuscar) inputBuscar.value = ''
            refrescarCatalogo()
        })
    }

    if (inputBuscar) {
        inputBuscar.addEventListener('input', refrescarCatalogo)
    }

    // Renderizado inicial
    refrescarCatalogo()
}

// Ejecutar al cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarCatalogo)
} else {
    iniciarCatalogo()
}

export {
    filtrarPorTalle,
    filtrarPorCategoria,
    filtrarPorTexto,
    aplicarFiltros,
    iniciarCatalogo
}
