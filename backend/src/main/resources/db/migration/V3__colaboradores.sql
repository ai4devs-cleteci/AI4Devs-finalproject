-- Registro del colaborador (módulo colaboradores): bloques de identidad y de posición y contrato.
-- Banda, "reporta a", antigüedad y elegibilidades no se guardan: se calculan al leer.

-- ID correlativo de 5 dígitos: no se reutiliza y no da la vuelta al agotarse.
CREATE SEQUENCE colaborador_id_seq START WITH 1 INCREMENT BY 1 MAXVALUE 99999 NO CYCLE;

CREATE TABLE colaborador (
    id                     BIGINT       NOT NULL PRIMARY KEY DEFAULT nextval('colaborador_id_seq'),
    version                BIGINT       NOT NULL DEFAULT 0,

    -- Identidad
    nombre_completo        VARCHAR(200) NOT NULL,
    nombre_corto           VARCHAR(100) NOT NULL,
    tipo_documento         VARCHAR(20)  NOT NULL CHECK (tipo_documento IN ('CEDULA', 'PASAPORTE')),
    documento              VARCHAR(40)  NOT NULL,
    -- Documento en mayúsculas sin espacios, puntos ni guiones: base de la unicidad y la búsqueda.
    documento_normalizado  VARCHAR(40)  NOT NULL,
    correo_personal        VARCHAR(254) NOT NULL,
    telefono               VARCHAR(16)  NOT NULL,
    fecha_nacimiento       DATE,
    genero                 VARCHAR(30)  CHECK (genero IN ('FEMENINO', 'MASCULINO', 'NO_BINARIO', 'PREFIERE_NO_DECIRLO')),
    nacionalidad           VARCHAR(80),

    -- Posición y contrato
    fecha_ingreso          DATE         NOT NULL,
    rol_codigo             VARCHAR(40)  NOT NULL REFERENCES rol (codigo),
    nivel_codigo           VARCHAR(40)  NOT NULL REFERENCES nivel (codigo),
    trayectoria_codigo     VARCHAR(40)  REFERENCES trayectoria (codigo),
    unidad_codigo          VARCHAR(40)  NOT NULL REFERENCES unidad_produccion (codigo),
    modalidad              VARCHAR(30)  NOT NULL CHECK (modalidad IN ('HONORARIOS_PROFESIONALES', 'NOMINA')),
    estado                 VARCHAR(20)  NOT NULL CHECK (estado IN ('EN_ONBOARDING', 'ACTIVO', 'EGRESADO')),
    proyecto_codigo        VARCHAR(40)  REFERENCES proyecto (codigo),
    pais_residencia_codigo VARCHAR(40)  NOT NULL REFERENCES pais (codigo),

    -- Nombres completo y corto en minúsculas y sin acentos, para la búsqueda.
    nombre_busqueda        VARCHAR(310) NOT NULL,

    creado_en              TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_por             VARCHAR(255) NOT NULL,
    modificado_en          TIMESTAMP WITH TIME ZONE NOT NULL,
    modificado_por         VARCHAR(255) NOT NULL,

    CONSTRAINT colaborador_documento_unico UNIQUE (tipo_documento, documento_normalizado)
);

ALTER SEQUENCE colaborador_id_seq OWNED BY colaborador.id;

CREATE INDEX colaborador_unidad_idx ON colaborador (unidad_codigo);
CREATE INDEX colaborador_proyecto_idx ON colaborador (proyecto_codigo);
CREATE INDEX colaborador_estado_idx ON colaborador (estado);
