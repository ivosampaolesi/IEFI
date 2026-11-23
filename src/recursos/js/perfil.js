/*controlador de datos de usuario y formulario de perfil*/

const CLAVE_PERFIL = 'perfilUsuario'

/*Carga los datos previamente guardados del usuario*/
function cargarDatosPerfil(formulario, clave = CLAVE_PERFIL) {
    if (!formulario) return

    try {
        const datos = JSON.parse(localStorage.getItem(clave) || 'null')
        if (datos) {
            Object.entries(datos).forEach(([nombre, valor]) => {
                const campo = formulario.elements.namedItem(nombre)
                if (campo) {
                    campo.value = valor
                }
            })
        }
    } catch (error) {
        console.error('No se pudo leer el perfil guardado:', error)
    }
}

/*Guarda los datos del formulario en localStorage*/
function guardarDatosPerfil(formulario, elementoMensaje, clave = CLAVE_PERFIL) {
    if (!formulario || !formulario.reportValidity()) return

    const datos = Object.fromEntries(new FormData(formulario).entries())

    try {
        localStorage.setItem(clave, JSON.stringify(datos))
        if (elementoMensaje) {
            elementoMensaje.textContent = 'Los cambios se guardaron en este navegador.'
        }
    } catch (error) {
        console.error('Error al guardar el perfil:', error)
        if (elementoMensaje) {
            elementoMensaje.textContent = 'No se pudieron guardar los cambios en este navegador.'
        }
    }
}


function iniciarPerfil() {
    const formulario = document.getElementById('form-perfil')
    const elementoMensaje = document.getElementById('mensaje-perfil')

    if (!formulario) return

    cargarDatosPerfil(formulario)

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault()
        guardarDatosPerfil(formulario, elementoMensaje)
    })
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPerfil)
} else {
    iniciarPerfil()
}

export {
    cargarDatosPerfil,
    guardarDatosPerfil,
    iniciarPerfil
}
