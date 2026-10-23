# Design

## Context

- `backend/` solo contiene `CleteciErpApplication` y los tests de arranque; `application.yaml` define únicamente el nombre de la app. Las dependencias ya están en el `pom.xml` (JPA, Flyway, resource server OAuth2, validación, webmvc, springdoc, Modulith JPA, Testcontainers), pero no hay datasource, issuer, seguridad ni migraciones.
- Realm `hris`: `hris-api` es bearer-only y el cliente `hris-frontend` añade `hris-api` a la audiencia del access token (mapper `audience-hris-api`). Los usuarios de prueba usan su correo como `preferred_username` (`dm@cleteci.local`, etc.) y tienen un único rol de realm.
- `frontend/`: `AuthService` (`user()`, `hasRole()`) e interceptor Bearer limitado a `environment.apiUrl` (`http://localhost:8080/api`) ya existen. `shell.routes.ts` genera las rutas de módulos desde `NAVIGATION`, todas apuntando a `UnderConstruction`. No existe aún ningún servicio HTTP ni feature.
- Reglas del frontend: Signal Forms (los modelos no admiten `null`: textos `''`), signals, control flow nativo, `inject()`, AXE/WCAG AA. Presupuesto inicial 500 kB/1 MB, ya en ~541 kB: todo lo nuevo debe ir en chunks lazy.
- Requisitos: ver `specs/api-security`, `specs/organizacion-catalogos` y `specs/colaborador-registro`.

## Goals / Non-Goals

**Goals:**
- Dejar establecido el patrón que seguirán los demás módulos: módulo Modulith con API pública mínima, seguridad y errores comunes, migraciones Flyway por módulo, feature lazy en el frontend registrada desde `NAVIGATION`.
- Que el registro de colaboradores no dependa de clases internas de `organizacion`, para que la administración de catálogos pueda llegar después sin tocarlo.

**Non-Goals:**
- Historial de cambios, auditoría campo a campo y eventos de dominio publicados (llegarán con el historial y el onboarding); solo se guardan `creado/modificado por/en`.
- Ocultar entradas del menú por rol (el shell sigue mostrando "Colaboradores" a todos; la pantalla informa de la falta de acceso).
- Búsqueda de texto completo o por similitud.

## Decisions

### 1. Tres módulos de aplicación
- `com.cleteci.erp.plataforma` — módulo **abierto** (`@ApplicationModule(type = OPEN)`): `SecurityFilterChain`, conversión de roles, CORS, `@RestControllerAdvice` de Problem Details, excepciones base (`RecursoNoEncontrado`, `Conflicto`, `OperacionNoPermitida`) y `UsuarioActual` (username, nombre y roles del JWT). Es infraestructura que todos los módulos necesitan, no dominio.
- `com.cleteci.erp.organizacion` — catálogos. API pública en el paquete raíz: `Catalogos` (interfaz) con `existeActivo(TipoCatalogo, codigo)`, `nivel(codigo)`, `proyecto(codigo)`, `proyectosDe(dmUsername)`, `nombres(TipoCatalogo, codigos)`, y records `NivelInfo`, `ProyectoInfo`, `EntradaCatalogo`. Entidades, repositorios y controlador en `organizacion.internal`.
- `com.cleteci.erp.colaboradores` — registro. Paquete raíz solo con lo que otros módulos necesitarán (`ColaboradorId`); el resto en `internal`.

El colaborador guarda **códigos** de catálogo (no asociaciones JPA a entidades de otro módulo); la integridad se asegura con FKs en la base de datos y la validación de existencia/actividad vía `Catalogos`. Un test `ApplicationModules.of(CleteciErpApplication.class).verify()` protege los límites. *Alternativa:* un único módulo `colaboradores` con los catálogos dentro — más simple hoy, pero el documento trata la estructura organizacional como entidad propia (sección 6) y la usarán descansos, facturación y organigrama.

