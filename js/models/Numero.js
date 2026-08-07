/**********************************************************************
 * SISTEMA HEURÍSTICO EVOLUTIVO
 * Modelo de un número (00-99)
 **********************************************************************/

export default class Numero{

    constructor(numero){

        this.numero = numero;

        this.texto = numero.toString().padStart(2,"0");

        this.apariciones = 0;

        this.historial = [];

        this.ultimaSemana = null;

        this.atraso = 0;

        this.maximoAtraso = 0;

        this.minimoAtraso = null;

        this.frecuencia3 = 0;

        this.frecuencia5 = 0;

        this.frecuencia10 = 0;

        this.frecuencia20 = 0;

        this.promedioAparicion = 0;

        this.score = 0;

        this.caliente = false;

        this.frio = false;

        this.paresFrecuentes = {};

        this.triosFrecuentes = {};

        this.creado = new Date().toISOString();

        this.modificado = new Date().toISOString();

    }

    registrarAparicion(semana){

        this.apariciones++;

        this.historial.push(semana);

        this.ultimaSemana = semana;

        this.atraso = 0;

        this.modificado = new Date().toISOString();

    }

    aumentarAtraso(){

        this.atraso++;

        if(this.atraso > this.maximoAtraso){

            this.maximoAtraso = this.atraso;

        }

        this.modificado = new Date().toISOString();

    }

    toJSON(){

        return{

            numero:this.numero,

            texto:this.texto,

            apariciones:this.apariciones,

            historial:this.historial,

            ultimaSemana:this.ultimaSemana,

            atraso:this.atraso,

            maximoAtraso:this.maximoAtraso,

            minimoAtraso:this.minimoAtraso,

            frecuencia3:this.frecuencia3,

            frecuencia5:this.frecuencia5,

            frecuencia10:this.frecuencia10,

            frecuencia20:this.frecuencia20,

            promedioAparicion:this.promedioAparicion,

            score:this.score,

            caliente:this.caliente,

            frio:this.frio,

            paresFrecuentes:this.paresFrecuentes,

            triosFrecuentes:this.triosFrecuentes,

            creado:this.creado,

            modificado:this.modificado

        };

    }

}