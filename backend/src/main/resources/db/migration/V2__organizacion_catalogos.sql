-- Catálogos de la estructura organizacional y de job architecture (módulo organizacion).
-- Datos iniciales provisionales: la lista definitiva la confirmará P&T con una nueva migración.

CREATE TABLE unidad_produccion (
    codigo VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE proyecto (
    codigo        VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    unidad_codigo VARCHAR(40)  NOT NULL REFERENCES unidad_produccion (codigo),
    -- Delivery Manager responsable: usuario (preferred_username) y nombre en el proveedor de identidad.
    dm_username   VARCHAR(255),
    dm_nombre     VARCHAR(200),
    CONSTRAINT proyecto_dm_completo CHECK ((dm_username IS NULL) = (dm_nombre IS NULL))
);

CREATE INDEX proyecto_dm_username_idx ON proyecto (dm_username);

CREATE TABLE rol (
    codigo VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE nivel (
    codigo VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE,
    orden  SMALLINT     NOT NULL UNIQUE,
    banda  CHAR(1)      NOT NULL CHECK (banda IN ('A', 'B', 'C'))
);

CREATE TABLE trayectoria (
    codigo VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE pais (
    codigo VARCHAR(40)  NOT NULL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    activo BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO unidad_produccion (codigo, nombre) VALUES
    ('ASSA_ACSEL', 'Assa Acsel'),
    ('SUPERNOVA', 'Supernova'),
    ('CORPORATIVO', 'Corporativo');

-- Supuesto: N1–N2 → banda A, N3–N4 → B, N5–N6 → C (el documento funcional no fija la correspondencia).
INSERT INTO nivel (codigo, nombre, orden, banda) VALUES
    ('N1', 'N1', 1, 'A'),
    ('N2', 'N2', 2, 'A'),
    ('N3', 'N3', 3, 'B'),
    ('N4', 'N4', 4, 'B'),
    ('N5', 'N5', 5, 'C'),
    ('N6', 'N6', 6, 'C');

INSERT INTO trayectoria (codigo, nombre) VALUES
    ('INDIVIDUAL', 'Individual'),
    ('GESTION', 'Gestión'),
    ('TECNICA', 'Técnica'),
    ('ESTRATEGICA', 'Estratégica');

INSERT INTO rol (codigo, nombre) VALUES
    ('DESARROLLADOR', 'Desarrollador/a de software'),
    ('ARQUITECTO', 'Arquitecto/a de software'),
    ('QA', 'Analista de QA'),
    ('DEVOPS', 'Ingeniero/a DevOps'),
    ('UX_UI', 'Diseñador/a UX/UI'),
    ('PROJECT_MANAGER', 'Project Manager'),
    ('DELIVERY_MANAGER', 'Delivery Manager'),
    ('PEOPLE_TALENT', 'Especialista de People & Talent'),
    ('ADMINISTRACION', 'Analista de administración');

-- Códigos ISO 3166-1 alfa-2.
INSERT INTO pais (codigo, nombre) VALUES
    ('AR', 'Argentina'),
    ('CL', 'Chile'),
    ('CO', 'Colombia'),
    ('CR', 'Costa Rica'),
    ('DO', 'República Dominicana'),
    ('EC', 'Ecuador'),
    ('ES', 'España'),
    ('MX', 'México'),
    ('PA', 'Panamá'),
    ('PE', 'Perú'),
    ('US', 'Estados Unidos'),
    ('UY', 'Uruguay'),
    ('VE', 'Venezuela');
