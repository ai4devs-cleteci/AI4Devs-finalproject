# colaborador-registro Specification

## Purpose

Mantener el registro maestro de cada colaborador de Cleteci —identidad, posición y contrato, y los datos que el sistema deriva de ellos— que el resto de módulos del HRIS referencia, con acceso a cada operación según el rol del usuario.

## Requirements

### Requirement: Identificador del colaborador
Cada registro SHALL recibir al crearse un ID generado por el sistema: un número correlativo creciente representado con 5 dígitos con ceros a la izquierda, empezando en `00001`, sin prefijos. El ID SHALL ser inmutable, no SHALL reutilizarse aunque el registro se elimine y no SHALL poder fijarlo quien llama a la API.

#### Scenario: Primer colaborador
- **WHEN** P&T da de alta el primer colaborador en una instalación nueva
- **THEN** el registro recibe el ID `00001`

#### Scenario: Altas sucesivas
- **WHEN** existe el colaborador `00007` y P&T da de alta otro
- **THEN** el nuevo registro recibe un ID mayor que `00007` con 5 dígitos

#### Scenario: ID enviado por el cliente
- **WHEN** la petición de alta o de edición incluye un campo `id`
- **THEN** se ignora y el ID lo asigna o conserva el sistema

#### Scenario: ID de un registro eliminado
- **WHEN** se elimina el colaborador `00010`, que era el último, y se da de alta otro
- **THEN** el nuevo registro no recibe `00010`

### Requirement: Alta del colaborador
Solo People & Talent SHALL poder dar de alta colaboradores. El alta SHALL rechazarse con `400` y la lista de campos faltantes si no incluye todos los obligatorios: nombre completo, nombre corto, tipo de documento (Cédula o Pasaporte), documento de identidad, correo personal, teléfono de contacto, fecha de ingreso, rol, nivel, unidad de producción, modalidad (Honorarios profesionales o Nómina) y país de residencia.

#### Scenario: Alta completa
- **WHEN** `pyt@cleteci.local` envía `POST /api/v1/colaboradores` con todos los campos obligatorios válidos
- **THEN** la respuesta es `201` con la cabecera `Location` del nuevo registro y el cuerpo con su ID, estado y campos derivados

#### Scenario: Faltan campos obligatorios
- **WHEN** P&T envía el alta sin documento de identidad ni fecha de ingreso
- **THEN** la respuesta es `400`, se indican ambos campos y no se crea ningún registro ni se consume un ID visible

#### Scenario: Alta por otro rol
- **WHEN** `direccion@cleteci.local` o `dm@cleteci.local` envía `POST /api/v1/colaboradores`
- **THEN** la respuesta es `403`

### Requirement: Campos opcionales de identidad y posición
El registro SHALL admitir, sin exigirlos, fecha de nacimiento, género (Femenino, Masculino, No binario, Prefiere no decirlo), nacionalidad, trayectoria y proyecto asignado.

#### Scenario: Alta sin opcionales
- **WHEN** P&T da de alta un colaborador sin fecha de nacimiento, género, nacionalidad, trayectoria ni proyecto
- **THEN** el registro se crea y esos campos quedan vacíos

### Requirement: Validación de formato
El sistema SHALL rechazar con `400` un correo personal que no sea una dirección de email válida, un teléfono que no esté en formato internacional (`+` y código de país seguido de 7 a 15 dígitos en total), una fecha de nacimiento futura, textos vacíos o compuestos solo de espacios en campos obligatorios, y valores de lista o catálogo que no existan o estén inactivos.

#### Scenario: Teléfono sin código de país
- **WHEN** P&T envía el teléfono `04121234567`
- **THEN** la respuesta es `400` indicando que el teléfono debe incluir el código de país, p. ej. `+584121234567`

#### Scenario: Nivel inexistente
- **WHEN** P&T envía el nivel `N9`
- **THEN** la respuesta es `400` indicando que el nivel no es válido

#### Scenario: Fecha de nacimiento futura
- **WHEN** P&T envía una fecha de nacimiento posterior a hoy
- **THEN** la respuesta es `400`

### Requirement: Documento de identidad único
No SHALL existir dos colaboradores con el mismo tipo y número de documento. La comparación SHALL ignorar mayúsculas, espacios, puntos y guiones. Un alta o edición que genere un duplicado SHALL responder `409` indicando el ID del colaborador que ya lo tiene.

#### Scenario: Documento repetido
- **WHEN** existe `00003` con Cédula `V-12.345.678` y P&T da de alta otro con Cédula `v12345678`
- **THEN** la respuesta es `409` y menciona al colaborador `00003`

#### Scenario: Mismo número con otro tipo
- **WHEN** existe un colaborador con Cédula `12345678` y P&T da de alta otro con Pasaporte `12345678`
- **THEN** el alta se acepta

