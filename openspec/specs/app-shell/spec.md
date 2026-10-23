# app-shell Specification

## Purpose

Define la estructura común de navegación del frontend del HRIS: un layout con navegación lateral, barra superior y área de contenido en el que se montan todos los módulos funcionales.

## Requirements

### Requirement: Layout del shell
La aplicación SHALL presentar todas sus páginas dentro de un shell compuesto por una navegación lateral, una barra superior y un área de contenido principal donde se renderiza la ruta activa.

#### Scenario: Página dentro del shell
- **WHEN** el usuario abre cualquier ruta de la aplicación
- **THEN** ve la navegación lateral, la barra superior y el contenido de esa ruta en el área principal

#### Scenario: Sin contenido placeholder de Angular
- **WHEN** el usuario abre la raíz de la aplicación
- **THEN** no se muestra la página de bienvenida generada por Angular CLI

### Requirement: Catálogo de navegación
La navegación lateral SHALL mostrar, con icono y etiqueta, una entrada por módulo agrupada por área: Personas (Inicio, Colaboradores, Descansos y permisos, Ciclo de vida), Gestión (Selección, Compensación, Skills y certificaciones, Préstamos y anticipos) y Análisis (Reportes).

#### Scenario: Entradas visibles
- **WHEN** el usuario abre la aplicación con la navegación expandida
- **THEN** ve los tres grupos con sus etiquetas y las nueve entradas en el orden indicado

#### Scenario: Navegar a un módulo
- **WHEN** el usuario activa la entrada "Descansos y permisos"
- **THEN** la URL cambia a `/descansos` y el área principal muestra la página de ese módulo sin recargar el documento

### Requirement: Entrada activa
La navegación SHALL marcar visual y semánticamente (`aria-current="page"`) la entrada correspondiente a la ruta activa, incluidas sus subrutas.

#### Scenario: Resaltado de la ruta actual
- **WHEN** el usuario está en `/colaboradores` o en una subruta como `/colaboradores/00042`
- **THEN** la entrada "Colaboradores" aparece resaltada y expone `aria-current="page"`, y ninguna otra entrada lo hace

### Requirement: Colapso a iconos en escritorio
En viewports de 1024 px o más, la navegación SHALL poder alternarse entre modo expandido (icono y etiqueta) y modo colapsado (solo iconos) desde un botón de la barra superior, y el área principal SHALL ajustar su ancho sin solaparse.

#### Scenario: Colapsar
- **WHEN** el usuario pulsa el botón de colapso con la navegación expandida
- **THEN** la navegación muestra solo iconos y el área principal ocupa el espacio liberado

#### Scenario: Etiqueta accesible en modo colapsado
- **WHEN** la navegación está colapsada
- **THEN** cada entrada conserva un nombre accesible igual a su etiqueta y muestra la etiqueta como tooltip al recibir foco o hover

### Requirement: Persistencia del estado de colapso
El estado expandido/colapsado de la navegación en escritorio SHALL conservarse entre recargas en el mismo navegador; si no hay valor guardado o el almacenamiento no está disponible, la navegación SHALL arrancar expandida.

#### Scenario: Recarga tras colapsar
- **WHEN** el usuario colapsa la navegación y recarga la página
- **THEN** la navegación arranca colapsada

#### Scenario: Almacenamiento no disponible
- **WHEN** el navegador bloquea el almacenamiento local
- **THEN** la aplicación carga sin errores con la navegación expandida

### Requirement: Navegación superpuesta en pantallas estrechas
En viewports de menos de 1024 px, la navegación SHALL estar oculta por defecto y abrirse superpuesta sobre el contenido con un fondo atenuado; SHALL cerrarse al pulsar el fondo, al pulsar Escape o al navegar a otra entrada.

#### Scenario: Abrir y cerrar en móvil
- **WHEN** el usuario, en un viewport de 375 px, pulsa el botón de menú y luego el fondo atenuado
- **THEN** la navegación se abre superpuesta y después se cierra, sin desplazar el contenido

#### Scenario: Cierre al navegar
- **WHEN** el usuario elige una entrada con la navegación superpuesta abierta
- **THEN** se navega a esa ruta y la navegación se cierra

### Requirement: Barra superior
La barra superior SHALL mostrar el botón de colapso/apertura de la navegación (con nombre accesible y `aria-expanded` que refleja el estado) y el título de la sección activa.

#### Scenario: Título de la sección
- **WHEN** el usuario navega a `/reportes`
- **THEN** la barra superior muestra "Reportes" y el título del documento incluye "Reportes"

### Requirement: Tema claro y oscuro
La barra superior SHALL ofrecer un conmutador de tema claro/oscuro. El tema inicial SHALL seguir la preferencia guardada o, si no existe, la preferencia de color del sistema; la elección SHALL persistir entre recargas.

#### Scenario: Cambiar a oscuro
- **WHEN** el usuario activa el conmutador estando en tema claro
- **THEN** toda la interfaz (componentes PrimeNG y utilidades Tailwind) pasa a tema oscuro y la elección se mantiene al recargar

