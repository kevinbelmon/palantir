import { homedir } from "node:os";
import { join } from "node:path";
import { crearServidor } from "./servidor.ts";

const PUERTO = 5174;
const base = process.env.SDD_JUEGO_CARPETA ?? join(homedir(), "sdd-juego");

crearServidor({ base }).listen(PUERTO, "127.0.0.1", () => {
  console.log(`Programa local del juego: http://127.0.0.1:${PUERTO} (solo esta computadora)`);
  console.log(`Los repos se clonan en: ${base}`);
});
