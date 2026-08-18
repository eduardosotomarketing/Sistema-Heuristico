
/***********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: js/database/Database.js
 *
 * Capa genérica de acceso a Firebase Firestore.
 *
 * RESPONSABILIDADES:
 * - Crear documentos
 * - Crear documentos con ID automático
 * - Leer documentos
 * - Leer colecciones
 * - Actualizar documentos
 * - Eliminar documentos
 * - Comprobar existencia
 * - Contar documentos
 *
 * Esta clase NO contiene lógica de sorteos.
 * La lógica pertenece a services y Motores.
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
    orderBy

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "../firebase.js";


export default class Database {


    /*========================================================
        CONSTRUCTOR
    ========================================================*/

    constructor() {

        if (!db) {

            throw new Error(

                "Firebase Firestore no está disponible."

            );

        }

        this.db = db;

    }


    /*========================================================
        COLECCIÓN
    ========================================================*/

    collection(nombre) {

        if (!nombre) {

            throw new Error(

                "Debe indicar el nombre de la colección."

            );

        }


        return collection(

            this.db,

            nombre

        );

    }


    /*========================================================
        DOCUMENTO
    ========================================================*/

    document(
        nombre,
        id
    ) {

        if (!nombre) {

            throw new Error(

                "Debe indicar el nombre de la colección."

            );

        }


        if (
            id === undefined ||
            id === null ||
            id === ""
        ) {

            throw new Error(

                "Debe indicar el ID del documento."

            );

        }


        return doc(

            this.db,

            nombre,

            String(id)

        );

    }


    /*========================================================
        CREAR CON ID
    ========================================================*/

    async create(
        collectionName,
        id,
        data
    ) {

        if (!data) {

            throw new Error(

                "No se proporcionaron datos para guardar."

            );

        }


        try {

            await setDoc(

                this.document(
                    collectionName,
                    id
                ),

                data

            );


            return true;

        }

        catch (error) {

            console.error(

                "Database.create():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        CREAR CON ID AUTOMÁTICO
    ========================================================*/

    async add(
        collectionName,
        data
    ) {

        try {

            const referencia =
                await addDoc(

                    this.collection(
                        collectionName
                    ),

                    data

                );


            return referencia.id;

        }

        catch (error) {

            console.error(

                "Database.add():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        LEER DOCUMENTO
    ========================================================*/

    async read(
        collectionName,
        id
    ) {

        try {

            const referencia =
                this.document(

                    collectionName,

                    id

                );


            const documento =
                await getDoc(
                    referencia
                );


            if (
                !documento.exists()
            ) {

                return null;

            }


            return {

                id:
                    documento.id,

                ...documento.data()

            };

        }

        catch (error) {

            console.error(

                "Database.read():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        LEER TODOS
    ========================================================*/

    async readAll(
        collectionName,
        orden = null,
        direccion = "asc"
    ) {

        try {

            let referencia =
                this.collection(
                    collectionName
                );


            /*
             * Si existe campo de orden,
             * utilizar orderBy de Firestore.
             */

            if (orden) {

                referencia =
                    query(

                        referencia,

                        orderBy(

                            orden,

                            direccion

                        )

                    );

            }


            const snapshot =
                await getDocs(
                    referencia
                );


            const lista = [];


            snapshot.forEach(
                documento => {

                    lista.push({

                        id:
                            documento.id,

                        ...documento.data()

                    });

                }
            );


            return lista;

        }

        catch (error) {

            console.error(

                "Database.readAll():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        ACTUALIZAR
    ========================================================*/

    async update(
        collectionName,
        id,
        data
    ) {

        try {

            await updateDoc(

                this.document(

                    collectionName,

                    id

                ),

                data

            );


            return true;

        }

        catch (error) {

            console.error(

                "Database.update():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        ELIMINAR
    ========================================================*/

    async delete(
        collectionName,
        id
    ) {

        try {

            await deleteDoc(

                this.document(

                    collectionName,

                    id

                )

            );


            return true;

        }

        catch (error) {

            console.error(

                "Database.delete():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        EXISTE
    ========================================================*/

    async exists(
        collectionName,
        id
    ) {

        try {

            const documento =
                await getDoc(

                    this.document(

                        collectionName,

                        id

                    )

                );


            return documento.exists();

        }

        catch (error) {

            console.error(

                "Database.exists():",

                error

            );

            throw error;

        }

    }


    /*========================================================
        CONTAR DOCUMENTOS
    ========================================================*/

    async count(
        collectionName
    ) {

        const documentos =
            await this.readAll(
                collectionName
            );


        return documentos.length;

    }

}