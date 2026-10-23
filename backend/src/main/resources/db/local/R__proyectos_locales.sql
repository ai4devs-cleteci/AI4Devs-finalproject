-- Proyectos de ejemplo para el entorno local: usan los usuarios de prueba del realm hris.
-- Solo se cargan si db/local está en spring.flyway.locations (valor por defecto en local).
INSERT INTO proyecto (codigo, nombre, unidad_codigo, dm_username, dm_nombre) VALUES
    ('ASSA_CORE', 'Assa Acsel Core', 'ASSA_ACSEL', 'dm@cleteci.local', 'Delivery Manager'),
    ('SUPERNOVA_APP', 'Supernova App', 'SUPERNOVA', 'dm@cleteci.local', 'Delivery Manager'),
    ('PORTAL_CLIENTES', 'Portal de clientes', 'SUPERNOVA', 'otro.dm@cleteci.local', 'Otro Delivery Manager'),
    ('INTERNO', 'Proyectos internos', 'CORPORATIVO', NULL, NULL)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    unidad_codigo = EXCLUDED.unidad_codigo,
    dm_username = EXCLUDED.dm_username,
    dm_nombre = EXCLUDED.dm_nombre;