### Requirement: Estado contractual inicial
El estado contractual SHALL tener uno de los valores "En onboarding / Período de prueba", "Activo" o "Egresado" y lo SHALL controlar el sistema: todo registro nuevo SHALL nacer en "En onboarding / Período de prueba" y ni el alta ni la edición SHALL poder fijarlo o cambiarlo.

#### Scenario: Estado al alta
- **WHEN** P&T da de alta un colaborador
- **THEN** su estado es "En onboarding / Período de prueba"

#### Scenario: Intento de cambiar el estado editando
- **WHEN** P&T envía una edición con el estado "Activo"
- **THEN** el estado no cambia

### Requirement: Banda derivada del nivel
La banda (A, B o C) SHALL calcularse a partir del nivel del colaborador según el catálogo de niveles y no SHALL poder fijarse directamente. Al cambiar el nivel, la banda SHALL reflejar el nuevo valor.

#### Scenario: Cambio de nivel
- **WHEN** P&T cambia el nivel de un colaborador a uno de banda distinta
- **THEN** la ficha del colaborador muestra la banda del nuevo nivel

### Requirement: Línea de reporte derivada del proyecto
"Reporta a" SHALL calcularse como el Delivery Manager del proyecto asignado. Si el colaborador no tiene proyecto o el proyecto no tiene Delivery Manager, "Reporta a" SHALL quedar vacío.

#### Scenario: Colaborador con proyecto
- **WHEN** un colaborador está asignado a un proyecto cuyo Delivery Manager es `dm@cleteci.local`
- **THEN** su "Reporta a" muestra el nombre de ese Delivery Manager

#### Scenario: Sin proyecto
- **WHEN** un colaborador no tiene proyecto asignado
- **THEN** su "Reporta a" está vacío y su ficha indica que no tiene proyecto asignado

### Requirement: Antigüedad
La antigüedad SHALL calcularse en cada lectura en años y meses completos desde la fecha de ingreso hasta la fecha actual. Si la fecha de ingreso es futura, la antigüedad SHALL ser 0 años y 0 meses.

#### Scenario: Antigüedad de un año y medio
- **WHEN** la fecha de ingreso es 2025-04-15 y hoy es 2026-10-22
- **THEN** la antigüedad es 1 año y 6 meses

#### Scenario: Ingreso futuro
- **WHEN** la fecha de ingreso es posterior a hoy
- **THEN** la antigüedad es 0 años y 0 meses

### Requirement: Elegibilidades calculadas
El sistema SHALL calcular en cada lectura: elegibilidad de salary review (antigüedad ≥ 1 año), de préstamo (antigüedad ≥ 6 meses y sin préstamo activo) y de descanso remunerado. Mientras el estado sea "En onboarding / Período de prueba", las tres SHALL ser no elegibles, indicando el motivo.

#### Scenario: En período de prueba
- **WHEN** un colaborador en "En onboarding / Período de prueba" tiene 2 años de antigüedad
- **THEN** no es elegible a salary review, préstamo ni descanso remunerado y el motivo indicado es el período de prueba

#### Scenario: Activo con poca antigüedad
- **WHEN** un colaborador "Activo" tiene 8 meses de antigüedad y ningún préstamo activo
- **THEN** es elegible a préstamo y descanso remunerado y no a salary review, cuyo motivo es la antigüedad menor de 1 año

### Requirement: Consulta del listado
`GET /api/v1/colaboradores` SHALL devolver una página de colaboradores (por defecto 20, máximo 100) con ID, nombre corto, nombre completo, rol, unidad de producción, proyecto, estado y fecha de ingreso, ordenable por ID, nombre o fecha de ingreso. SHALL admitir búsqueda de texto por ID, nombre o documento y filtros por unidad de producción, proyecto y estado.

#### Scenario: Primera página
- **WHEN** P&T pide el listado sin parámetros y existen 45 colaboradores
- **THEN** recibe 20 elementos ordenados por ID y el total de 45

#### Scenario: Búsqueda por nombre
- **WHEN** P&T busca `pérez`
- **THEN** recibe los colaboradores cuyo nombre completo o corto contiene "Pérez", sin distinguir mayúsculas ni acentos

#### Scenario: Filtro por unidad
- **WHEN** P&T filtra por la unidad "Supernova"
- **THEN** solo recibe colaboradores de esa unidad

### Requirement: Consulta de la ficha
`GET /api/v1/colaboradores/{id}` SHALL devolver todos los campos de los bloques de identidad y posición, los campos derivados (banda, reporta a) y los calculados (antigüedad y elegibilidades), con los nombres legibles de los valores de catálogo.

#### Scenario: Ficha existente
- **WHEN** P&T pide `GET /api/v1/colaboradores/00001`
- **THEN** recibe `200` con los datos del colaborador `00001`, incluida su banda, antigüedad y elegibilidades

