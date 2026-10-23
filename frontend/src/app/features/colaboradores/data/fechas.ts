/**
 * Las fechas de la API son `yyyy-MM-dd` sin zona horaria. Se formatean como texto para no pasar por
 * `Date`, que las interpretaría como UTC y podría mostrar el día anterior.
 */
export function fechaCorta(iso: string | null | undefined): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}

/** Fecha de hoy en la zona del navegador como `yyyy-MM-dd`. */
export function hoyIso(ahora: Date = new Date()): string {
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function antiguedadTexto(antiguedad: { anios: number; meses: number }): string {
  const anios = `${antiguedad.anios} ${antiguedad.anios === 1 ? 'año' : 'años'}`;
  const meses = `${antiguedad.meses} ${antiguedad.meses === 1 ? 'mes' : 'meses'}`;
  return `${anios} y ${meses}`;
}