### 2. Seguridad del resource server
- `spring.security.oauth2.resourceserver.jwt.issuer-uri: ${HRIS_AUTH_ISSUER:http://localhost:8081/realms/hris}` y `audiences: hris-api`. Boot crea el decoder perezosamente, así que la app arranca aunque Keycloak no esté.
- `JwtAuthenticationConverter` con `principalClaimName = preferred_username` y un conversor que lee `realm_access.roles`, conserva solo los cinco roles del HRIS y los expone como `ROLE_<rol>`.
- Stateless, CSRF desactivado (solo Bearer), `/actuator/health` y `/v3/api-docs/**`, `/swagger-ui/**` públicos; el resto autenticado. Entradas 401/403 con Problem Details.
- Autorización por operación con `@PreAuthorize` en los servicios (`hasRole('people-talent')`…); el alcance del Delivery Manager (su equipo) se resuelve en el servicio, no en la anotación.
- CORS desde `HrisCorsProperties` (`hris.cors.allowed-origins`, por defecto `http://localhost:4200`, variable `HRIS_CORS_ALLOWED_ORIGINS`).

*Alternativa:* comprobar roles en los controladores con `hasRole` en `requestMatchers` — dispersa las reglas y no cubre la lógica de alcance del DM.

### 3. Errores con `ProblemDetail`
`spring.mvc.problemdetails.enabled: true` y un `GlobalExceptionHandler extends ResponseEntityExceptionHandler` que además traduce `MethodArgumentNotValidException` a `errors: [{field, message}]`, las excepciones de `plataforma` a 404/409/403 y cualquier otra a 500 genérico (registrada en log). Las propiedades extra (p. ej. `colaboradorExistente` en el 409 por documento) se añaden con `setProperty`. Mensajes en `messages.properties`/`ValidationMessages.properties` en español.

### 4. Catálogos semilla
- `V1__organizacion_catalogos.sql`: tablas `unidad_produccion`, `proyecto` (`unidad_codigo`, `dm_username`, `dm_nombre` nulos permitidos), `rol`, `nivel` (`orden`, `banda` con `CHECK IN ('A','B','C')`), `trayectoria`, `pais`; todas con `codigo varchar PK`, `nombre`, `activo`. Datos: unidades Assa Acsel, Supernova, Corporativo; niveles N1–N6; trayectorias Individual, Gestión, Técnica, Estratégica; un conjunto inicial de roles y países.
- Proyectos de ejemplo con `dm_username = 'dm@cleteci.local'` en `db/local/R__proyectos_locales.sql`, fuera de `db/migration`, incluida por `spring.flyway.locations: ${HRIS_FLYWAY_LOCATIONS:classpath:db/migration,classpath:db/local}`. Así el usuario de prueba no llega a otros entornos.
- **Supuesto** (decisión pendiente nº 3 del documento): unidades, roles, países y proyectos iniciales son provisionales; se ajustarán con una nueva migración cuando P&T confirme el catálogo.
- **Supuesto**: correspondencia nivel→banda N1–N2 = A, N3–N4 = B, N5–N6 = C (el documento no la fija); vive en datos, no en código.
- Endpoint `GET /api/v1/catalogos/{catalogo}` → `{ "items": [{ "codigo", "nombre", ... }] }`; proyectos añaden `unidadCodigo` y `deliveryManager`, niveles `banda`.

*Alternativa:* enums Java para todos los catálogos — impediría desactivar entradas y obligaría a desplegar código para cambiar un proyecto. Sí son enums los valores que fija el propio documento: `TipoDocumento`, `Genero`, `Modalidad`, `EstadoColaborador`.

### 5. Modelo del colaborador
`V2__colaboradores.sql` (en `db/migration`, nombrada para ejecutarse tras V1):
- `id bigint PRIMARY KEY DEFAULT nextval('colaborador_id_seq')`, secuencia `START 1 MAXVALUE 99999 NO CYCLE`. La API lo representa como cadena de 5 dígitos (`String.format("%05d")`) y acepta en la ruta `\d{1,5}`.
- Identidad: `nombre_completo`, `nombre_corto`, `tipo_documento`, `documento`, `documento_normalizado`, `correo_personal`, `telefono`, `fecha_nacimiento`, `genero`, `nacionalidad`.
- Posición: `fecha_ingreso`, `rol_codigo`, `nivel_codigo`, `trayectoria_codigo`, `unidad_codigo`, `modalidad`, `estado`, `proyecto_codigo`, `pais_residencia_codigo` (FKs a las tablas de `organizacion`).
- `nombre_busqueda` (nombres en minúsculas sin acentos, calculado en Java con `Normalizer`), `version` (`@Version`), `creado_en/por`, `modificado_en/por` (Spring Data auditing con el username del JWT).
- `UNIQUE (tipo_documento, documento_normalizado)`; `CHECK` sobre los enums.