#### Scenario: Ficha inexistente
- **WHEN** P&T pide un ID que no existe
- **THEN** la respuesta es `404`

### Requirement: Visibilidad por rol
People & Talent, Dirección y Administración SHALL ver todos los colaboradores. El Delivery Manager SHALL ver solo a los colaboradores asignados a proyectos de los que es Delivery Manager. El rol Colaborador y los usuarios sin rol del HRIS no SHALL acceder al registro.

#### Scenario: Delivery Manager ve a su equipo
- **WHEN** `dm@cleteci.local` pide el listado
- **THEN** solo recibe colaboradores de sus proyectos

#### Scenario: Delivery Manager pide una ficha ajena
- **WHEN** `dm@cleteci.local` pide la ficha de un colaborador de un proyecto que no es suyo o sin proyecto
- **THEN** la respuesta es `404`

#### Scenario: Colaborador
- **WHEN** `colaborador@cleteci.local` pide el listado o una ficha
- **THEN** la respuesta es `403`

### Requirement: Edición por People & Talent
P&T SHALL poder modificar con `PUT /api/v1/colaboradores/{id}` los campos de identidad y posición con las mismas validaciones del alta, salvo el ID, el estado y los campos derivados y calculados. El proyecto asignado solo SHALL poder fijarlo P&T al alta o si el colaborador no tiene proyecto. Otros roles SHALL recibir `403`.

#### Scenario: Edición válida
- **WHEN** P&T cambia el rol y el teléfono de `00001`
- **THEN** la respuesta es `200` con los datos actualizados y el ID sigue siendo `00001`

#### Scenario: P&T cambia un proyecto ya asignado
- **WHEN** P&T envía una edición que cambia el proyecto de un colaborador que ya tiene uno
- **THEN** la respuesta es `403` indicando que el cambio de proyecto corresponde al Delivery Manager, y no se aplica ningún cambio

#### Scenario: Edición por Dirección
- **WHEN** `direccion@cleteci.local` envía `PUT /api/v1/colaboradores/00001`
- **THEN** la respuesta es `403`

### Requirement: Cambio de proyecto por el Delivery Manager
El Delivery Manager SHALL poder cambiar con `PATCH /api/v1/colaboradores/{id}/proyecto` el proyecto de un colaborador de su equipo a otro proyecto propio, o dejarlo sin proyecto. No SHALL poder asignarlo a un proyecto de otro Delivery Manager.

#### Scenario: Cambio entre proyectos propios
- **WHEN** `dm@cleteci.local` mueve a un colaborador de uno de sus proyectos a otro también suyo
- **THEN** la respuesta es `200` y "Reporta a" sigue siendo él

#### Scenario: Proyecto ajeno
- **WHEN** `dm@cleteci.local` intenta asignar a un colaborador de su equipo a un proyecto de otro Delivery Manager
- **THEN** la respuesta es `403` y el proyecto no cambia

### Requirement: Edición concurrente
Las ediciones SHALL indicar la versión del registro que se leyó. Si el registro cambió desde entonces, la edición SHALL rechazarse con `409` sin aplicar cambios.

#### Scenario: Dos ediciones simultáneas
- **WHEN** dos usuarios de P&T abren la misma ficha y ambos guardan cambios
- **THEN** el primero se guarda y el segundo recibe `409` indicando que el registro fue modificado por otra persona

### Requirement: Eliminación de altas erróneas
Solo P&T SHALL poder eliminar un registro con `DELETE /api/v1/colaboradores/{id}`, que lo borra definitivamente (`204`) para corregir altas erróneas; la salida de la organización es un egreso, no una eliminación. Otros roles SHALL recibir `403`.

#### Scenario: Eliminar un alta errónea
- **WHEN** P&T elimina `00012`
- **THEN** la respuesta es `204` y `GET /api/v1/colaboradores/00012` responde `404`

#### Scenario: Eliminación por Administración
- **WHEN** `admin@cleteci.local` envía `DELETE /api/v1/colaboradores/00012`
- **THEN** la respuesta es `403` y el registro sigue existiendo

### Requirement: Pantalla de listado
La entrada "Colaboradores" (`/colaboradores`) SHALL mostrar el listado como tabla paginada con búsqueda, filtros por unidad, proyecto y estado, y orden por columna. Cada fila SHALL enlazar a la ficha. El botón "Nuevo colaborador" SHALL mostrarse solo a P&T.

#### Scenario: P&T abre el listado
- **WHEN** `pyt@cleteci.local` abre `/colaboradores`
- **THEN** ve la tabla con el ID de 5 dígitos, nombre, rol, unidad, proyecto, estado y fecha de ingreso, y el botón "Nuevo colaborador"

