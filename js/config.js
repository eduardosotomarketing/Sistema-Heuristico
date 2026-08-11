/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Archivo: config.js
 * ------------------------------------------------------------
 * Configuración general del sistema
 * Firebase
 * Firestore
 * Variables globales
 **********************************************************************/

/* ===========================================================
   CONFIGURACIÓN DEL SISTEMA
=========================================================== */

export const CONFIG = {

    // Nombre del sistema
    APP_NAME: "Sistema Heurístico Evolutivo",

    // Versión
    VERSION: "1.0.0",

    // Cantidad de números sorteados por semana
    NUMEROS_POR_SEMANA: 10,

    // Número mínimo permitido
    MIN_NUMERO: 0,

    // Número máximo permitido
    MAX_NUMERO: 99,

    // Colecciones Firestore
    COLLECTIONS: {

        SEMANAS: "semanas",

        ESTADISTICAS: "estadisticas",

        RANKING: "ranking",

        CONFIGURACION: "configuracion",

        AUDITORIA: "auditoria",

        PREDICCIONES: "predicciones"

    },

    // Formato de IDs
    ID_PREFIX: "semana_",

    // Cantidad de dígitos del ID
    ID_DIGITOS: 3

};


/* ===========================================================
   FIREBASE
===========================================================

REEMPLAZAR POR LOS DATOS DE TU PROYECTO FIREBASE

https://console.firebase.google.com

Proyecto

Configuración

Tus aplicaciones

Web

=========================================================== */

export const firebaseConfig = {

    apiKey: "AIzaSyAiB5iCBj5Bq8jyTCCAKT1SuXGldIybOQo",

    authDomain: "sistema-heuristico.firebaseapp.com",

    projectId: "sistema-heuristico",

    storageBucket: "sistema-heuristico.firebasestorage.app",

    messagingSenderId: "196360741337",

    appId: "1:196360741337:web:535808b108e6c0250879c8"

};


/* ===========================================================
   CONFIGURACIÓN DE ESTADÍSTICAS
=========================================================== */

export const ESTADISTICAS = {

    // Mantener historial completo
    HISTORIAL_COMPLETO: true,

    // Recalcular estadísticas automáticamente
    RECALCULAR_AUTOMATICO: true,

    // Mostrar Top
    TOP_RANKING: 20

};


/* ===========================================================
   COLORES DEL SISTEMA
=========================================================== */

export const COLORES = {

    AZUL: "#063565",

    AZUL_CLARO: "#1F5DA8",

    ROSA: "#F12598",

    VERDE: "#28A745",

    ROJO: "#DC3545",

    AMARILLO: "#FFC107"

};


/* ===========================================================
   MENÚ PRINCIPAL
=========================================================== */

export const MENU = [

    {
        nombre: "Dashboard",
        archivo: "index.html",
        icono: "bi-speedometer2"
    },

    {
        nombre: "Semanas",
        archivo: "semanas.html",
        icono: "bi-calendar-week"
    },

    {
        nombre: "Historial",
        archivo: "historial.html",
        icono: "bi-clock-history"
    },

    {
        nombre: "Estadísticas",
        archivo: "estadisticas.html",
        icono: "bi-bar-chart"
    },

    {
        nombre: "Ranking",
        archivo: "ranking.html",
        icono: "bi-trophy"
    }

];