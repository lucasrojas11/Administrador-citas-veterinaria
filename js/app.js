//campos del formulario 
const mascotaInput = document.querySelector('#mascota');
const propietarioInput = document.querySelector('#propietario');
const telefonoInput = document.querySelector('#telefono');
const fechaInput = document.querySelector('#fecha');
const horaInput = document.querySelector('#hora');
const sintomasInput = document.querySelector('#sintomas');

//UI
const formulario = document.querySelector('#nueva-cita');
const contenedorCitas = document.querySelector('#citas');

let editando;
let DB;

window.onload = () => {
    //Registrar eventos 
    eventListeners();
    
    crearDB();
}

class Citas {
    constructor() {
        this.citas = [];
    }

    agregarCita(cita){
        this.citas = [...this.citas, cita];

        //console.log(this.citas);
    }

    eliminarCitas(id){
        this.citas = this.citas.filter(cita => cita.id !== id);
    }

    editarCita(citaActualizada){
        this.citas = this.citas.map(cita => cita.id === citaActualizada.id ? citaActualizada : cita);

    }

}

class UI {
    
    imprimirAlerta(mensaje, tipo){
        //crear el div
        const divMensaje = document.createElement('div');
        divMensaje.classList.add('text-center', 'alert', 'd-block', 'col-12');
    
        //agregar clase en base al tipo de error
        if(tipo === 'error'){
            divMensaje.classList.add('alert-danger');
        }else{
            divMensaje.classList.add('alert-success');
        }

        //mensaje de error 
        divMensaje.textContent = mensaje;

        //agregar al DOM
        document.querySelector('#contenido').insertBefore(divMensaje, document.querySelector('#agregar-cita'));
        
        //quitar el alert despues de 5 segundos
        setTimeout(() => {
            divMensaje.remove();
        }, 5000);
    }

    imprimirCitas(){

        this.limpiarHTML()

        //Leer el contenido de la base de datos 
        const objectStore = DB.transaction('citas').objectStore('citas');
    
        objectStore.openCursor().onsuccess = (e) => {

            const cursor = e.target.result;
            if(cursor){
                const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cursor.value;

            const divCita = document.createElement('div');
            divCita.classList.add('cita', 'p-3');
            divCita.dataset.id = id;

            //scripting de los elementos de la cita
            const mascotaParrafo = document.createElement('h2');
            mascotaParrafo.classList.add('card-title', 'font-weight-bolder');
            mascotaParrafo.textContent = mascota;


            const propietarioParrafo = document.createElement('p');
            propietarioParrafo.innerHTML = `
                <span class="font-weight-bolder">Propietario: </span> ${propietario}
            `;

            const telefonoParrafo = document.createElement('p');
            telefonoParrafo.innerHTML = `
                <span class="font-weight-bolder">Teléfono: </span> ${telefono}
            `;

            const fechaParrafo = document.createElement('p');
            fechaParrafo.innerHTML = `
                <span class="font-weight-bolder">Fecha: </span> ${fecha}
            `;

            const horaParrafo = document.createElement('p');
            horaParrafo.innerHTML = `
                <span class="font-weight-bolder">Hora: </span> ${hora}
            `;

            const sintomasParrafo = document.createElement('p');
            sintomasParrafo.innerHTML = `
                <span class="font-weight-bolder">Síntomas: </span> ${sintomas}
            `;

            //boton para eliminar esta cita
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn', 'btn-danger', 'mr-2');
            btnEliminar.innerHTML = 'Eliminar <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

            btnEliminar.onclick = () =>eliminarCita(id);

            //Boton para editar
            const btnEditar = document.createElement('button');
            btnEditar.classList.add('btn', 'btn-info');
            btnEditar.innerHTML = 'Editar <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>'
            const cita = cursor.value;
            btnEditar.onclick = () => cargarEdicion(cita);

            //agregar los parrafos al divCita
            divCita.appendChild(mascotaParrafo);
            divCita.appendChild(propietarioParrafo);
            divCita.appendChild(telefonoParrafo);
            divCita.appendChild(fechaParrafo);
            divCita.appendChild(horaParrafo);
            divCita.appendChild(sintomasParrafo);
            divCita.appendChild(btnEliminar);
            divCita.appendChild(btnEditar);

            //agregar las citas al HTML 
            contenedorCitas.appendChild(divCita); 
            }

            //Ve al siguiente elemento
            cursor.continue();
        }
    }


    limpiarHTML(){
        while(contenedorCitas.firstChild){
            contenedorCitas.removeChild(contenedorCitas.firstChild);
        }
    }

}

const administrarCitas = new Citas();
const ui = new UI();



function eventListeners(){
    mascotaInput.addEventListener('input', datosCita);
    propietarioInput.addEventListener('input', datosCita);
    telefonoInput.addEventListener('input', datosCita);
    fechaInput.addEventListener('input', datosCita);
    horaInput.addEventListener('input', datosCita);
    sintomasInput.addEventListener('input', datosCita);

    formulario.addEventListener('submit', nuevaCita)
}

