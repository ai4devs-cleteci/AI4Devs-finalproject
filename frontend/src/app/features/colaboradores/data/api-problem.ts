import { HttpErrorResponse } from '@angular/common/http';

/** Error de un campo de la petición, tal como lo devuelve la API en `errors`. */
export interface ErrorDeCampo {
  readonly field: string;
  readonly message: string;
}

/** Respuesta de error de la API (Problem Details, RFC 9457) reducida a lo que usa la interfaz. */
export interface ApiProblem {
  readonly status: number;
  readonly detail: string;
  /** Código del error de negocio (`colaborador.documento-duplicado`, `error.version-desactualizada`…). */
  readonly codigo: string | null;
  readonly errors: readonly ErrorDeCampo[];
  readonly colaboradorExistente: string | null;
}

const SIN_CONEXION =
  'No se pudo contactar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
const INESPERADO = 'Se produjo un error inesperado. Inténtalo de nuevo más tarde.';

export const VERSION_DESACTUALIZADA = 'error.version-desactualizada';

/** Traduce cualquier error de `HttpClient` a un `ApiProblem` con textos en español. */
export function toApiProblem(error: unknown): ApiProblem {
  if (!(error instanceof HttpErrorResponse)) {
    return problem(0, INESPERADO);
  }
  if (error.status === 0) {
    return problem(0, SIN_CONEXION);
  }
  const body: unknown = error.error;
  if (!isRecord(body)) {
    return problem(error.status, INESPERADO);
  }
  return {
    status: error.status,
    detail: typeof body['detail'] === 'string' ? body['detail'] : INESPERADO,
    codigo: typeof body['codigo'] === 'string' ? body['codigo'] : null,
    errors: Array.isArray(body['errors']) ? body['errors'].filter(isErrorDeCampo) : [],
    colaboradorExistente:
      typeof body['colaboradorExistente'] === 'string' ? body['colaboradorExistente'] : null,
  };
}

function problem(status: number, detail: string): ApiProblem {
  return { status, detail, codigo: null, errors: [], colaboradorExistente: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isErrorDeCampo(value: unknown): value is ErrorDeCampo {
  return (
    isRecord(value) && typeof value['field'] === 'string' && typeof value['message'] === 'string'
  );
}
