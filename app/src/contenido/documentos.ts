import type { AgenteId } from "../flujo";

export type BloqueDocumento = { encabezado: string; lineas: readonly string[] };
export type Documento = { titulo: string; bloques: readonly BloqueDocumento[] };

/**
 * Lo que "produce" cada agente, simplificado y con el ejemplo de los gastos entre amigos.
 * Son versiones didácticas: no son las salidas reales del modelo.
 */
export const DOCUMENTOS: Record<AgenteId, Documento> = {
  refine: {
    titulo: "Brief pulido: app para dividir gastos",
    bloques: [
      { encabezado: "Qué problema resuelve", lineas: ["Los amigos que viajan juntos pierden tiempo calculando quién le debe a quién.", "Hoy lo hacen a mano y se equivocan."] },
      { encabezado: "Quién la usa", lineas: ["Un grupo de amigos que comparte los gastos de un viaje."] },
      { encabezado: "Cuándo está lista", lineas: ["Se cargan los gastos de cada persona.", "La app muestra cuánto debe cada uno y a quién."] },
      { encabezado: "Qué queda afuera", lineas: ["Pagar con dinero de verdad.", "Cuentas con usuario y contraseña."] },
    ],
  },
  generate: {
    titulo: "Los cuatro documentos del plan",
    bloques: [
      { encabezado: "Reglas del proyecto", lineas: ["Los montos se guardan en centavos para no perder plata por redondeos.", "Nada se borra sin preguntar."] },
      { encabezado: "Historias de usuario", lineas: ["Como amigo, quiero cargar un gasto para que todos lo vean.", "Como amigo, quiero ver cuánto debo para saldar la cuenta."] },
      { encabezado: "Plan de construcción", lineas: ["Una página web simple, sin cuentas.", "Los datos quedan guardados en el navegador."] },
      { encabezado: "Lista de tareas", lineas: ["1. Pantalla para cargar gastos.", "2. Cálculo de quién le debe a quién.", "3. Pantalla con el resumen final."] },
    ],
  },
  validate: {
    titulo: "Reporte de huecos",
    bloques: [
      { encabezado: "Lo que está cubierto", lineas: ["Cargar gastos: tiene historia y tarea.", "Ver quién debe: tiene historia y tarea."] },
      { encabezado: "Lo que falta", lineas: ["No se dijo qué pasa si un amigo se va del grupo.", "No hay una tarea para corregir un gasto mal cargado."] },
      { encabezado: "Qué hacer", lineas: ["Decidir esos dos puntos antes de construir.", "Anotar la decisión: es el próximo paso."] },
    ],
  },
  log: {
    titulo: "Registro de la decisión",
    bloques: [
      { encabezado: "Qué cambió", lineas: ["Se agrega poder corregir un gasto mal cargado."] },
      { encabezado: "Qué otras opciones había", lineas: ["Dejarlo para más adelante.", "Borrar el gasto y volver a cargarlo."] },
      { encabezado: "Por qué se eligió esta", lineas: ["Equivocarse al cargar un gasto es lo más común, y borrar todo es molesto."] },
      { encabezado: "Quién decidió", lineas: ["El equipo del proyecto, el día de hoy."] },
    ],
  },
  implement: {
    titulo: "Código y pruebas",
    bloques: [
      { encabezado: "Pruebas escritas primero", lineas: ["Dividir 90 entre 3 amigos da 30 a cada uno ✔", "Si uno pagó de más, se le devuelve la diferencia ✔", "Un gasto de cero no cambia las cuentas ✔"] },
      { encabezado: "Lo que se construyó", lineas: ["La pantalla para cargar gastos.", "El cálculo de quién le paga a quién.", "La pantalla con el resumen final."] },
      { encabezado: "Resultado", lineas: ["Todas las pruebas pasan: 12 de 12."] },
    ],
  },
  e2e: {
    titulo: "Evidencia de la prueba de punta a punta",
    bloques: [
      { encabezado: "El recorrido", lineas: ["Se abrió la app.", "Se cargaron tres gastos de tres amigos distintos.", "Se miró el resumen final."] },
      { encabezado: "Lo que se comprobó", lineas: ["El resumen dice quién le paga a quién ✔", "Los números coinciden con la cuenta hecha a mano ✔"] },
      { encabezado: "La evidencia", lineas: ["Tres capturas de pantalla guardadas.", "Un registro del recorrido, paso por paso."] },
    ],
  },
  checklist: {
    titulo: "Lista de verificación para una persona",
    bloques: [
      { encabezado: "Para mirar con tus propios ojos", lineas: ["☐ ¿Se entiende para qué sirve cada botón?", "☐ ¿Se lee bien en el celular de un amigo?", "☐ ¿El resumen final es fácil de seguir?"] },
      { encabezado: "Cómo se completa", lineas: ["Una persona real prueba la app y tilda lo que está bien.", "Lo que no está bien vuelve a construcción."] },
    ],
  },
  review: {
    titulo: "Verificación final",
    bloques: [
      { encabezado: "Lo que se pidió", lineas: ["Una app para dividir gastos entre amigos."] },
      { encabezado: "Lo que se entregó", lineas: ["Cargar gastos, ver quién debe y corregir errores."] },
      { encabezado: "Las pruebas", lineas: ["12 de 12 pruebas pasan.", "La prueba de punta a punta quedó guardada."] },
      { encabezado: "Veredicto", lineas: ["✔ Todo cumple lo pedido. Listo para usar."] },
    ],
  },
};