#### Scenario: Preferencia del sistema
- **WHEN** un usuario sin preferencia guardada abre la aplicación con el sistema en modo oscuro
- **THEN** la aplicación arranca en tema oscuro

### Requirement: Tipografía base
Toda la interfaz SHALL usar Inter como fuente base, servida desde la propia aplicación (sin peticiones a servicios de fuentes de terceros), con una pila de respaldo del sistema mientras carga o si falla.

#### Scenario: Fuente aplicada
- **WHEN** el usuario abre cualquier página del shell
- **THEN** el texto de la navegación, la barra superior, el contenido y los componentes PrimeNG se renderiza con Inter

#### Scenario: Sin dependencias externas de fuentes
- **WHEN** se carga la aplicación
- **THEN** no se realiza ninguna petición a dominios de terceros para obtener fuentes

### Requirement: Iconografía de la aplicación
Los iconos que añade la aplicación (navegación, barra superior y páginas del shell) SHALL pertenecer al conjunto Lucide, con tamaño y grosor de trazo uniformes, y SHALL ser decorativos (ocultos a tecnologías de asistencia) cuando acompañan a una etiqueta de texto.

#### Scenario: Iconos de navegación
- **WHEN** el usuario ve la navegación en cualquier modo
- **THEN** cada entrada muestra su icono Lucide asignado y ningún icono de la aplicación procede de PrimeIcons

#### Scenario: Icono decorativo
- **WHEN** una tecnología de asistencia recorre una entrada de menú
- **THEN** anuncia solo su etiqueta, no el icono

### Requirement: Rutas de módulos y página no encontrada
Cada entrada del catálogo SHALL tener una ruta cargada bajo demanda; mientras el módulo no exista, la ruta SHALL mostrar una página "en construcción" con el nombre del módulo. La raíz SHALL redirigir a `/inicio` y cualquier ruta desconocida SHALL mostrar una página 404 dentro del shell.

#### Scenario: Módulo sin implementar
- **WHEN** el usuario navega a `/prestamos`
- **THEN** ve dentro del shell una página que indica que "Préstamos y anticipos" está en construcción

#### Scenario: Raíz
- **WHEN** el usuario abre `/`
- **THEN** se le redirige a `/inicio`

#### Scenario: Ruta desconocida
- **WHEN** el usuario abre `/no-existe`
- **THEN** ve una página 404 dentro del shell con un enlace para volver a Inicio

### Requirement: Accesibilidad del shell
El shell SHALL cumplir WCAG 2.1 AA en ambos temas: landmarks `nav` (con nombre accesible) y `main`, enlace "Saltar al contenido" como primer elemento enfocable, navegación completa por teclado con foco visible y contraste AA.

#### Scenario: Saltar al contenido
- **WHEN** el usuario carga la página y pulsa Tab una vez y luego Enter
- **THEN** el foco se mueve al área de contenido principal

#### Scenario: Auditoría automática
- **WHEN** se ejecuta AXE sobre el shell en tema claro y en tema oscuro, con la navegación expandida y colapsada
- **THEN** no se reportan violaciones

### Requirement: Usuario autenticado en el shell
El pie de la navegación lateral SHALL mostrar el usuario autenticado: un avatar con sus iniciales, su nombre completo y la etiqueta en español de su rol principal. En modo colapsado SHALL mostrarse solo el avatar, conservando el nombre como nombre accesible y tooltip.

#### Scenario: Datos del usuario
- **WHEN** `dm@cleteci.local` abre la aplicación con la navegación expandida
- **THEN** el pie muestra las iniciales "DM", el nombre "Delivery Manager" y el rol "Delivery Manager"

#### Scenario: Navegación colapsada
- **WHEN** la navegación está colapsada en escritorio
- **THEN** el pie muestra solo el avatar, y al recibir foco o hover se muestra el nombre del usuario como tooltip

#### Scenario: Usuario sin rol del HRIS
- **WHEN** el usuario autenticado no tiene ninguno de los roles del HRIS
- **THEN** el pie muestra su nombre sin etiqueta de rol y la aplicación no falla

### Requirement: Menú del usuario
El elemento de usuario del pie SHALL ser un botón que abre un menú con el nombre y el correo del usuario y la opción "Cerrar sesión". El menú SHALL poder abrirse, recorrerse y cerrarse con teclado (Escape devuelve el foco al botón), en ambos temas y modos de la navegación.

#### Scenario: Abrir el menú
- **WHEN** el usuario activa el botón de usuario del pie
- **THEN** se abre un menú que muestra su nombre, su correo y la opción "Cerrar sesión", y el botón expone `aria-expanded="true"`

#### Scenario: Cerrar sesión desde el menú
- **WHEN** el usuario elige "Cerrar sesión" en el menú
- **THEN** se inicia el cierre de sesión en el proveedor de identidad

#### Scenario: Accesibilidad del menú
- **WHEN** se ejecuta AXE sobre el shell con el menú de usuario abierto, en tema claro y oscuro
- **THEN** no se reportan violaciones
