/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/ConfiguracionPesosService.js
 *
 * Versión:
 * 1.0.1
 *
 * Propósito:
 *
 * Administrar la configuración activa de pesos de los motores.
 *
 * Responsabilidades:
 *
 *   - Crear configuración inicial.
 *   - Obtener configuración activa.
 *   - Aplicar una nueva configuración.
 *   - Aplicar una optimización aprobada.
 *   - Registrar historial.
 *   - Recuperar versiones anteriores.
 *   - Restaurar una configuración histórica.
 *   - Evitar restauraciones redundantes.
 *   - Mantener trazabilidad completa.
 *
 *
 * CAMBIOS v1.0.1
 *
 *   1. Las restauraciones se registran como:
 *
 *          accion: "RESTAURACION"
 *          origen: "RESTAURACION"
 *
 *   2. Si la versión a restaurar posee exactamente los mismos pesos
 *      que la configuración activa:
 *
 *          - no se crea nueva versión histórica;
 *          - no se modifica Firestore;
 *          - se devuelve la configuración activa;
 *          - se informa que no hubo cambios.
 *
 **********************************************************************/


import {

    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {

    db

} from "../firebase.js";


/*====================================================================
    CONSTANTES
====================================================================*/

const COLECCION_CONFIGURACION =
    "configuracion_pesos";


const DOCUMENTO_ACTIVO =
    "activa";


const COLECCION_HISTORIAL =
    "configuracion_pesos_historial";


/*====================================================================
    PESOS INICIALES
====================================================================*/

const PESOS_INICIALES = {

    frecuencia:
        15,

    atraso:
        10,

    tendencia:
        20,

    repeticion:
        10,

    historico:
        15,

    paridad:
        5,

    rangos:
        5,

    distribucion:
        5,

    asociaciones:
        10,

    ciclos:
        15

};


/*====================================================================
    CLASE
====================================================================*/

export default class ConfiguracionPesosService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.version =
            "1.0.1";


        this.coleccion =
            COLECCION_CONFIGURACION;


        this.documentoActivo =
            DOCUMENTO_ACTIVO;


        this.coleccionHistorial =
            COLECCION_HISTORIAL;

    }


    /*================================================================
        REFERENCIA ACTIVA
    ================================================================*/

    obtenerReferenciaActiva() {

        return doc(

            db,

            this.coleccion,

            this.documentoActivo

        );

    }


    /*================================================================
        EXISTE CONFIGURACION ACTIVA
    ================================================================*/

    async existeConfiguracionActiva() {

        const snapshot =
            await getDoc(
                this.obtenerReferenciaActiva()
            );


        return snapshot.exists();

    }


    /*================================================================
        CREAR CONFIGURACION INICIAL
    ================================================================*/

    async crearConfiguracionInicial(
        pesos = null
    ) {

        try {

            const existe =
                await this
                    .existeConfiguracionActiva();


            if (
                existe
            ) {

                return await this
                    .obtenerConfiguracionActiva();

            }


            const pesosIniciales =

                pesos

                    ? this.validarPesos(
                        pesos
                    )

                    : {
                        ...PESOS_INICIALES
                    };


            const ahora =
                new Date()
                    .toISOString();


            const configuracion = {

                id:
                    this.documentoActivo,


                versionConfiguracion:
                    this.generarVersionId(),


                versionServicio:
                    this.version,


                activa:
                    true,


                pesos:
                    pesosIniciales,


                sumaPesos:

                    this.sumarPesos(
                        pesosIniciales
                    ),


                origen:
                    "CONFIGURACION_INICIAL",


                optimizacionId:
                    null,


                evolucionId:
                    null,


                creadoEn:
                    ahora,


                modificadoEn:
                    ahora,


                aplicadoEn:
                    ahora,


                descripcion:

                    "Configuración inicial de pesos del Sistema Heurístico Evolutivo."

            };


            await setDoc(

                this.obtenerReferenciaActiva(),

                configuracion

            );


            await this.guardarHistorial(

                configuracion,

                {

                    accion:
                        "CREACION_INICIAL",

                    pesosAnteriores:
                        null,

                    motivo:
                        null

                }

            );


            console.log(
                "Configuración inicial de pesos creada."
            );


            return configuracion;

        }

        catch (error) {

            console.error(
                "Error creando configuración inicial:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER CONFIGURACION ACTIVA
    ================================================================*/

    async obtenerConfiguracionActiva(
        crearSiNoExiste = true
    ) {

        try {

            const snapshot =
                await getDoc(
                    this.obtenerReferenciaActiva()
                );


            if (
                !snapshot.exists()
            ) {

                if (
                    crearSiNoExiste
                ) {

                    return await this
                        .crearConfiguracionInicial();

                }


                return null;

            }


            return {

                id:
                    snapshot.id,

                ...snapshot.data()

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo configuración activa:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER PESOS ACTIVOS
    ================================================================*/

    async obtenerPesosActivos() {

        const configuracion =
            await this
                .obtenerConfiguracionActiva();


        if (
            !configuracion
        ) {

            return {
                ...PESOS_INICIALES
            };

        }


        return {

            ...configuracion.pesos

        };

    }


    /*================================================================
        APLICAR CONFIGURACION
    ================================================================*/

    async aplicarConfiguracion(

        nuevosPesos,

        datos = {}

    ) {

        try {

            const pesosValidados =
                this.validarPesos(
                    nuevosPesos
                );


            const configuracionAnterior =
                await this
                    .obtenerConfiguracionActiva();


            const pesosAnteriores =

                configuracionAnterior
                    ?.pesos

                    ? {
                        ...configuracionAnterior.pesos
                    }

                    : null;


            const ahora =
                new Date()
                    .toISOString();


            const nuevaConfiguracion = {

                id:
                    this.documentoActivo,


                versionConfiguracion:
                    this.generarVersionId(),


                versionServicio:
                    this.version,


                activa:
                    true,


                pesos:
                    pesosValidados,


                sumaPesos:

                    this.sumarPesos(
                        pesosValidados
                    ),


                origen:

                    datos.origen ||
                    "ACTUALIZACION_MANUAL",


                optimizacionId:

                    datos.optimizacionId ??
                    null,


                evolucionId:

                    datos.evolucionId ??
                    null,


                creadoEn:

                    configuracionAnterior
                        ?.creadoEn ||

                    ahora,


                modificadoEn:
                    ahora,


                aplicadoEn:
                    ahora,


                descripcion:

                    datos.descripcion ||

                    "Actualización de configuración de pesos."

            };


            const accionHistorial =

                datos.accionHistorial ||

                "APLICACION";


            await this.guardarHistorial(

                nuevaConfiguracion,

                {

                    accion:
                        accionHistorial,

                    pesosAnteriores,

                    motivo:
                        datos.motivo ??
                        null

                }

            );


            await setDoc(

                this.obtenerReferenciaActiva(),

                nuevaConfiguracion

            );


            console.log(

                "Configuración de pesos aplicada:",

                nuevaConfiguracion
                    .versionConfiguracion

            );


            return nuevaConfiguracion;

        }

        catch (error) {

            console.error(
                "Error aplicando configuración de pesos:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        APLICAR OPTIMIZACION
    ================================================================*/

    async aplicarOptimizacion(
        optimizacion,
        datos = {}
    ) {

        if (
            !optimizacion ||
            typeof optimizacion !==
                "object"
        ) {

            throw new Error(
                "No se recibió una optimización válida."
            );

        }


        if (
            optimizacion.estado !==
            "APROBADA" &&
            optimizacion.estado !==
            "APLICADA"
        ) {

            throw new Error(
                `La optimización debe estar APROBADA antes de aplicar pesos. Estado actual: ${optimizacion.estado}`
            );

        }


        if (
            optimizacion
                .datosSuficientes !==
                true
        ) {

            throw new Error(
                "La optimización no posee evidencia suficiente."
            );

        }


        if (
            !optimizacion
                .pesosPropuestos
        ) {

            throw new Error(
                "La optimización no contiene pesos propuestos."
            );

        }


        return await this
            .aplicarConfiguracion(

                optimizacion
                    .pesosPropuestos,

                {

                    accionHistorial:
                        "APLICACION",


                    origen:
                        "OPTIMIZACION",


                    optimizacionId:

                        optimizacion.id ??
                        null,


                    evolucionId:

                        optimizacion
                            .evolucionId ??
                        null,


                    descripcion:

                        datos.descripcion ||

                        "Pesos aplicados desde una optimización aprobada.",


                    motivo:

                        datos.motivo ??
                        null

                }

            );

    }


    /*================================================================
        GUARDAR HISTORIAL
    ================================================================*/

    async guardarHistorial(
        configuracion,
        datos = {}
    ) {

        const id =

            configuracion
                .versionConfiguracion ||

            this.generarVersionId();


        const referencia =

            doc(

                db,

                this.coleccionHistorial,

                id

            );


        const historial = {

            id,


            versionConfiguracion:
                id,


            versionServicio:
                this.version,


            fecha:
                new Date()
                    .toISOString(),


            accion:

                datos.accion ||
                "ACTUALIZACION",


            origen:

                configuracion
                    .origen ??
                null,


            optimizacionId:

                configuracion
                    .optimizacionId ??
                null,


            evolucionId:

                configuracion
                    .evolucionId ??
                null,


            pesos:

                {
                    ...configuracion.pesos
                },


            sumaPesos:

                this.sumarPesos(
                    configuracion.pesos
                ),


            pesosAnteriores:

                datos.pesosAnteriores

                    ? {
                        ...datos.pesosAnteriores
                    }

                    : null,


            sumaPesosAnteriores:

                datos.pesosAnteriores

                    ? this.sumarPesos(
                        datos.pesosAnteriores
                    )

                    : null,


            motivo:

                datos.motivo ??
                null,


            descripcion:

                configuracion
                    .descripcion ??
                null

        };


        await setDoc(

            referencia,

            historial

        );


        return historial;

    }


    /*================================================================
        OBTENER HISTORIAL
    ================================================================*/

    async obtenerHistorial(
        direccion = "desc"
    ) {

        try {

            const sentido =

                direccion ===
                "asc"

                    ? "asc"

                    : "desc";


            const referencia =

                collection(

                    db,

                    this.coleccionHistorial

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "fecha",
                        sentido
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            return snapshot.docs.map(

                documento => ({

                    id:
                        documento.id,

                    ...documento.data()

                })

            );

        }

        catch (error) {

            console.error(
                "Error obteniendo historial de pesos:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ULTIMA VERSION
    ================================================================*/

    async obtenerUltimaVersion() {

        try {

            const referencia =

                collection(

                    db,

                    this.coleccionHistorial

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "fecha",
                        "desc"
                    ),

                    limit(1)

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            if (
                snapshot.empty
            ) {

                return null;

            }


            const documento =
                snapshot.docs[0];


            return {

                id:
                    documento.id,

                ...documento.data()

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo última versión:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER VERSION
    ================================================================*/

    async obtenerVersion(
        versionId
    ) {

        if (
            !versionId
        ) {

            return null;

        }


        const referencia =

            doc(

                db,

                this.coleccionHistorial,

                String(
                    versionId
                )

            );


        const snapshot =
            await getDoc(
                referencia
            );


        if (
            !snapshot.exists()
        ) {

            return null;

        }


        return {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    }


    /*================================================================
        RESTAURAR VERSION
    ================================================================*/

    async restaurarVersion(
        versionId,
        motivo = null
    ) {

        try {

            const version =
                await this
                    .obtenerVersion(
                        versionId
                    );


            if (
                !version
            ) {

                throw new Error(
                    `No existe la versión ${versionId}.`
                );

            }


            if (
                !version.pesos
            ) {

                throw new Error(
                    "La versión histórica no contiene pesos."
                );

            }


            const configuracionActual =
                await this
                    .obtenerConfiguracionActiva();


            /*
             * NUEVO v1.0.1
             *
             * Si la configuración actual ya coincide
             * exactamente con la versión solicitada,
             * no hacemos nada.
             */

            if (
                configuracionActual &&
                this.pesosIguales(

                    configuracionActual.pesos,

                    version.pesos

                )
            ) {

                console.log(

                    "La configuración activa ya coincide con la versión solicitada:",

                    versionId

                );


                return {

                    ...configuracionActual,

                    restauracionSinCambios:
                        true,

                    versionSolicitada:
                        versionId

                };

            }


            const restaurada =
                await this
                    .aplicarConfiguracion(

                        version.pesos,

                        {

                            /*
                             * NUEVO v1.0.1
                             */

                            accionHistorial:
                                "RESTAURACION",


                            origen:
                                "RESTAURACION",


                            optimizacionId:

                                version
                                    .optimizacionId ??
                                null,


                            evolucionId:

                                version
                                    .evolucionId ??
                                null,


                            descripcion:

                                `Restauración de configuración ${versionId}.`,


                            motivo

                        }

                    );


            console.log(

                "Configuración restaurada desde:",

                versionId

            );


            return {

                ...restaurada,

                restauracionSinCambios:
                    false,

                versionSolicitada:
                    versionId

            };

        }

        catch (error) {

            console.error(
                "Error restaurando configuración:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        COMPROBAR PESOS IGUALES
    ================================================================*/

    pesosIguales(
        pesosA,
        pesosB,
        tolerancia = 0.000001
    ) {

        if (
            !pesosA ||
            !pesosB ||
            typeof pesosA !==
                "object" ||
            typeof pesosB !==
                "object"
        ) {

            return false;

        }


        const a =
            this.validarPesos(
                pesosA
            );


        const b =
            this.validarPesos(
                pesosB
            );


        const motores =
            Object.keys(
                a
            );


        for (
            const motor
            of motores
        ) {

            const diferencia =

                Math.abs(

                    a[motor] -
                    b[motor]

                );


            if (
                diferencia >
                tolerancia
            ) {

                return false;

            }

        }


        return true;

    }


    /*================================================================
        VALIDAR PESOS
    ================================================================*/

    validarPesos(
        pesos
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            throw new Error(
                "La configuración de pesos no es válida."
            );

        }


        const motoresEsperados = [

            "frecuencia",
            "atraso",
            "tendencia",
            "repeticion",
            "historico",
            "paridad",
            "rangos",
            "distribucion",
            "asociaciones",
            "ciclos"

        ];


        const resultado = {};


        for (
            const motor
            of motoresEsperados
        ) {

            const valor =
                Number(
                    pesos[motor]
                );


            if (
                !Number.isFinite(
                    valor
                )
            ) {

                throw new Error(
                    `Peso inválido para el motor ${motor}.`
                );

            }


            if (
                valor < 0
            ) {

                throw new Error(
                    `El peso del motor ${motor} no puede ser negativo.`
                );

            }


            resultado[motor] =
                valor;

        }


        return resultado;

    }


    /*================================================================
        SUMAR PESOS
    ================================================================*/

    sumarPesos(
        pesos
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            return 0;

        }


        return this.redondear(

            Object.values(
                pesos
            ).reduce(

                (
                    suma,
                    valor
                ) =>

                    suma +
                    Number(
                        valor || 0
                    ),

                0

            ),

            6

        );

    }


    /*================================================================
        COMPARAR PESOS
    ================================================================*/

    compararPesos(
        pesosAnterior,
        pesosNuevo
    ) {

        const anterior =
            this.validarPesos(
                pesosAnterior
            );


        const nuevo =
            this.validarPesos(
                pesosNuevo
            );


        const diferencias = {};


        for (
            const motor
            of Object.keys(
                anterior
            )
        ) {

            diferencias[motor] = {

                anterior:
                    anterior[motor],

                nuevo:
                    nuevo[motor],

                variacion:

                    this.redondear(

                        nuevo[motor] -
                        anterior[motor],

                        6

                    )

            };

        }


        return diferencias;

    }


    /*================================================================
        GENERAR VERSION ID
    ================================================================*/

    generarVersionId() {

        const fecha =

            new Date()

                .toISOString()

                .replace(
                    /[^0-9]/g,
                    ""
                );


        const aleatorio =

            Math.random()

                .toString(
                    36
                )

                .substring(
                    2,
                    8
                );


        return (
            `pesos_${fecha}_${aleatorio}`
        );

    }


    /*================================================================
        REDONDEAR
    ================================================================*/

    redondear(
        valor,
        decimales = 4
    ) {

        const numero =
            Number(
                valor
            );


        if (
            !Number.isFinite(
                numero
            )
        ) {

            return 0;

        }


        const factor =
            Math.pow(
                10,
                decimales
            );


        return (

            Math.round(
                numero *
                factor
            ) /
            factor

        );

    }


    /*================================================================
        ESTADO DEL SERVICIO
    ================================================================*/

    obtenerEstado() {

        return {

            nombre:
                "ConfiguracionPesosService",


            version:
                this.version,


            coleccion:
                this.coleccion,


            documentoActivo:
                this.documentoActivo,


            coleccionHistorial:
                this.coleccionHistorial,


            pesosIniciales:

                {
                    ...PESOS_INICIALES
                },


            sumaPesosIniciales:

                this.sumarPesos(
                    PESOS_INICIALES
                )

        };

    }

}