#### Scenario: Dirección abre el listado
- **WHEN** `direccion@cleteci.local` abre `/colaboradores`
- **THEN** ve la tabla sin el botón "Nuevo colaborador"

#### Scenario: Listado vacío
- **WHEN** no hay colaboradores que coincidan con la búsqueda o los filtros
- **THEN** la tabla muestra un mensaje indicando que no hay resultados

#### Scenario: Rol sin acceso
- **WHEN** `colaborador@cleteci.local` abre `/colaboradores`
- **THEN** ve un mensaje de que no tiene acceso a este módulo en lugar de la tabla

### Requirement: Pantalla de ficha
`/colaboradores/{id}` SHALL mostrar los datos del colaborador en pestañas "Identidad", "Posición y contrato" y "Datos calculados" (abierta la primera), con las acciones permitidas al usuario: "Editar" y "Eliminar" para P&T, y "Cambiar proyecto" para el Delivery Manager. Eliminar SHALL pedir confirmación.

#### Scenario: Cambiar de pestaña
- **WHEN** el usuario abre la ficha y activa la pestaña "Datos calculados", con el ratón o con las flechas del teclado
- **THEN** ve la antigüedad y las elegibilidades, y la pestaña queda marcada como seleccionada

#### Scenario: P&T elimina desde la ficha
- **WHEN** P&T pulsa "Eliminar" en la ficha y confirma
- **THEN** el registro se elimina, vuelve al listado y ve un aviso de que se eliminó

#### Scenario: Cancelar la eliminación
- **WHEN** P&T pulsa "Eliminar" y cancela la confirmación
- **THEN** el registro sigue existiendo y la ficha permanece abierta

#### Scenario: Delivery Manager en la ficha
- **WHEN** `dm@cleteci.local` abre la ficha de un colaborador de su equipo
- **THEN** ve "Cambiar proyecto" y no ve "Editar" ni "Eliminar"

#### Scenario: Ficha inexistente
- **WHEN** el usuario abre `/colaboradores/99999`
- **THEN** ve un mensaje de que el colaborador no existe con un enlace al listado

### Requirement: Formulario de alta y edición
`/colaboradores/nuevo` y `/colaboradores/{id}/editar` SHALL mostrar un formulario con los campos de identidad y posición, marcando los obligatorios, con listas desplegables alimentadas por los catálogos. SHALL validar en el cliente las mismas reglas que la API, mostrar el error de un campo solo al salir de él tras modificarlo o al intentar guardar, y mostrar junto a cada campo los errores que devuelva la API.

#### Scenario: Guardar un alta
- **WHEN** P&T completa los campos obligatorios y pulsa "Guardar"
- **THEN** se crea el colaborador, se abre su ficha con el ID asignado y se muestra un aviso de confirmación

#### Scenario: Pasar por un campo sin modificarlo
- **WHEN** P&T recorre con Tab campos obligatorios vacíos sin escribir en ellos
- **THEN** ninguno muestra error hasta que intente guardar

#### Scenario: Salir de un campo modificado no válido
- **WHEN** P&T escribe `0412` en el teléfono y sale del campo
- **THEN** solo el teléfono muestra su error, que desaparece en cuanto el valor es válido

#### Scenario: Campos obligatorios vacíos
- **WHEN** P&T pulsa "Guardar" con campos obligatorios vacíos
- **THEN** no se envía la petición, cada campo vacío muestra su error y el foco va al primero

#### Scenario: Documento duplicado
- **WHEN** la API responde `409` por documento duplicado
- **THEN** el campo de documento muestra el error con el ID del colaborador que ya lo tiene y los datos introducidos se conservan

#### Scenario: Conflicto de edición
- **WHEN** la API responde `409` por edición concurrente
- **THEN** el formulario avisa de que el registro cambió y ofrece recargar los datos actuales

#### Scenario: Acceso directo sin permiso
- **WHEN** `direccion@cleteci.local` abre `/colaboradores/nuevo`
- **THEN** no ve el formulario y se le indica que no tiene permiso para esta acción

### Requirement: Accesibilidad de las pantallas de colaboradores
El listado, la ficha, el formulario y los diálogos de colaboradores SHALL pasar la auditoría automática AXE y cumplir WCAG 2.1 AA en tema claro y oscuro: etiquetas asociadas a cada campo, errores anunciados a tecnologías de asistencia y operación completa con teclado.

#### Scenario: Auditoría del formulario con errores
- **WHEN** se ejecuta AXE sobre el formulario tras intentar guardar con campos vacíos
- **THEN** no hay violaciones y cada error está asociado a su campo

#### Scenario: Uso con teclado
- **WHEN** el usuario recorre el listado, abre una ficha y la elimina solo con teclado
- **THEN** puede completar todas las acciones y el foco vuelve a un elemento lógico tras cerrar el diálogo
