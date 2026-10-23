# frontend-auth Specification

## Purpose

Define cómo el frontend del HRIS identifica al usuario contra el proveedor de identidad corporativo (Keycloak, realm `hris`): sesión obligatoria, configuración por entorno, mantenimiento y cierre de la sesión, perfil del usuario actual y envío de su token a la API propia.

## Requirements

### Requirement: Sesión obligatoria
La aplicación SHALL mostrar su contenido solo a usuarios con una sesión válida en el proveedor de identidad. Sin sesión, SHALL redirigir al login del realm `hris` usando Authorization Code con PKCE (S256) y, tras autenticarse, SHALL volver a la URL que el usuario había solicitado.

#### Scenario: Acceso sin sesión
- **WHEN** un usuario sin sesión abre `http://localhost:4200/descansos`
- **THEN** el navegador se redirige a la página de login de Keycloak del realm `hris` sin haber mostrado el shell

#### Scenario: Vuelta tras el login
- **WHEN** el usuario introduce credenciales válidas en Keycloak tras intentar abrir `/descansos`
- **THEN** vuelve a la aplicación en `/descansos`, dentro del shell, y la URL no conserva los parámetros del intercambio de código

#### Scenario: Sesión existente
- **WHEN** un usuario con sesión activa en Keycloak abre la aplicación en una pestaña nueva
- **THEN** entra directamente al shell sin volver a introducir credenciales

#### Scenario: Proveedor no disponible
- **WHEN** el proveedor de identidad no responde al arrancar la aplicación
- **THEN** la aplicación muestra un mensaje de error en español indicando que no se pudo iniciar sesión, en lugar de una página en blanco

### Requirement: Configuración del proveedor por entorno
El issuer (URL del realm) y el identificador de cliente SHALL definirse en la configuración de entorno del frontend, seleccionada en tiempo de build, y no fijarse en el código de la aplicación. La configuración de desarrollo SHALL apuntar a `http://localhost:8081/realms/hris` con el cliente `hris-frontend`.

#### Scenario: Desarrollo local
- **WHEN** se arranca el frontend en modo desarrollo con el entorno local levantado
- **THEN** las peticiones de autenticación van a `http://localhost:8081/realms/hris` con `client_id=hris-frontend`

#### Scenario: Cambio de issuer
- **WHEN** se modifica el issuer en el fichero de entorno de una configuración de build y se recompila con ella
- **THEN** la aplicación usa el nuevo issuer sin cambios en otros ficheros

### Requirement: Renovación del token
Mientras la aplicación está abierta, el access token SHALL renovarse antes de caducar sin interrumpir al usuario. Si la renovación falla porque la sesión ya no es válida en el proveedor, la aplicación SHALL redirigir al login.

#### Scenario: Token próximo a caducar
- **WHEN** el usuario sigue usando la aplicación más allá de la vida del access token (15 minutos en el realm local)
- **THEN** sigue en la misma página y las peticiones a la API llevan un token vigente

#### Scenario: Sesión cerrada en el proveedor
- **WHEN** la sesión del usuario se invalida en Keycloak (p. ej., desde la consola de administración) y la aplicación intenta renovar el token
- **THEN** el usuario es redirigido al login de Keycloak

### Requirement: Cierre de sesión
El usuario SHALL poder cerrar sesión desde la aplicación. El cierre SHALL terminar la sesión en el proveedor de identidad (no solo en el navegador) y devolver al usuario a la aplicación, que SHALL volver a exigir login.

#### Scenario: Cerrar sesión
- **WHEN** el usuario elige "Cerrar sesión"
- **THEN** se termina su sesión en Keycloak, se vuelve a la aplicación y se muestra el login de Keycloak

#### Scenario: Sin sesión residual
- **WHEN** tras cerrar sesión el usuario abre la aplicación en otra pestaña
- **THEN** se le pide de nuevo el login en lugar de entrar con la sesión anterior

### Requirement: Perfil del usuario actual
La aplicación SHALL exponer a sus componentes el perfil del usuario autenticado obtenido de los claims del token: identificador de usuario, nombre completo, correo y roles de realm del HRIS (`people-talent`, `administracion`, `delivery-manager`, `direccion`, `colaborador`). Si falta el nombre, SHALL usar el nombre de usuario.

#### Scenario: Usuario de prueba
- **WHEN** inicia sesión `pyt@cleteci.local`
- **THEN** el perfil expone el nombre "People Talent", el correo `pyt@cleteci.local` y el rol `people-talent`

#### Scenario: Roles ajenos al HRIS
- **WHEN** el token incluye roles por defecto de Keycloak (p. ej., `offline_access`, `uma_authorization`, `default-roles-hris`)
- **THEN** el perfil no los incluye entre los roles del usuario

### Requirement: Token en las peticiones a la API
Las peticiones HTTP de la aplicación dirigidas a la URL base de la API propia (definida en la configuración de entorno) SHALL incluir la cabecera `Authorization: Bearer <access token>`. Las peticiones a cualquier otro origen SHALL enviarse sin esa cabecera.

#### Scenario: Petición a la API
- **WHEN** la aplicación hace una petición a una ruta bajo la URL base de la API
- **THEN** la petición lleva `Authorization: Bearer` con el access token vigente

#### Scenario: Petición a terceros
- **WHEN** la aplicación hace una petición a un origen distinto de la API
- **THEN** la petición no lleva la cabecera `Authorization`