//Objeto con la informacion de la cita 
const citaObj = {
    mascota: '',
    propietario: '',
    telefono: '',
    fecha: '',
    hora: '',
    sintomas: '',
}

//agrega datos al objeto de cita 
function datosCita(e){
    citaObj[e.target.name] = e.target.value;
}

//valida y agrega una nueva cita a la clase de citas
function nuevaCita(e){
    e.preventDefault();

    //extraer la informacion del objeto de cita
    const {mascota, propietario, telefono, fecha, hora, sintomas} = citaObj;

    //validar
    if(mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === ''){
        ui.imprimirAlerta('Todos los campos son obligatorios', 'error');

        return;
    }

    if(editando){
        
        //Pasar el objeto de la cita a edicion 
        administrarCitas.editarCita({...citaObj});
        
        //Editar en indexDB 
        const transaction = DB.transaction(['citas'], 'readwrite');
        const objectStore = transaction.objectStore(['citas']);
        
        objectStore.put(citaObj);
        transaction.oncomplete = () => {
            ui.imprimirAlerta('Editado correctamente');
            
            //regresar el texto del boton a su estado original 
            formulario.querySelector('button[type=submit]').textContent = 'Crear Cita';
            
            //Quitar modo edicion
            editando = false;
        }

        transaction.onerror = () => {
            console.log('Hubo un Error')
        }


    }else{
        //generar un id unico
        citaObj.id = Date.now();
    
        //crear una nueva cita
        administrarCitas.agregarCita({...citaObj});

        //insertar registro en indexDB
        const transaction = DB.transaction(['citas'], 'readwrite');
        
        //habilitar el objectStore
        const objectStore = transaction.objectStore('citas');

        //Insertar el la DB
        objectStore.add(citaObj);

        transaction.oncomplete = () => {
            //mensaje de agregado correctamente
            ui.imprimirAlerta('Se agrego correctamente');

        }
    }


    //Reiniciar el objeto para la validacion 
    reiniciarObjeto();

    //reiniciar el formulario
    formulario.reset();

    //mostrar el HTML de las citas
    ui.imprimirCitas();
}

function reiniciarObjeto(){
    citaObj.mascota = '',
    citaObj.propietario = '',
    citaObj.telefono = '',
    citaObj.fecha = '',
    citaObj.hora = '',
    citaObj.sintomas = ''
}

function eliminarCita(id){
    //Eliminar la cita de la DB
    const transaction = DB .transaction(['citas'], 'readwrite');
    const objectStore = transaction.objectStore('citas');

    objectStore.delete(id);

    transaction.oncomplete = () => {
        //Muestra un mensaje de cita eliminada  
        ui.imprimirAlerta('La cita se eliminó correctamente');
    }
    transaction.onerror = () => {
        console.log('Hubo un error');
    }



    //Refrescar las citas 
    ui.imprimirCitas();
}

function cargarEdicion(cita){ 
    const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cita;

    //Llenar los inputs 
    mascotaInput.value = mascota;
    propietarioInput.value = propietario;
    telefonoInput.value = telefono;
    fechaInput.value = fecha;
    horaInput.value = hora;
    sintomasInput.value = sintomas;

    //llenar el objeto 
    citaObj.mascota = mascota;
    citaObj.propietario = propietario;
    citaObj.telefono = telefono;
    citaObj.fecha = fecha;
    citaObj.hora = hora;
    citaObj.sintomas = sintomas;
    citaObj.id = id;

    //Cambiar el texto del boton
    formulario.querySelector('button[type=submit]').textContent = 'Guardar Cambios';

    editando = true;
}


//Crear la DB
function crearDB(){
    //crear la DB en version 1.0
    const crearDB = window.indexedDB.open('Citas', 1);

    //Si hay un error 
    crearDB.onerror = () => {
        console.log('hubo un error')
    }

    //si todo sale bien 
    crearDB.onsuccess = () => {
        DB = crearDB.result;
        
        //mostrar citas al cargar (pero indexedDB ya esta listo)
        ui.imprimirCitas();
    }

    //Definir el schema
    crearDB.onupgradeneeded = (e) => {
        const db = e.target.result;

        const objectStore = db.createObjectStore('citas', {
            keyPath: 'id',
            autoIncrement: true,
        });

        //definir todas las columnas 
        objectStore.createIndex('mascota', 'mascota', {unique: false});
        objectStore.createIndex('propietario', 'propietario', {unique: false});
        objectStore.createIndex('telefono', 'telefono', {unique: false});
        objectStore.createIndex('fecha', 'fecha', {unique: false});
        objectStore.createIndex('hora', 'hora', {unique: false});
        objectStore.createIndex('sintomas', 'sintomas', {unique: false});
        objectStore.createIndex('id', 'id', {unique: true});
    }
} 

