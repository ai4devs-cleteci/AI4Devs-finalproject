import { SchemaPathTree, email, pattern, required, validate } from '@angular/forms/signals';
import {
  ColaboradorDetalle,
  ColaboradorPeticion,
  Genero,
  Modalidad,
  TipoDocumento,
} from '../data/colaborador.model';
import { hoyIso } from '../data/fechas';

/** Modelo del formulario: sin `null` (Signal Forms); los opcionales vacíos son `''`. */
export interface ColaboradorFormModel {
  nombreCompleto: string;
  nombreCorto: string;
  tipoDocumento: TipoDocumento | '';
  documento: string;
  correoPersonal: string;
  telefono: string;
  fechaNacimiento: string;
  genero: Genero | '';
  nacionalidad: string;
  fechaIngreso: string;
  rolCodigo: string;
  nivelCodigo: string;
  trayectoriaCodigo: string;
  unidadCodigo: string;
  modalidad: Modalidad | '';
  proyectoCodigo: string;
  paisResidenciaCodigo: string;
}

export type CampoColaborador = keyof ColaboradorFormModel;

/** Orden de los campos en pantalla: el foco va al primero inválido. */
export const CAMPOS: readonly CampoColaborador[] = [
  'nombreCompleto',
  'nombreCorto',
  'tipoDocumento',
  'documento',
  'correoPersonal',
  'telefono',
  'fechaNacimiento',
  'genero',
  'nacionalidad',
  'fechaIngreso',
  'rolCodigo',
  'nivelCodigo',
  'trayectoriaCodigo',
  'unidadCodigo',
  'modalidad',
  'proyectoCodigo',
  'paisResidenciaCodigo',
];

export const OBLIGATORIOS: readonly CampoColaborador[] = [
  'nombreCompleto',
  'nombreCorto',
  'tipoDocumento',
  'documento',
  'correoPersonal',
  'telefono',
  'fechaIngreso',
  'rolCodigo',
  'nivelCodigo',
  'unidadCodigo',
  'modalidad',
  'paisResidenciaCodigo',
];

/** Mismo formato de teléfono que valida la API: `+`, código de país y de 7 a 15 dígitos. */
export const TELEFONO = /^\+[1-9]\d{6,14}$/;

export function modeloVacio(): ColaboradorFormModel {
  return {
    nombreCompleto: '',
    nombreCorto: '',
    tipoDocumento: '',
    documento: '',
    correoPersonal: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    nacionalidad: '',
    fechaIngreso: '',
    rolCodigo: '',
    nivelCodigo: '',
    trayectoriaCodigo: '',
    unidadCodigo: '',
    modalidad: '',
    proyectoCodigo: '',
    paisResidenciaCodigo: '',
  };
}

export function modeloDe(c: ColaboradorDetalle): ColaboradorFormModel {
  return {
    nombreCompleto: c.nombreCompleto,
    nombreCorto: c.nombreCorto,
    tipoDocumento: c.tipoDocumento,
    documento: c.documento,
    correoPersonal: c.correoPersonal,
    telefono: c.telefono,
    fechaNacimiento: c.fechaNacimiento ?? '',
    genero: c.genero ?? '',
    nacionalidad: c.nacionalidad ?? '',
    fechaIngreso: c.fechaIngreso,
    rolCodigo: c.rol.codigo,
    nivelCodigo: c.nivel.codigo,
    trayectoriaCodigo: c.trayectoria?.codigo ?? '',
    unidadCodigo: c.unidadProduccion.codigo,
    modalidad: c.modalidad,
    proyectoCodigo: c.proyecto?.codigo ?? '',
    paisResidenciaCodigo: c.paisResidencia.codigo,
  };
}

/** Convierte el modelo (ya validado) en el cuerpo de la API, con `null` en los opcionales vacíos. */
export function peticionDe(m: ColaboradorFormModel, version?: number): ColaboradorPeticion {
  const opcional = (valor: string) => (valor.trim() ? valor.trim() : null);
  return {
    ...(version === undefined ? {} : { version }),
    nombreCompleto: m.nombreCompleto.trim(),
    nombreCorto: m.nombreCorto.trim(),
    tipoDocumento: m.tipoDocumento as TipoDocumento,
    documento: m.documento.trim(),
    correoPersonal: m.correoPersonal.trim(),
    telefono: m.telefono.trim(),
    fechaNacimiento: opcional(m.fechaNacimiento),
    genero: m.genero || null,
    nacionalidad: opcional(m.nacionalidad),
    fechaIngreso: m.fechaIngreso,
    rolCodigo: m.rolCodigo,
    nivelCodigo: m.nivelCodigo,
    trayectoriaCodigo: opcional(m.trayectoriaCodigo),
    unidadCodigo: m.unidadCodigo,
    modalidad: m.modalidad as Modalidad,
    proyectoCodigo: opcional(m.proyectoCodigo),
    paisResidenciaCodigo: m.paisResidenciaCodigo,
  };
}

/** Reglas equivalentes a las de la API para avisar antes de enviar. */
export function reglasColaborador(p: SchemaPathTree<ColaboradorFormModel>): void {
  for (const campo of OBLIGATORIOS) {
    required(p[campo], { message: 'Este campo es obligatorio.' });
    validate(p[campo], ({ value }) =>
      typeof value() === 'string' && value() !== '' && !String(value()).trim()
        ? { kind: 'blank', message: 'Este campo es obligatorio.' }
        : undefined,
    );
  }
  email(p.correoPersonal, { message: 'Introduce un correo válido, p. ej. nombre@example.com.' });
  pattern(p.telefono, TELEFONO, {
    message: 'Debe incluir el código de país en formato internacional, p. ej. +584121234567.',
  });
  validate(p.fechaNacimiento, ({ value }) =>
    value() && value() > hoyIso()
      ? { kind: 'futura', message: 'La fecha de nacimiento no puede ser futura.' }
      : undefined,
  );
}
