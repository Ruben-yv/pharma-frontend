/** Normaliza texto para búsquedas que ignoran mayúsculas y tildes. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

/** Verifica que todas las palabras de búsqueda aparezcan en alguno de los campos. */
export function coincide(busqueda: string, ...campos: string[]): boolean {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const texto = normalizar(campos.join(' '));
  return palabras.every((palabra) => texto.includes(palabra));
}
