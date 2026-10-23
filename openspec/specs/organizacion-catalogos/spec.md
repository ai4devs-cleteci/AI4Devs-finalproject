# organizacion-catalogos Specification

## Purpose

Proveer los catálogos de la estructura organizacional y de job architecture (unidades de producción, proyectos, roles, niveles con banda, trayectorias y países) que referencian los registros de colaborador, como datos de referencia de solo lectura cargados con el sistema.

## Requirements

### Requirement: Catálogos iniciales
El sistema SHALL incluir desde su instalación los catálogos de unidades de producción, proyectos, roles/cargos, niveles, trayectorias y países de residencia, con al menos una entrada activa en cada uno. Cada entrada SHALL tener un código estable y un nombre en español.

#### Scenario: Instalación nueva
- **WHEN** la aplicación arranca contra una base de datos vacía
- **THEN** los seis catálogos existen con sus entradas iniciales, entre ellas las unidades de producción "Assa Acsel", "Supernova" y "Corporativo"

#### Scenario: Códigos estables
- **WHEN** se consulta un catálogo en dos arranques sucesivos
- **THEN** cada entrada conserva el mismo código

### Requirement: Niveles y bandas
El catálogo de niveles SHALL contener los niveles N1 a N6, cada uno asociado a exactamente una banda A, B o C, de modo que la banda de un colaborador se pueda derivar de su nivel.

#### Scenario: Banda de un nivel
- **WHEN** se consulta el catálogo de niveles
- **THEN** devuelve N1 a N6 en orden y cada nivel indica su banda

### Requirement: Proyectos con Delivery Manager
Cada proyecto del catálogo SHALL indicar la unidad de producción a la que pertenece y SHALL poder indicar su Delivery Manager responsable (nombre y usuario del proveedor de identidad). Un proyecto sin Delivery Manager SHALL seguir siendo asignable.

#### Scenario: Proyecto con Delivery Manager
- **WHEN** se consulta el catálogo de proyectos en el entorno local
- **THEN** al menos un proyecto tiene como Delivery Manager al usuario `dm@cleteci.local`

### Requirement: Consulta de catálogos
La API SHALL exponer cada catálogo en `GET /api/v1/catalogos/{catalogo}` (`unidades-produccion`, `proyectos`, `roles`, `niveles`, `trayectorias`, `paises`) a cualquier usuario autenticado con un rol del HRIS, devolviendo solo las entradas activas ordenadas por nombre (los niveles, por su orden N1–N6). Un catálogo desconocido SHALL responder `404`.

#### Scenario: Consultar unidades de producción
- **WHEN** `dm@cleteci.local` llama a `GET /api/v1/catalogos/unidades-produccion`
- **THEN** recibe `200` con un objeto cuyo campo `items` lista código y nombre de cada unidad activa

#### Scenario: Entradas inactivas
- **WHEN** una entrada de un catálogo está marcada como inactiva
- **THEN** no aparece en la consulta del catálogo, pero los colaboradores que ya la referencian siguen mostrándola

#### Scenario: Catálogo inexistente
- **WHEN** se llama a `GET /api/v1/catalogos/monedas`
- **THEN** la respuesta es `404`

### Requirement: Catálogos de solo lectura
Los catálogos SHALL modificarse solo mediante versiones del sistema (migraciones), no desde la API ni la interfaz.

#### Scenario: Intento de escritura
- **WHEN** cualquier usuario envía `POST /api/v1/catalogos/proyectos`
- **THEN** la respuesta es `405` o `403` y el catálogo no cambia
