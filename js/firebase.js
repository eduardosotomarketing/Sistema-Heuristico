/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: firebase.js
 * ----------------------------------------------------------
 * Inicialización de Firebase
 * Inicialización de Firestore
 *********************************************************************/


/* ==========================================================
   IMPORTACIONES FIREBASE
========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {

    getFirestore

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ==========================================================
   CONFIGURACIÓN
========================================================== */

import { firebaseConfig } from "./config.js";


/* ==========================================================
   INICIALIZAR FIREBASE
========================================================== */

const app = initializeApp(firebaseConfig);


/* ==========================================================
   FIRESTORE
========================================================== */

const db = getFirestore(app);


/* ==========================================================
   EXPORTACIONES
========================================================== */

export {

    app,

    db

};