Banda, "Reporta a", antigüedad y elegibilidades **no se persisten**: se calculan al construir la respuesta (banda y DM vía `Catalogos`), así nunca quedan desfasados respecto al catálogo ni a la fecha.

*Alternativa para el ID:* `max(id)+1` en una transacción — evita huecos pero exige bloqueo de tabla; la secuencia puede dejar huecos solo si falla un INSERT tras pedir el valor, y el servicio comprueba duplicados antes de insertar para que los errores de validación no consuman IDs.

### 6. Servicio y API
- `ColaboradorService` (package-private en `internal`, transaccional) con comandos `AltaColaborador`, `EdicionColaborador(version, …)`, `CambioProyecto(version, proyectoCodigo)` y consulta `BusquedaColaboradores(texto, unidad, proyecto, estado, pageable)`.
- Controlador `/api/v1/colaboradores`: `GET` (página), `POST` (201 + `Location`), `GET /{id}`, `PUT /{id}`, `PATCH /{id}/proyecto`, `DELETE /{id}` (204). DTOs record de request/response separados de la entidad; mapeo manual (son pocos campos y la respuesta mezcla datos de dos módulos, MapStruct no aporta).
- Página como `{ items, page, size, totalElements, totalPages }`; `size` máx. 100; `sort` admite `id`, `nombreCorto`, `fechaIngreso`.
- Búsqueda con `Specification`: el texto normalizado se compara con `nombre_busqueda`, `documento_normalizado` y el ID formateado.
- Alcance del DM: el servicio obtiene `Catalogos.proyectosDe(username)` y añade `proyecto_codigo IN (...)` a la consulta; una ficha fuera de alcance lanza `RecursoNoEncontrado` (404, no revela existencia).
- Regla del proyecto en `PUT` (**supuesto** que concilia la sección 8 —P&T solo lee el proyecto— con el alta, que lo necesita para el onboarding): P&T fija el proyecto al alta o si está vacío; si el colaborador ya tiene uno y la edición lo cambia → `OperacionNoPermitida` (403).
- Concurrencia: el cliente envía `version` en el cuerpo de `PUT`/`PATCH`; si no coincide → 409. *Alternativa:* `ETag`/`If-Match` — más REST, pero exige leer cabeceras en el frontend y el formulario ya tiene el modelo a mano.
- Elegibilidad de préstamo: no hay módulo de préstamos; "sin préstamo activo" se considera verdadero hasta que exista (documentado en el código con un `TODO` enlazado al futuro cambio).
- `Clock` como bean inyectado para que antigüedad y elegibilidades sean testeables con fecha fija.

### 7. Frontend
- `features/colaboradores/`: `colaboradores.routes.ts` con `''` (listado), `nuevo`, `:id`, `:id/editar`; `data/colaboradores-api.ts` y `data/catalogos-api.ts` (`providedIn: 'root'`, `HttpClient` para escrituras, `httpResource` para lecturas reactivas a filtros/ID), `data/colaborador.model.ts` con los tipos de la API.
- `NavItem` gana `loadChildren?`; `NAVIGATION` lo define para `colaboradores` y `shell.routes.ts` lo usa en lugar de `UnderConstruction` cuando existe (lo que ya prevé `CLAUDE.md`).
- Autorización en cliente: guard funcional `requireRole(...roles)` en `core/auth/` que, si falla, redirige a `sin-acceso` (nueva página `shared/forbidden` en el shell); el listado y la ficha usan `AuthService.hasRole` para mostrar u ocultar acciones. La API sigue siendo la autoridad.
- Listado: `p-table` lazy (paginación y orden en servidor), búsqueda con debounce de 300 ms, `p-select` para filtros, `p-tag` para estado. Filtros y página en query params para que el listado sea enlazable y sobreviva a volver desde la ficha.
- Formulario: un componente para alta y edición con Signal Forms (`form()`, `required`, `email`, `pattern`, `[formField]`); modelo sin `null` (textos `''`, fechas como cadena ISO `yyyy-MM-dd` convertida en el borde con la API para evitar desfases de zona horaria). Errores de la API (`errors[]` del 400, 409) se asignan al campo correspondiente desde el `submit()`.
- Ficha: secciones con `<dl>`; "Eliminar" con `p-confirmdialog`; "Cambiar proyecto" en `p-dialog` con un `p-select` de los proyectos del DM. Avisos con `p-toast` (`MessageService` provisto en la ruta de la feature).
- Tests con `HttpTestingController`, `provideFakeAuth` con distintos roles y `axe-core` en tema claro y oscuro.

