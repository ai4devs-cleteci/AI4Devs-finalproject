# Spec Delta

## Purpose

Define cómo la API REST del HRIS autentica a quien la llama con los tokens del realm `hris` de Keycloak, cómo traduce sus roles de realm en permisos y con qué formato común responde los errores.

## ADDED Requirements

### Requirement: Autenticación con tokens del realm
Toda petición a `/api/**` SHALL llevar un access token JWT emitido por el realm `hris`, vigente, con firma válida y con `hris-api` en su audiencia. Sin token o con un token que no cumpla alguna de esas condiciones, la API SHALL responder `401 Unauthorized` sin procesar la petición.

#### Scenario: Petición sin token
- **WHEN** se llama a `GET /api/v1/colaboradores` sin cabecera `Authorization`
- **THEN** la respuesta es `401` y no devuelve datos

#### Scenario: Token caducado o de otro emisor
- **WHEN** se llama a la API con un token caducado, o firmado por un realm distinto de `hris`
- **THEN** la respuesta es `401`

#### Scenario: Token válido
- **WHEN** `pyt@cleteci.local` llama a `GET /api/v1/colaboradores` con el access token obtenido por el frontend
- **THEN** la petición se procesa y la respuesta es `200`

### Requirement: Autorización por roles del realm
La API SHALL tomar como roles del usuario los roles de realm del token (`people-talent`, `administracion`, `delivery-manager`, `direccion`, `colaborador`) e ignorar los demás. Una petición autenticada sin permiso para la operación SHALL recibir `403 Forbidden`.

#### Scenario: Rol sin permiso
- **WHEN** `colaborador@cleteci.local` llama a `GET /api/v1/colaboradores`
- **THEN** la respuesta es `403`

#### Scenario: Roles por defecto de Keycloak
- **WHEN** un usuario cuyo token solo contiene los roles por defecto (`offline_access`, `uma_authorization`) llama a la API
- **THEN** se le trata como usuario sin roles del HRIS y recibe `403` en las operaciones protegidas por rol

### Requirement: Errores con Problem Details
Las respuestas de error de la API (4xx y 5xx) SHALL tener cuerpo `application/problem+json` (RFC 9457) con `type`, `title`, `status` y `detail` en español. Los errores de validación SHALL incluir además la lista de campos inválidos con su mensaje. Los errores 5xx no SHALL exponer trazas ni detalles internos.

#### Scenario: Error de validación
- **WHEN** se envía una petición con campos obligatorios vacíos
- **THEN** la respuesta es `400` con `application/problem+json` y una entrada por cada campo inválido con su nombre y un mensaje en español

#### Scenario: Recurso inexistente
- **WHEN** se pide `GET /api/v1/colaboradores/99999` y no existe
- **THEN** la respuesta es `404` con `application/problem+json`

#### Scenario: Error inesperado
- **WHEN** ocurre una excepción no controlada al procesar una petición
- **THEN** la respuesta es `500` con un `detail` genérico y sin traza de pila

### Requirement: Acceso desde el frontend
La API SHALL aceptar peticiones de navegador (CORS, incluido el preflight) desde los orígenes configurados del frontend, que en el entorno local son `http://localhost:4200`, y SHALL rechazar las de otros orígenes.

#### Scenario: Preflight desde el frontend local
- **WHEN** el navegador envía `OPTIONS /api/v1/colaboradores` con `Origin: http://localhost:4200` y `Access-Control-Request-Headers: authorization`
- **THEN** la respuesta permite ese origen, la cabecera `Authorization` y los métodos `GET`, `POST`, `PUT`, `PATCH` y `DELETE`

#### Scenario: Origen no permitido
- **WHEN** una petición llega con `Origin: http://evil.example`
- **THEN** la respuesta no incluye `Access-Control-Allow-Origin` para ese origen

### Requirement: Endpoints de salud públicos
`/actuator/health` SHALL responder sin autenticación; el resto de endpoints de actuator SHALL requerir autenticación.

#### Scenario: Health check
- **WHEN** se llama a `GET /actuator/health` sin token
- **THEN** la respuesta es `200` con el estado de la aplicación

#### Scenario: Otros endpoints de actuator
- **WHEN** se llama a `GET /actuator/modulith` sin token
- **THEN** la respuesta es `401`
