/***********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Database.js
 *
 * Clase genérica para Firestore
 ***********************************************************************/

import {

    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { db } from "../firebase.js";

export default class Database{

    constructor(){

        this.db=db;

    }

    /*========================================================
        OBTENER COLECCIÓN
    ========================================================*/

    collection(nombre){

        return collection(

            this.db,

            nombre

        );

    }

    /*========================================================
        DOCUMENTO
    ========================================================*/

    document(nombre,id){

        return doc(

            this.db,

            nombre,

            id

        );

    }

    /*========================================================
        CREAR
    ========================================================*/

    async create(collectionName,id,data){

        try{

            await setDoc(

                this.document(collectionName,id),

                data

            );

            return true;

        }

        catch(error){

            console.error(error);

            return false;

        }

    }

    /*========================================================
        AGREGAR AUTOMÁTICO
    ========================================================*/

    async add(collectionName,data){

        try{

            const response=await addDoc(

                this.collection(collectionName),

                data

            );

            return response.id;

        }

        catch(error){

            console.error(error);

            return null;

        }

    }

    /*========================================================
        LEER
    ========================================================*/

    async read(collectionName,id){

        try{

            const documento=await getDoc(

                this.document(collectionName,id)

            );

            if(documento.exists()){

                return documento.data();

            }

            return null;

        }

        catch(error){

            console.error(error);

            return null;

        }

    }

    /*========================================================
        TODOS
    ========================================================*/

    async readAll(collectionName,orden="id"){

        try{

            const consulta=query(

                this.collection(collectionName),

                orderBy(orden)

            );

            const snapshot=await getDocs(consulta);

            let lista=[];

            snapshot.forEach(item=>{

                lista.push(item.data());

            });

            return lista;

        }

        catch(error){

            console.error(error);

            return [];

        }

    }

    /*========================================================
        ACTUALIZAR
    ========================================================*/

    async update(collectionName,id,data){

        try{

            await updateDoc(

                this.document(collectionName,id),

                data

            );

            return true;

        }

        catch(error){

            console.error(error);

            return false;

        }

    }

    /*========================================================
        ELIMINAR
    ========================================================*/

    async delete(collectionName,id){

        try{

            await deleteDoc(

                this.document(collectionName,id)

            );

            return true;

        }

        catch(error){

            console.error(error);

            return false;

        }

    }

    /*========================================================
        EXISTE
    ========================================================*/

    async exists(collectionName,id){

        const documento=await getDoc(

            this.document(collectionName,id)

        );

        return documento.exists();

    }

}