import type { AgenteId } from "../flujo";

export type BloqueDocumento = { encabezado: string; lineas: readonly string[] };
export type Documento = { titulo: string; bloques: readonly BloqueDocumento[] };

/**
 * Lo que "produce" cada agente, con el ejemplo de los gastos de un viaje entre amigos.
 * Son versiones didácticas: no son las salidas reales del modelo, pero cada una tiene un número,
 * una decisión y una forma de comprobarlo.
 */
export const DOCUMENTOS: Record<AgenteId, Documento> = {
  refine: {
    titulo: "Brief: dividir los gastos de un viaje",
    bloques: [
      { encabezado: "El problema", lineas: ["Cuatro amigos vuelven de tres días en la costa y nadie sabe quién le debe a quién.", "Hoy lo resuelven en una hoja suelta y la cuenta nunca cierra."] },
      { encabezado: "Quién la usa", lineas: ["El grupo de amigos que comparte los gastos de un viaje."] },
      { encabezado: "Cómo se usa", lineas: ["Cada uno carga lo que pagó, con el monto y para quiénes fue.", "Al final la app dice quién le paga a quién, con la menor cantidad de pagos."] },
      { encabezado: "Qué queda afuera", lineas: ["Mover plata de verdad.", "Cuentas con usuario y contraseña."] },
      { encabezado: "Cómo sabemos que está lista", lineas: ["Se cargan los gastos del viaje y el resumen cierra al centavo."] },
    ],
  },
  generate: {
    titulo: "Los cuatro documentos del plan",
    bloques: [
      { encabezado: "Reglas del proyecto", lineas: ["Los montos se guardan en centavos: nada de decimales sueltos.", "Ningún gasto se borra sin confirmar.", "El resumen siempre tiene que cerrar al centavo."] },
      { encabezado: "Historias de usuario", lineas: ["Como amigo, quiero cargar un gasto para que el grupo lo vea.", "Como amigo, quiero ver cuánto debo y a quién.", "Como amigo, quiero corregir un gasto que cargué mal."] },
      { encabezado: "Plan de construcción", lineas: ["Una página web sin cuentas, cómoda en el celular.", "Los datos quedan guardados en el navegador de cada uno."] },
      { encabezado: "Lista de tareas", lineas: ["1. Cargar un gasto.", "2. Calcular quién le paga a quién.", "3. Mostrar el resumen final."] },
    ],
  },
  validate: {
    titulo: "Reporte de huecos",
    bloques: [
      { encabezado: "Lo que está cubierto", lineas: ["Cargar un gasto: tiene historia y tarea.", "Ver cuánto debe cada uno: tiene historia y tarea."] },
      { encabezado: "Lo que falta", lineas: ["Nadie dijo qué pasa si un amigo se va del viaje.", "No hay tarea para corregir un gasto mal cargado.", "Falta decir con cuántos decimales se muestra la plata."] },
      { encabezado: "Qué hacer", lineas: ["Decidir esos tres puntos antes de construir.", "Anotar cada decisión en el registro."] },
    ],
  },
  log: {
    titulo: "Registro de la decisión",
    bloques: [
      { encabezado: "Qué se decidió", lineas: ["Se puede corregir un gasto mal cargado, sin borrarlo."] },
      { encabezado: "Las otras opciones", lineas: ["Dejarlo para más adelante.", "Borrar el gasto y volver a cargarlo."] },
      { encabezado: "Por qué esta", lineas: ["Equivocarse al cargar es lo más común, y borrar todo enoja al grupo."] },
      { encabezado: "Quién decidió", lineas: ["El equipo del proyecto, en la reunión de hoy."] },
    ],
  },
  implement: {
    titulo: "Código y pruebas",
    bloques: [
      { encabezado: "Pruebas escritas primero", lineas: ["Dividir 90 entre 3 da 30 a cada uno ✔", "Si uno pagó de más, se le devuelve la diferencia ✔", "Un gasto de cero no cambia las cuentas ✔"] },
      { encabezado: "Lo que se construyó", lineas: ["La pantalla para cargar un gasto.", "El cálculo que reduce los pagos al mínimo.", "El resumen final con un solo número por persona."] },
      { encabezado: "Resultado", lineas: ["Las doce pruebas pasan: 12 de 12."] },
    ],
  },
  e2e: {
    titulo: "Evidencia del recorrido completo",
    bloques: [
      { encabezado: "El recorrido", lineas: ["Se abrió la app en el celular.", "Se cargaron tres gastos de tres amigos.", "Se abrió el resumen final."] },
      { encabezado: "Lo que se comprobó", lineas: ["El resumen dice quién le paga a quién ✔", "Los números coinciden con la cuenta hecha a mano ✔"] },
      { encabezado: "La evidencia", lineas: ["Tres capturas guardadas.", "Un registro del recorrido, paso por paso."] },
    ],
  },
  checklist: {
    titulo: "Lista de verificación a mano",
    bloques: [
      { encabezado: "Para mirar con tus ojos", lineas: ["☐ ¿Se entiende qué hace cada botón?", "☐ ¿Se lee bien en el celular de un amigo?", "☐ ¿El resumen de gastos se sigue sin ayuda?"] },
      { encabezado: "Cómo se completa", lineas: ["Una persona carga dos gastos de prueba y tilda lo que está bien.", "Lo que queda sin tildar vuelve a construcción."] },
    ],
  },
  review: {
    titulo: "Verificación final",
    bloques: [
      { encabezado: "Lo que se pidió", lineas: ["Una app para dividir los gastos de un viaje entre amigos."] },
      { encabezado: "Lo que se entregó", lineas: ["Cargar gastos, ver quién debe y corregir errores."] },
      { encabezado: "Las pruebas", lineas: ["12 de 12 pruebas pasan.", "La prueba de punta a punta quedó guardada."] },
      { encabezado: "Veredicto", lineas: ["✔ Cumple lo pedido. Se puede usar."] },
    ],
  },
};