### 8. Ajustes durante la implementación
- **Migraciones**: `V1__modulith_event_publication.sql` crea las tablas de Spring Modulith (`ddl-auto: validate` las exige); los catálogos pasan a `V2` y los colaboradores a `V3`.
- **Fechas**: `<input type="date">` nativo en lugar de `p-datepicker`. Su valor ya es `yyyy-MM-dd` (sin conversión ni desfases de zona horaria) y es accesible por defecto. `p-select` e `input pInputText` funcionan con `[formField]` mediante su `ControlValueAccessor`, sin adaptador.
- **Confirmación de borrado**: `p-dialog` propio en lugar de `p-confirmdialog`, que deja en el DOM un host con `role="alertdialog"` sin nombre aunque esté cerrado (falla AXE). Ambos diálogos devuelven el foco al botón que los abrió.
- **Listado**: `p-table` solo para mostrar filas, con `p-paginator` aparte y botones de orden propios en las cabeceras (`aria-sort`); el estado vive en los query params.
- **Filtros del listado**: Signal Forms también para los filtros (no `ngModel`), aplicados a la URL con un debounce de 300 ms.
- **Ficha en pestañas** (`p-tabs`): Identidad, Posición y contrato, Datos calculados. El formulario sigue en una sola página para no esconder errores en pestañas no visibles.
- **Cuándo se ven los errores**: al salir de un campo modificado (`dirty` y `touched`) o tras el primer intento de guardar; pasar por un campo sin cambiarlo no lo marca. Lo decide `ColaboradorForm.conError()`, que también alimenta `aria-invalid` y `aria-describedby`.
- **Tests del frontend**: `vitest-base.config.mts` sube el `testTimeout` a 20 s y `src/test-setup.ts` sustituye `ResizeObserver` (lo usa `p-tablist`); con la suite completa en paralelo las auditorías AXE en jsdom superaban los 5 s por defecto.

## Risks / Trade-offs

- [Componentes PrimeNG 22 (`p-select`, `p-datepicker`) con `[formField]` de Signal Forms sin soporte probado] → la primera tarea del formulario verifica la integración; si no funciona, envolver cada control en un pequeño adaptador `FormValueControl` dentro de la feature.
- [La secuencia puede dejar huecos en el ID correlativo] → aceptado: el documento pide correlativo e inmutable, no ausencia de huecos; se evita consumir IDs en errores de validación y duplicado.
- [El tope de 99 999 IDs] → la secuencia falla con error claro al agotarse; holgado para el tamaño de Cleteci.
- [El DM se identifica por `preferred_username` guardado en el catálogo] → si cambia el username en Keycloak pierde su equipo; aceptable hasta que exista el CRUD de proyectos, que permitirá reasignarlo.
- [Eliminación física de un registro que en el futuro referencien otros módulos] → hoy nada lo referencia; cuando existan referencias, las FKs impedirán borrar y la eliminación quedará limitada a registros sin dependencias (se revisará en el cambio de ciclo de vida).
- [El bundle inicial ya supera el aviso de 500 kB] → la feature es lazy y PrimeNG Table/Select/Dialog solo se importan en ella. Aun así `main` pasa de ~541 kB a ~588 kB: el optimizador de chunks sube a `main` módulos del framework que ahora comparten varios chunks lazy (`httpResource`, partes de `@angular/core`, utilidades de PrimeNG y operadores de rxjs). Queda bajo el error de 1 MB; reducirlo es trabajo aparte.
- [Tests de autorización sin Keycloak real] → se usan JWT simulados (`jwt()` de spring-security-test) para roles; la validación de audiencia/emisor se cubre con un decoder de prueba con clave local.

## Migration Plan

Sin datos previos: Flyway crea esquema y catálogos al primer arranque contra la BD `hris` de `docker compose`. Rollback en local con `docker compose down -v`. La migración de colaboradores existentes (IDs nuevos en el orden que defina P&T) queda fuera de este cambio.

## Open Questions

- ¿"Fecha de nacimiento" pasará a obligatoria (decisión pendiente nº 2)? Se deja opcional; hacerla obligatoria solo cambia una validación y el marcado del formulario.
- Lista definitiva de unidades de producción, proyectos, roles y países (decisión pendiente nº 3): se cargará con una migración nueva.
