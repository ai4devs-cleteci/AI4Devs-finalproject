# Proposal

## Why

El registro del colaborador es el núcleo del HRIS: descansos, onboarding, compensación, skills y préstamos referencian a un colaborador, y ninguno puede construirse sin él (especificación funcional "Módulo 1: Registro del Colaborador", v1.0). Hoy el backend no tiene ningún módulo de dominio ni la API está protegida, y la entrada "Colaboradores" del frontend es una página provisional.

## What Changes

- **API protegida con Keycloak**: el backend pasa a validar los JWT del realm `hris` (audiencia `hris-api`), mapea los roles de realm a autoridades y responde errores con Problem Details (RFC 9457). Se configura el datasource de PostgreSQL y Flyway.
- **Catálogos de la estructura organizacional (solo lectura)**: tablas semilla cargadas por migración Flyway para unidades de producción, proyectos (con su Delivery Manager), roles/cargos, niveles N1–N6 con su banda A/B/C, trayectorias y países, expuestas por un endpoint de consulta. Su administración queda para un cambio posterior.
- **Registro del colaborador (CRUD)** con los bloques A (identidad), B (posición y contrato) y E (campos calculados) del documento:
  - Alta manual por People & Talent con ID correlativo de 5 dígitos generado por el sistema e inmutable, validación de campos obligatorios y unicidad del documento de identidad.
  - Estado contractual inicial "En onboarding / Período de prueba" asignado por el sistema; banda derivada del nivel; "Reporta a" derivado del Delivery Manager del proyecto.
  - Listado paginado con búsqueda y filtros, ficha de detalle, edición y eliminación de altas erróneas.
  - Campos calculados en lectura: antigüedad (años y meses) y elegibilidades de salary review, préstamo y descanso remunerado.
  - Acceso por rol según la sección 8 del documento para los bloques incluidos: P&T lee y escribe; Dirección y Administración leen todo; el Delivery Manager lee a su equipo y cambia el proyecto asignado dentro de sus proyectos; el rol Colaborador no accede en este cambio.
- **Frontend `/colaboradores`**: sustituye la página provisional por listado, ficha y formulario de alta/edición (Signal Forms, PrimeNG), con las acciones visibles según el rol del usuario.

Fuera de alcance (cambios posteriores): creación automática desde el pipeline de selección y disparo del onboarding; bloques C (datos que mantiene el colaborador) y D (corporativos y bancarios); expediente digital; transiciones de estado (activo, egreso con subtipo) e historial de cambios de proyecto, rol, nivel y modalidad; días de descanso generados; migración de colaboradores existentes; organigrama.

## Capabilities

### New Capabilities
- `api-security`: autenticación de la API del backend con JWT de Keycloak, autorización por roles del realm y formato común de errores.
- `organizacion-catalogos`: catálogos de solo lectura de la estructura organizacional y de job architecture que referencian los colaboradores.
- `colaborador-registro`: alta, consulta, edición y eliminación del registro del colaborador (bloques A, B y E), sus reglas de validación, campos derivados, acceso por rol y la pantalla `/colaboradores` del frontend.

### Modified Capabilities
<!-- Ninguna: `app-shell` ya prevé que cada módulo sustituya su página provisional. -->

## Impact

- **Backend**: nuevos módulos Spring Modulith `com.cleteci.erp.organizacion` y `com.cleteci.erp.colaboradores`, configuración de seguridad y manejo de errores compartidos, migraciones Flyway, `application.yaml` (datasource, issuer, `open-in-view: false`), tests de integración con Testcontainers. Nueva API REST `/api/v1/colaboradores` y `/api/v1/catalogos`.
- **Frontend**: feature lazy `features/colaboradores/` registrada desde `navigation.ts`/`shell.routes.ts`, servicios HTTP sobre `environment.apiUrl`.
- **Entorno local**: CORS del backend para `http://localhost:4200`; los datos semilla de proyectos referencian al usuario de prueba `dm@cleteci.local` como Delivery Manager.
- **Decisiones pendientes del documento** que afectan a este cambio (fecha de nacimiento opcional, catálogo inicial de unidades y proyectos) se resuelven con supuestos documentados en `design.md`.
