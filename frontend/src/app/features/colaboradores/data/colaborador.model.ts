/** Tipos de la API `/api/v1/colaboradores` y `/api/v1/catalogos`. */

export type TipoDocumento = 'CEDULA' | 'PASAPORTE';
export type Genero = 'FEMENINO' | 'MASCULINO' | 'NO_BINARIO' | 'PREFIERE_NO_DECIRLO';
export type Modalidad = 'HONORARIOS_PROFESIONALES' | 'NOMINA';
export type EstadoColaborador = 'EN_ONBOARDING' | 'ACTIVO' | 'EGRESADO';

/** Valor de catálogo con su código y su nombre legible. */
export interface Referencia {
  readonly codigo: string;
  readonly nombre: string;
}

export interface Persona {
  readonly username: string;
  readonly nombre: string;
}

export interface Elegibilidad {
  readonly elegible: boolean;
  readonly motivo: string | null;
}

export interface ColaboradorDetalle {
  readonly id: string;
  readonly version: number;
  readonly nombreCompleto: string;
  readonly nombreCorto: string;
  readonly tipoDocumento: TipoDocumento;
  readonly documento: string;
  readonly correoPersonal: string;
  readonly telefono: string;
  readonly fechaNacimiento: string | null;
  readonly genero: Genero | null;
  readonly nacionalidad: string | null;
  readonly fechaIngreso: string;
  readonly rol: Referencia;
  readonly nivel: Referencia;
  readonly banda: string | null;
  readonly trayectoria: Referencia | null;
  readonly unidadProduccion: Referencia;
  readonly modalidad: Modalidad;
  readonly estado: EstadoColaborador;
  readonly proyecto: Referencia | null;
  readonly reportaA: Persona | null;
  readonly paisResidencia: Referencia;
  readonly antiguedad: { readonly anios: number; readonly meses: number };
  readonly elegibilidades: {
    readonly salaryReview: Elegibilidad;
    readonly prestamo: Elegibilidad;
    readonly descansoRemunerado: Elegibilidad;
  };
}

export interface ColaboradorResumen {
  readonly id: string;
  readonly nombreCorto: string;
  readonly nombreCompleto: string;
  readonly rol: Referencia;
  readonly unidadProduccion: Referencia;
  readonly proyecto: Referencia | null;
  readonly estado: EstadoColaborador;
  readonly fechaIngreso: string;
}

export interface Pagina<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** Cuerpo del alta y la edición; `version` solo al editar. Los opcionales vacíos van como `null`. */
export interface ColaboradorPeticion {
  readonly version?: number;
  readonly nombreCompleto: string;
  readonly nombreCorto: string;
  readonly tipoDocumento: TipoDocumento;
  readonly documento: string;
  readonly correoPersonal: string;
  readonly telefono: string;
  readonly fechaNacimiento: string | null;
  readonly genero: Genero | null;
  readonly nacionalidad: string | null;
  readonly fechaIngreso: string;
  readonly rolCodigo: string;
  readonly nivelCodigo: string;
  readonly trayectoriaCodigo: string | null;
  readonly unidadCodigo: string;
  readonly modalidad: Modalidad;
  readonly proyectoCodigo: string | null;
  readonly paisResidenciaCodigo: string;
}

export type OrdenColaboradores = 'id' | 'nombreCorto' | 'fechaIngreso';

/** Criterios del listado, tal como viajan en los query params de la página y de la API. */
export interface BusquedaColaboradores {
  readonly q: string;
  readonly unidad: string;
  readonly proyecto: string;
  readonly estado: EstadoColaborador | '';
  readonly page: number;
  readonly size: number;
  readonly sort: OrdenColaboradores;
  readonly dir: 'asc' | 'desc';
}

export type TipoCatalogo =
  'unidades-produccion' | 'proyectos' | 'roles' | 'niveles' | 'trayectorias' | 'paises';

export interface EntradaCatalogo {
  readonly codigo: string;
  readonly nombre: string;
  readonly banda?: string;
  readonly unidadCodigo?: string;
  readonly deliveryManager?: Persona;
}

export const ESTADO_LABELS: Readonly<Record<EstadoColaborador, string>> = {
  EN_ONBOARDING: 'En onboarding / Período de prueba',
  ACTIVO: 'Activo',
  EGRESADO: 'Egresado',
};

export const TIPO_DOCUMENTO_LABELS: Readonly<Record<TipoDocumento, string>> = {
  CEDULA: 'Cédula',
  PASAPORTE: 'Pasaporte',
};

export const GENERO_LABELS: Readonly<Record<Genero, string>> = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  NO_BINARIO: 'No binario',
  PREFIERE_NO_DECIRLO: 'Prefiere no decirlo',
};

export const MODALIDAD_LABELS: Readonly<Record<Modalidad, string>> = {
  HONORARIOS_PROFESIONALES: 'Honorarios profesionales',
  NOMINA: 'Nómina',
};

/** Opciones de un `p-select` a partir de un mapa de etiquetas. */
export function opciones<T extends string>(
  labels: Readonly<Record<T, string>>,
): { codigo: T; nombre: string }[] {
  return (Object.entries(labels) as [T, string][]).map(([codigo, nombre]) => ({ codigo, nombre }));
}
