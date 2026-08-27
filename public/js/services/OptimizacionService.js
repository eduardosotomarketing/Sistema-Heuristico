/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 *
 * Archivo:
 * js/services/OptimizacionService.js
 *
 * Versión:
 * 1.0.0
 *
 * Propósito:
 *
 * Persistir las propuestas generadas por MotorOptimizacion.
 *
 * Responsabilidades:
 *
 *   - Guardar optimizaciones.
 *   - Recuperar optimizaciones.
 *   - Listar historial.
 *   - Obtener última optimización.
 *   - Buscar por evolución.
 *   - Cambiar estado de una propuesta.
 *   - Registrar aprobación.
 *   - Registrar rechazo.
 *   - Registrar aplicación.
 *   - Mantener trazabilidad de pesos.
 *
 *
 * IMPORTANTE:
 *
 * Este servicio NO modifica los pesos de MotorManager.
 *
 * Tampoco modifica config.js automáticamente.
 *
 * Su función es únicamente persistir y auditar propuestas.
 *
 *
 * ESTADOS SOPORTADOS:
 *
 *   PROPUESTA_NO_APLICABLE
 *   PROPUESTA_APLICABLE
 *   APROBADA
 *   RECHAZADA
 *   APLICADA
 *
 *
 * ESTRUCTURA FIRESTORE:
 *
 * optimizaciones/{optimizacionId}
 *
 *   Documento principal:
 *
 *   - id
 *   - nombre
 *   - version
 *   - generadoEn
 *   - evolucionId
 *   - cantidadEvaluaciones
 *   - minimoEvaluaciones
 *   - datosSuficientes
 *   - estado
 *   - normalizacionAplicada
 *   - pesosActuales
 *   - pesosPropuestos
 *   - sumas
 *   - motoresAumentados
 *   - motoresReducidos
 *   - motoresSinCambio
 *   - resumen
 *   - advertencias
 *   - auditoria
 *
 *
 * optimizaciones/{optimizacionId}/motores/{motor}
 *
 *   - motor
 *   - pesoActual
 *   - indiceReciente
 *   - variacionIndice
 *   - tendencia
 *   - estado
 *   - ajusteBruto
 *   - ajusteLimitado
 *   - ajusteAplicado
 *   - pesoSimulado
 *   - pesoOperativo
 *   - pesoFinal
 *   - variacionFinal
 *
 **********************************************************************/


import {

    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    writeBatch

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {

    db

} from "../firebase.js";


/*====================================================================
    CONSTANTES
====================================================================*/

const COLECCION =
    "optimizaciones";


const SUBCOLECCION_MOTORES =
    "motores";


const ESTADOS_VALIDOS = [

    "PROPUESTA_NO_APLICABLE",

    "PROPUESTA_APLICABLE",

    "APROBADA",

    "RECHAZADA",

    "APLICADA"

];


/*====================================================================
    CLASE
====================================================================*/

export default class OptimizacionService {


    /*================================================================
        CONSTRUCTOR
    ================================================================*/

    constructor() {

        this.coleccion =
            COLECCION;


        this.subcoleccionMotores =
            SUBCOLECCION_MOTORES;


        this.version =
            "1.0.0";

    }


    /*================================================================
        GUARDAR
    ================================================================*/

    async guardar(
        optimizacion
    ) {

        try {

            this.validarOptimizacion(
                optimizacion
            );


            const optimizacionPlana =
                this.convertirObjetoPlano(
                    optimizacion
                );


            const id =

                optimizacionPlana.id ||

                this.generarId();


            optimizacionPlana.id =
                id;


            const detalles =

                optimizacionPlana.detalles &&
                typeof optimizacionPlana.detalles ===
                    "object"

                    ? optimizacionPlana.detalles

                    : {};


            const principal =

                this.prepararDocumentoPrincipal(

                    optimizacionPlana

                );


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    id

                );


            await setDoc(

                referencia,

                principal

            );


            const cantidadMotores =

                await this.guardarMotores(

                    id,

                    detalles

                );


            console.log(

                "Optimización guardada:",

                id,

                `(${cantidadMotores} motores)`

            );


            return {

                ...principal,

                detalles:

                    this.compactarMotoresObjeto(
                        detalles
                    )

            };

        }

        catch (error) {

            console.error(
                "Error guardando optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        VALIDAR OPTIMIZACION
    ================================================================*/

    validarOptimizacion(
        optimizacion
    ) {

        if (
            !optimizacion ||
            typeof optimizacion !==
                "object"
        ) {

            throw new Error(
                "La optimización recibida no es válida."
            );

        }


        if (
            !optimizacion.pesosActuales ||
            typeof optimizacion.pesosActuales !==
                "object"
        ) {

            throw new Error(
                "La optimización no contiene pesos actuales."
            );

        }


        if (
            !optimizacion.pesosPropuestos ||
            typeof optimizacion.pesosPropuestos !==
                "object"
        ) {

            throw new Error(
                "La optimización no contiene pesos propuestos."
            );

        }


        if (
            optimizacion.estado &&
            !ESTADOS_VALIDOS.includes(
                optimizacion.estado
            )
        ) {

            throw new Error(
                `Estado de optimización inválido: ${optimizacion.estado}`
            );

        }


        return true;

    }


    /*================================================================
        PREPARAR DOCUMENTO PRINCIPAL
    ================================================================*/

    prepararDocumentoPrincipal(
        optimizacion
    ) {

        const ahora =
            new Date()
                .toISOString();


        const estado =

            ESTADOS_VALIDOS.includes(
                optimizacion.estado
            )

                ? optimizacion.estado

                : "PROPUESTA_NO_APLICABLE";


        return {

            id:
                optimizacion.id,


            nombre:

                optimizacion.nombre ||

                "MotorOptimizacion",


            version:

                optimizacion.version ||

                null,


            versionServicio:
                this.version,


            generadoEn:

                optimizacion.generadoEn ||

                ahora,


            evolucionId:

                optimizacion.evolucionId ??
                null,


            cantidadEvaluaciones:

                this.numeroSeguro(

                    optimizacion
                        .cantidadEvaluaciones

                ),


            minimoEvaluaciones:

                this.numeroSeguro(

                    optimizacion
                        .minimoEvaluaciones

                ),


            datosSuficientes:

                optimizacion
                    .datosSuficientes ===
                    true,


            estado,


            normalizacionAplicada:

                optimizacion
                    .normalizacionAplicada ===
                    true,


            sumaObjetivoPesos:

                this.numeroSeguro(

                    optimizacion
                        .sumaObjetivoPesos,

                    100

                ),


            pesosActuales:

                this.normalizarObjetoPesos(

                    optimizacion
                        .pesosActuales

                ),


            pesosPropuestosBrutos:

                this.normalizarObjetoPesos(

                    optimizacion
                        .pesosPropuestosBrutos

                ),


            pesosPropuestosLimitados:

                this.normalizarObjetoPesos(

                    optimizacion
                        .pesosPropuestosLimitados

                ),


            pesosPropuestos:

                this.normalizarObjetoPesos(

                    optimizacion
                        .pesosPropuestos

                ),


            sumaPesosActuales:

                this.numeroSeguro(

                    optimizacion
                        .sumaPesosActuales

                ),


            sumaPesosPropuestosBrutos:

                this.numeroSeguro(

                    optimizacion
                        .sumaPesosPropuestosBrutos

                ),


            sumaPesosPropuestosLimitados:

                this.numeroSeguro(

                    optimizacion
                        .sumaPesosPropuestosLimitados

                ),


            sumaPesosPropuestos:

                this.numeroSeguro(

                    optimizacion
                        .sumaPesosPropuestos

                ),


            motoresAumentados:

                Array.isArray(
                    optimizacion.motoresAumentados
                )

                    ? [
                        ...optimizacion
                            .motoresAumentados
                    ]

                    : [],


            motoresReducidos:

                Array.isArray(
                    optimizacion.motoresReducidos
                )

                    ? [
                        ...optimizacion
                            .motoresReducidos
                    ]

                    : [],


            motoresSinCambio:

                Array.isArray(
                    optimizacion.motoresSinCambio
                )

                    ? [
                        ...optimizacion
                            .motoresSinCambio
                    ]

                    : [],


            rankingSimulacion:

                this.compactarRankingSimulacion(

                    optimizacion
                        .rankingSimulacion

                ),


            resumen:

                this.convertirObjetoPlano(

                    optimizacion
                        .resumen ||
                    {}

                ),


            advertencias:

                this.compactarLista(

                    optimizacion
                        .advertencias

                ),


            cantidadMotores:

                optimizacion.detalles &&
                typeof optimizacion.detalles ===
                    "object"

                    ? Object.keys(
                        optimizacion.detalles
                    ).length

                    : 0,


            motoresSeparados:
                true,


            subcoleccionMotores:

                this.subcoleccionMotores,


            auditoria: {

                creadoEn:

                    optimizacion.auditoria
                        ?.creadoEn ||

                    ahora,


                modificadoEn:

                    ahora,


                aprobadoEn:

                    optimizacion.auditoria
                        ?.aprobadoEn ??
                    null,


                rechazadoEn:

                    optimizacion.auditoria
                        ?.rechazadoEn ??
                    null,


                aplicadoEn:

                    optimizacion.auditoria
                        ?.aplicadoEn ??
                    null,


                motivo:

                    optimizacion.auditoria
                        ?.motivo ??
                    null

            }

        };

    }


    /*================================================================
        GUARDAR MOTORES
    ================================================================*/

    async guardarMotores(
        optimizacionId,
        detalles
    ) {

        if (
            !detalles ||
            typeof detalles !==
                "object"
        ) {

            return 0;

        }


        const claves =
            Object.keys(
                detalles
            );


        if (
            claves.length === 0
        ) {

            return 0;

        }


        const batch =
            writeBatch(
                db
            );


        let cantidad =
            0;


        for (
            const clave
            of claves
        ) {

            const detalle =
                detalles[clave];


            if (
                !detalle
            ) {

                continue;

            }


            const documento =

                this.compactarDetalleMotor(

                    detalle

                );


            documento.motor =

                documento.motor ||

                clave;


            documento.optimizacionId =
                optimizacionId;


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    optimizacionId,

                    this.subcoleccionMotores,

                    String(clave)

                );


            batch.set(

                referencia,

                documento

            );


            cantidad++;

        }


        await batch.commit();


        return cantidad;

    }


    /*================================================================
        COMPACTAR DETALLE MOTOR
    ================================================================*/

    compactarDetalleMotor(
        detalle
    ) {

        if (
            !detalle ||
            typeof detalle !==
                "object"
        ) {

            return {};

        }


        return {

            motor:

                detalle.motor ??
                null,


            pesoActual:

                this.numeroSeguro(
                    detalle.pesoActual
                ),


            indiceDiscriminacion:

                this.numeroSeguro(
                    detalle.indiceDiscriminacion
                ),


            indiceReciente:

                this.numeroSeguro(
                    detalle.indiceReciente
                ),


            variacionIndice:

                this.numeroSeguro(
                    detalle.variacionIndice
                ),


            tendencia:

                detalle.tendencia ??
                null,


            estado:

                detalle.estado ??
                null,


            consistencia:

                this.numeroSeguro(
                    detalle.consistencia
                ),


            consistente:

                detalle.consistente ===
                true,


            ajusteIndice:

                this.numeroSeguro(
                    detalle.ajusteIndice
                ),


            ajusteVariacion:

                this.numeroSeguro(
                    detalle.ajusteVariacion
                ),


            ajusteTendencia:

                this.numeroSeguro(
                    detalle.ajusteTendencia
                ),


            ajusteConsistencia:

                this.numeroSeguro(
                    detalle.ajusteConsistencia
                ),


            ajustePenalizacion:

                this.numeroSeguro(
                    detalle.ajustePenalizacion
                ),


            ajusteTotalBruto:

                this.numeroSeguro(
                    detalle.ajusteTotalBruto
                ),


            ajusteLimitado:

                this.numeroSeguro(
                    detalle.ajusteLimitado
                ),


            ajusteAplicado:

                this.numeroSeguro(
                    detalle.ajusteAplicado
                ),


            pesoPropuestoBruto:

                this.numeroSeguro(
                    detalle.pesoPropuestoBruto
                ),


            pesoPropuestoLimitado:

                this.numeroSeguro(
                    detalle.pesoPropuestoLimitado
                ),


            pesoNormalizado:

                this.numeroSeguro(
                    detalle.pesoNormalizado
                ),


            variacionFinal:

                this.numeroSeguro(
                    detalle.variacionFinal
                ),


            simulacionVariacion:

                this.numeroSeguro(
                    detalle.simulacionVariacion
                ),


            motivo:

                detalle.motivo ??
                null

        };

    }


    /*================================================================
        COMPACTAR MOTORES OBJETO
    ================================================================*/

    compactarMotoresObjeto(
        detalles
    ) {

        const resultado = {};


        if (
            !detalles ||
            typeof detalles !==
                "object"
        ) {

            return resultado;

        }


        for (
            const clave
            of Object.keys(
                detalles
            )
        ) {

            resultado[clave] =

                this.compactarDetalleMotor(

                    detalles[clave]

                );

        }


        return resultado;

    }


    /*================================================================
        COMPACTAR RANKING SIMULACION
    ================================================================*/

    compactarRankingSimulacion(
        ranking
    ) {

        if (
            !Array.isArray(
                ranking
            )
        ) {

            return [];

        }


        return ranking.map(

            item => ({

                motor:

                    item.motor ??
                    null,


                pesoActual:

                    this.numeroSeguro(
                        item.pesoActual
                    ),


                ajusteBruto:

                    this.numeroSeguro(
                        item.ajusteBruto
                    ),


                ajusteLimitado:

                    this.numeroSeguro(
                        item.ajusteLimitado
                    ),


                pesoSimulado:

                    this.numeroSeguro(
                        item.pesoSimulado
                    ),


                indiceReciente:

                    this.numeroSeguro(
                        item.indiceReciente
                    ),


                variacionIndice:

                    this.numeroSeguro(
                        item.variacionIndice
                    ),


                tendencia:

                    item.tendencia ??
                    null,


                estado:

                    item.estado ??
                    null

            })

        );

    }


    /*================================================================
        OBTENER POR ID
    ================================================================*/

    async obtener(
        id,
        opciones = {}
    ) {

        try {

            if (!id) {

                return null;

            }


            const incluirMotores =

                opciones.incluirMotores !==
                false;


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

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


            const principal = {

                id:
                    snapshot.id,

                ...snapshot.data()

            };


            if (
                !incluirMotores
            ) {

                return principal;

            }


            const detalles =

                await this.obtenerMotores(
                    id
                );


            return {

                ...principal,

                detalles

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER MOTORES
    ================================================================*/

    async obtenerMotores(
        optimizacionId
    ) {

        try {

            if (
                !optimizacionId
            ) {

                return {};

            }


            const referencia =

                collection(

                    db,

                    this.coleccion,

                    String(
                        optimizacionId
                    ),

                    this.subcoleccionMotores

                );


            const snapshot =
                await getDocs(
                    referencia
                );


            const detalles = {};


            for (
                const documento
                of snapshot.docs
            ) {

                const datos =
                    documento.data();


                const clave =

                    datos.motor ||

                    documento.id;


                detalles[clave] = {

                    ...datos

                };

            }


            return detalles;

        }

        catch (error) {

            console.error(
                "Error obteniendo motores de optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER TODAS
    ================================================================*/

    async obtenerTodas(
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

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "generadoEn",
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
                "Error obteniendo optimizaciones:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER ULTIMA
    ================================================================*/

    async obtenerUltima(
        completa = true
    ) {

        try {

            const referencia =

                collection(

                    db,

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    orderBy(
                        "generadoEn",
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


            if (
                completa
            ) {

                return await this.obtener(
                    documento.id
                );

            }


            return {

                id:
                    documento.id,

                ...documento.data()

            };

        }

        catch (error) {

            console.error(
                "Error obteniendo última optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER POR EVOLUCION
    ================================================================*/

    async obtenerPorEvolucion(
        evolucionId
    ) {

        try {

            if (
                !evolucionId
            ) {

                return [];

            }


            const referencia =

                collection(

                    db,

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    where(
                        "evolucionId",
                        "==",
                        String(
                            evolucionId
                        )
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            return snapshot.docs
                .map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                )
                .sort(

                    (a, b) =>

                        String(
                            b.generadoEn ||
                            ""
                        ).localeCompare(

                            String(
                                a.generadoEn ||
                                ""
                            )

                        )

                );

        }

        catch (error) {

            console.error(
                "Error obteniendo optimizaciones por evolución:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        OBTENER POR ESTADO
    ================================================================*/

    async obtenerPorEstado(
        estado
    ) {

        try {

            if (
                !ESTADOS_VALIDOS.includes(
                    estado
                )
            ) {

                throw new Error(
                    `Estado inválido: ${estado}`
                );

            }


            const referencia =

                collection(

                    db,

                    this.coleccion

                );


            const consulta =

                query(

                    referencia,

                    where(
                        "estado",
                        "==",
                        estado
                    )

                );


            const snapshot =
                await getDocs(
                    consulta
                );


            return snapshot.docs
                .map(

                    documento => ({

                        id:
                            documento.id,

                        ...documento.data()

                    })

                )
                .sort(

                    (a, b) =>

                        String(
                            b.generadoEn ||
                            ""
                        ).localeCompare(

                            String(
                                a.generadoEn ||
                                ""
                            )

                        )

                );

        }

        catch (error) {

            console.error(
                "Error obteniendo optimizaciones por estado:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        EXISTE
    ================================================================*/

    async existe(
        id
    ) {

        try {

            if (!id) {

                return false;

            }


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            const snapshot =
                await getDoc(
                    referencia
                );


            return snapshot.exists();

        }

        catch (error) {

            console.error(
                "Error comprobando optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        CAMBIAR ESTADO
    ================================================================*/

    async cambiarEstado(
        id,
        nuevoEstado,
        datos = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "No se recibió ID de optimización."
                );

            }


            if (
                !ESTADOS_VALIDOS.includes(
                    nuevoEstado
                )
            ) {

                throw new Error(
                    `Estado inválido: ${nuevoEstado}`
                );

            }


            const actual =
                await this.obtener(
                    id,
                    {
                        incluirMotores: false
                    }
                );


            if (
                !actual
            ) {

                throw new Error(
                    `No existe la optimización ${id}.`
                );

            }


            this.validarTransicionEstado(

                actual.estado,

                nuevoEstado

            );


            const ahora =
                new Date()
                    .toISOString();


            const auditoria = {

                ...(
                    actual.auditoria ||
                    {}
                ),

                modificadoEn:
                    ahora

            };


            if (
                datos.motivo !==
                undefined
            ) {

                auditoria.motivo =
                    datos.motivo;

            }


            if (
                nuevoEstado ===
                "APROBADA"
            ) {

                auditoria.aprobadoEn =
                    ahora;

            }


            if (
                nuevoEstado ===
                "RECHAZADA"
            ) {

                auditoria.rechazadoEn =
                    ahora;

            }


            if (
                nuevoEstado ===
                "APLICADA"
            ) {

                auditoria.aplicadoEn =
                    ahora;

            }


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            await updateDoc(

                referencia,

                {

                    estado:
                        nuevoEstado,

                    auditoria

                }

            );


            return await this.obtener(
                id
            );

        }

        catch (error) {

            console.error(
                "Error cambiando estado de optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        VALIDAR TRANSICION
    ================================================================*/

    validarTransicionEstado(
        estadoActual,
        nuevoEstado
    ) {

        /*
         * Permite repetir el mismo estado.
         */

        if (
            estadoActual ===
            nuevoEstado
        ) {

            return true;

        }


        const transiciones = {

            PROPUESTA_NO_APLICABLE: [

                "RECHAZADA"

            ],


            PROPUESTA_APLICABLE: [

                "APROBADA",

                "RECHAZADA"

            ],


            APROBADA: [

                "APLICADA",

                "RECHAZADA"

            ],


            RECHAZADA: [],


            APLICADA: []

        };


        const permitidas =

            transiciones[
                estadoActual
            ] ||
            [];


        if (
            !permitidas.includes(
                nuevoEstado
            )
        ) {

            throw new Error(

                `Transición de estado no permitida: ${estadoActual} → ${nuevoEstado}`

            );

        }


        return true;

    }


    /*================================================================
        APROBAR
    ================================================================*/

    async aprobar(
        id,
        motivo = null
    ) {

        const optimizacion =

            await this.obtener(

                id,

                {
                    incluirMotores: false
                }

            );


        if (
            !optimizacion
        ) {

            throw new Error(
                `No existe la optimización ${id}.`
            );

        }


        if (
            optimizacion
                .datosSuficientes !==
                true
        ) {

            throw new Error(
                "La optimización no puede aprobarse porque no posee evidencia suficiente."
            );

        }


        if (
            optimizacion.estado !==
            "PROPUESTA_APLICABLE"
        ) {

            throw new Error(
                `La optimización no puede aprobarse desde el estado ${optimizacion.estado}.`
            );

        }


        return await this.cambiarEstado(

            id,

            "APROBADA",

            {
                motivo
            }

        );

    }


    /*================================================================
        RECHAZAR
    ================================================================*/

    async rechazar(
        id,
        motivo = null
    ) {

        return await this.cambiarEstado(

            id,

            "RECHAZADA",

            {
                motivo
            }

        );

    }


    /*================================================================
        MARCAR APLICADA
    ================================================================*/

    async marcarAplicada(
        id,
        motivo = null
    ) {

        const optimizacion =

            await this.obtener(

                id,

                {
                    incluirMotores: false
                }

            );


        if (
            !optimizacion
        ) {

            throw new Error(
                `No existe la optimización ${id}.`
            );

        }


        if (
            optimizacion.estado !==
            "APROBADA"
        ) {

            throw new Error(
                "La optimización debe estar APROBADA antes de marcarse como APLICADA."
            );

        }


        return await this.cambiarEstado(

            id,

            "APLICADA",

            {
                motivo
            }

        );

    }


    /*================================================================
        ACTUALIZAR METADATOS
    ================================================================*/

    async actualizar(
        id,
        cambios = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "No se recibió ID de optimización."
                );

            }


            const datos =

                this.convertirObjetoPlano(
                    cambios
                );


            /*
             * No permitimos modificar mediante este método
             * los pesos ni detalles de motores.
             */

            delete datos.id;

            delete datos.estado;

            delete datos.pesosActuales;

            delete datos.pesosPropuestos;

            delete datos.pesosPropuestosBrutos;

            delete datos.pesosPropuestosLimitados;

            delete datos.detalles;


            datos["auditoria.modificadoEn"] =

                new Date()
                    .toISOString();


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            await updateDoc(

                referencia,

                datos

            );


            return await this.obtener(
                id
            );

        }

        catch (error) {

            console.error(
                "Error actualizando optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        ELIMINAR MOTORES
    ================================================================*/

    async eliminarMotores(
        optimizacionId
    ) {

        const referencia =

            collection(

                db,

                this.coleccion,

                String(
                    optimizacionId
                ),

                this.subcoleccionMotores

            );


        const snapshot =
            await getDocs(
                referencia
            );


        if (
            snapshot.empty
        ) {

            return 0;

        }


        const batch =
            writeBatch(
                db
            );


        let cantidad =
            0;


        for (
            const documento
            of snapshot.docs
        ) {

            batch.delete(
                documento.ref
            );


            cantidad++;

        }


        await batch.commit();


        return cantidad;

    }


    /*================================================================
        ELIMINAR
    ================================================================*/

    async eliminar(
        id
    ) {

        try {

            if (!id) {

                return false;

            }


            const actual =
                await this.obtener(
                    id,
                    {
                        incluirMotores: false
                    }
                );


            if (
                !actual
            ) {

                return false;

            }


            /*
             * Por seguridad no eliminamos optimizaciones
             * ya aplicadas.
             */

            if (
                actual.estado ===
                "APLICADA"
            ) {

                throw new Error(
                    "No se puede eliminar una optimización ya aplicada."
                );

            }


            await this.eliminarMotores(
                id
            );


            const referencia =

                doc(

                    db,

                    this.coleccion,

                    String(id)

                );


            await deleteDoc(
                referencia
            );


            return true;

        }

        catch (error) {

            console.error(
                "Error eliminando optimización:",
                error
            );


            throw error;

        }

    }


    /*================================================================
        CONTAR
    ================================================================*/

    async contar() {

        const lista =
            await this.obtenerTodas();


        return lista.length;

    }


    /*================================================================
        NORMALIZAR PESOS
    ================================================================*/

    normalizarObjetoPesos(
        pesos
    ) {

        if (
            !pesos ||
            typeof pesos !==
                "object"
        ) {

            return {};

        }


        const resultado = {};


        for (
            const [
                clave,
                valor
            ]
            of Object.entries(
                pesos
            )
        ) {

            const numero =
                Number(
                    valor
                );


            if (
                Number.isFinite(
                    numero
                )
            ) {

                resultado[clave] =
                    numero;

            }

        }


        return resultado;

    }


    /*================================================================
        COMPACTAR LISTA
    ================================================================*/

    compactarLista(
        lista
    ) {

        if (
            !Array.isArray(
                lista
            )
        ) {

            return [];

        }


        return lista.map(

            item =>

                this.convertirObjetoPlano(
                    item
                )

        );

    }


    /*================================================================
        CONVERTIR OBJETO PLANO
    ================================================================*/

    convertirObjetoPlano(
        valor,
        visitados = new WeakSet()
    ) {

        if (
            valor === null
        ) {

            return null;

        }


        if (
            valor === undefined
        ) {

            return null;

        }


        if (

            typeof valor ===
                "string" ||

            typeof valor ===
                "number" ||

            typeof valor ===
                "boolean"

        ) {

            return valor;

        }


        if (
            valor instanceof Date
        ) {

            return valor
                .toISOString();

        }


        if (
            Array.isArray(
                valor
            )
        ) {

            return valor.map(

                item =>

                    this.convertirObjetoPlano(

                        item,

                        visitados

                    )

            );

        }


        if (
            valor instanceof Map
        ) {

            const objeto = {};


            for (
                const [
                    clave,
                    contenido
                ]
                of valor.entries()
            ) {

                objeto[
                    String(clave)
                ] =

                    this.convertirObjetoPlano(

                        contenido,

                        visitados

                    );

            }


            return objeto;

        }


        if (
            valor instanceof Set
        ) {

            return [

                ...valor

            ].map(

                item =>

                    this.convertirObjetoPlano(

                        item,

                        visitados

                    )

            );

        }


        if (
            typeof valor ===
                "object"
        ) {

            if (
                visitados.has(
                    valor
                )
            ) {

                return null;

            }


            visitados.add(
                valor
            );


            const objeto = {};


            for (
                const [
                    clave,
                    contenido
                ]
                of Object.entries(
                    valor
                )
            ) {

                if (
                    typeof contenido ===
                        "function" ||

                    contenido ===
                        undefined
                ) {

                    continue;

                }


                objeto[clave] =

                    this.convertirObjetoPlano(

                        contenido,

                        visitados

                    );

            }


            visitados.delete(
                valor
            );


            return objeto;

        }


        return null;

    }


    /*================================================================
        NÚMERO SEGURO
    ================================================================*/

    numeroSeguro(
        valor,
        defecto = 0
    ) {

        const numero =
            Number(
                valor
            );


        return Number.isFinite(
            numero
        )

            ? numero

            : defecto;

    }


    /*================================================================
        GENERAR ID
    ================================================================*/

    generarId() {

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
            `optimizacion_${fecha}_${aleatorio}`
        );

    }


    /*================================================================
        OBTENER ESTADO DEL SERVICIO
    ================================================================*/

    obtenerEstado() {

        return {

            nombre:
                "OptimizacionService",

            version:
                this.version,

            coleccion:
                this.coleccion,

            subcoleccionMotores:
                this.subcoleccionMotores,

            estadosValidos:

                [
                    ...ESTADOS_VALIDOS
                ]

        };

    }

}