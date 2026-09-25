> Detalla en esta sección los prompts principales utilizados durante la creación del proyecto, que justifiquen el uso de asistentes de código en todas las fases del ciclo de vida del desarrollo. Esperamos un máximo de 3 por sección, principalmente los de creación inicial o  los de corrección o adición de funcionalidades que consideres más relevantes.
Puedes añadir adicionalmente la conversación completa como link o archivo adjunto si así lo consideras

---

**Asistente utilizado:** Claude (Anthropic)

**Material de partida:** nueve documentos de especificación funcional producidos en el *discovery* del proyecto (módulos 1 a 7, 9 e índice ejecutivo de cierre), entregados como adjuntos al inicio de la conversación.

**Criterio de trabajo:** el asistente se usó como interlocutor técnico, no como generador de texto. Los prompts buscan deliberadamente el desacuerdo —"¿qué está mal en esto?", "¿me falta algo?"— porque el valor está en detectar huecos e inconsistencias en la especificación, no en reformular lo que ya está escrito. Varios hallazgos incorporados a la documentación final surgieron de esa dinámica: la contradicción entre módulos sobre el número de estados del colaborador, un campo declarado como crítico en un módulo e inexistente en otro, y una restricción de préstamos matemáticamente imposible de activar.

---

## Índice

1. [Descripción general del producto](#1-descripción-general-del-producto)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Especificación de la API](#4-especificación-de-la-api)
5. [Historias de usuario](#5-historias-de-usuario)
6. [Tickets de trabajo](#6-tickets-de-trabajo)
7. [Pull requests](#7-pull-requests)

---

## 1. Descripción general del producto

**Prompt 1:**

```
Adjunto los nueve documentos de especificación funcional del HRIS que estamos
construyendo para Cleteci, resultado de la fase de discovery.

Analízalos para iniciar el desarrollo de esta aplicación interna. Necesito saber:
por dónde debería comenzar, en qué fases, y qué orden tiene sentido.

No quiero un resumen de los documentos: quiero criterio. Si el orden que propone
la especificación no es el correcto para construir, dímelo y argumenta por qué.
```

> Este prompt produjo la discrepancia con el orden propuesto por el *discovery*, que marcaba el pipeline de selección como crítico para el día 1 y que se desplazó a un release posterior. También identificó la fecha límite dura del 1 de enero de 2027 como el ancla real de planificación del proyecto.

**Prompt 2:**

```
Quiero un PRD completo del sistema para alinear a Dirección.

Los documentos de discovery traen el detalle funcional pero no traen nada de
producto: no hay objetivos medibles, ni secuencia de entrega, ni riesgos.
Añade lo que falte y marca claramente qué es aportación tuya y qué viene de la
especificación, para que nadie confunda un supuesto con un acuerdo.

Organiza el alcance en épicas agrupadas por valor entregable, no por módulo.
```

**Prompt 3:**

```
Para el README del proyecto, redacta la sección de descripción general:
objetivo, características y funcionalidades principales, e instrucciones de
instalación.

Las instrucciones de instalación tienen que ser ejecutables de principio a fin
por alguien que clona el repositorio por primera vez: requisitos previos con
versiones, servicios de infraestructura en local, variables de entorno,
migraciones, datos de prueba y ejecución de tests.

El entorno local debe replicar los servicios gestionados de AWS con
contenedores, de forma que no haga falta ninguna cuenta en la nube para
desarrollar.
```

---

## 2. Arquitectura del Sistema

### **2.1. Diagrama de arquitectura:**

**Prompt 1:**

```
Propón la arquitectura del sistema partiendo de estos datos: ~55 usuarios,
48 colaboradores, operación en tres países, y un dominio con reglas de negocio
densas, datos con vigencia temporal y requisitos fuertes de confidencialidad.

Quiero que la decisión esté gobernada por el volumen real, no por lo que está
de moda. Si microservicios no se justifican aquí, dilo explícitamente.
```

**Prompt 2:**

```
Genera el diagrama de arquitectura en Mermaid, mostrando los contextos de
negocio, la capa transversal, la separación de esquemas de base de datos y los
servicios externos.

Destaca visualmente los componentes que tienen restricciones de seguridad
específicas.
```

**Prompt 3:**

```
La sección pide justificar la arquitectura elegida y también los sacrificios
que implica.

Escribe los déficits reales, no los de manual. Quiero leer qué se pierde con
esta decisión y qué pasaría si el proyecto creciera diez veces. Incluye también
la duplicación deliberada que estamos aceptando al no construir un motor
genérico de aprobaciones.
```

### **2.2. Descripción de componentes principales:**

**Prompt 1:**

```
Describe los componentes principales del sistema con la tecnología concreta de
cada uno y su responsabilidad.

El stack es: Spring Boot 4 sobre Java 25, Angular 22, Keycloak, PostgreSQL, y
despliegue en AWS con ECS para el backend y Amplify para el frontend.

Diferencia explícitamente la persistencia de escritura de la de lectura y
explica por qué no se resuelven igual.
```

**Prompt 2:**

```
Revisando el README: no veo en ninguna parte una referencia clara a Angular, y
Java debe ser 25, no 21.

Corrige la versión en todas sus apariciones y añade una tabla resumen del stack
completo al inicio de la sección de arquitectura, con una justificación breve de
las cuatro elecciones principales. Ahora mismo la información está repartida
entre un diagrama Mermaid y tablas de detalle, y si el diagrama no se renderiza,
el stack no se ve.
```

> Prompt de corrección. El asistente verificó las apariciones existentes antes de editar y aprovechó para eliminar una duplicación que la nueva sección había generado.

### **2.3. Descripción de alto nivel del proyecto y estructura de ficheros**

**Prompt 1:**

```
Propón la estructura de ficheros del backend siguiendo el patrón de slices
verticales: organización por contexto de negocio y, dentro de cada contexto, por
caso de uso. Sin capa Service transversal.

Muestra el detalle de un slice completo para que se entienda el patrón, y
explica la regla de colocación: qué lógica va en el agregado, qué va en la
política del slice y qué va directo a proyección de lectura.
```

**Prompt 2:**

```
Añade la estructura del frontend en Angular y explica por qué los módulos de
features se corresponden uno a uno con los contextos del backend.

Quiero que quede claro que no es simetría decorativa sino una decisión con
consecuencias prácticas.
```

### **2.4. Infraestructura y despliegue**

**Prompt 1:**

```
Diseña la infraestructura en AWS y documenta el proceso de despliegue.

Backend en ECS Fargate, frontend en Amplify Hosting, Keycloak como servicio
propio, PostgreSQL en RDS. Incluye diagrama en Mermaid con las subredes y el
flujo desde el push hasta producción.

Añade qué se verifica en cada paso de la integración continua y en qué punto se
aplican las migraciones de base de datos.
```

**Prompt 2:**

```
Con despliegue progresivo en ECS conviven brevemente dos versiones de la
aplicación contra el mismo esquema.

Documenta la regla de compatibilidad de migraciones que esto impone y cómo se
gestiona un cambio que rompa esa compatibilidad.
```

### **2.5. Seguridad**

**Prompt 1:**

```
La especificación funcional es literal en un punto: "el sistema bloquea el
acceso, no solo lo oculta". Además exige que un Delivery Manager no acceda a
datos de compensación bajo ninguna circunstancia, y que solo Administración vea
los datos bancarios, ni siquiera People & Talent.

Diseña cómo se cumple eso de forma estructural, no a base de condiciones
repetidas en cada consulta. Quiero que un error de programación no pueda filtrar
esos datos.
```

> De este prompt salió la decisión de aislar compensación y datos bancarios en esquemas separados con credenciales propias, que es la decisión de seguridad más relevante del proyecto.

**Prompt 2:**

```
Explica la diferencia entre filtrar por alcance en la consulta y filtrar el
resultado después de obtenerlo, y por qué en este sistema tiene que ser lo
primero.

Documenta también por qué auditamos las lecturas de datos confidenciales y no
solo las escrituras, que es lo habitual.
```

**Prompt 3:**

```
Completa la sección con las prácticas de seguridad estándar: inyección SQL,
validación de entrada, XSS, cifrado en tránsito y en reposo, gestión de
secretos, cabeceras y exposición de red.

Formato de tabla, con la implementación concreta de cada una. Sin relleno
genérico: si algo no aplica a este proyecto, no lo incluyas.
```

### **2.6. Tests**

**Prompt 1:**

```
Define la estrategia de pruebas concentrada donde está el riesgo real de este
sistema: las reglas de negocio y el control de acceso. No me interesa perseguir
un porcentaje de cobertura global.

Escribe ejemplos concretos de casos de prueba para el cálculo del balance anual,
el cálculo de días hábiles con feriados y la elegibilidad de una solicitud de
descanso, incluyendo los casos límite.
```

**Prompt 2:**

```
Añade dos bloques que normalmente se olvidan:

1. Pruebas de autorización que invoquen la API directamente, sin pasar por la
   interfaz, porque el requisito es que el servidor bloquee.
2. Pruebas de arquitectura que verifiquen automáticamente los límites entre
   contextos.

Explica por qué las pruebas de integración deben correr contra PostgreSQL real
con Testcontainers y no contra una base de datos en memoria.
```

> La respuesta señaló un motivo que no estaba contemplado: las restricciones de exclusión que impiden intervalos temporales solapados son específicas de PostgreSQL y una base de datos en memoria no las aplicaría, con lo que las pruebas pasarían mientras producción falla.

---

### 3. Modelo de Datos

**Prompt 1:**

```
¿Cómo ves el modelo de datos del Módulo 1, Registro del Colaborador?

La especificación organiza la ficha en cinco bloques. Dime si esos bloques
sirven como modelo de datos o si son otra cosa, y qué problemas tendría
traducirlos literalmente a tablas.
```

> La respuesta identificó que los bloques son una taxonomía de responsabilidad y de interfaz, no un modelo de datos, y señaló cinco problemas de fondo: campos calculados que no deben persistirse, la banda derivada del nivel, la imposibilidad de cumplir la matriz de accesos con datos bancarios en la tabla principal, el agrupamiento correcto de los historiales y la necesidad de historial también para el estado.

**Prompt 2:**

```
¿Con este modelo cubro todo el sistema o necesito un modelo por cada documento
de especificación?
```

> Pregunta de verificación de alcance. Estableció el criterio de clasificación que se aplicó después a todo el sistema: si más de un contexto lee una entidad, es del núcleo o es catálogo; si solo la lee su módulo, es del módulo. También detectó que el catálogo de tecnologías, ubicado en el módulo de skills, lo consume además el formulario de entrevista técnica del módulo de selección, por lo que es un catálogo compartido.

**Prompt 3:**

```
Genera el diagrama del modelo de datos en Mermaid con el máximo detalle que
permite la sintaxis: tipo de cada atributo, claves primarias y foráneas,
restricciones de unicidad y nulidad, y el esquema al que pertenece cada tabla.

Incluye el núcleo, el contexto de descanso y el de compensación.

Después, describe las entidades principales justificando las decisiones de
diseño: por qué la clave técnica está separada del identificador de negocio, por
qué no hay columnas calculadas, y cómo se garantiza en base de datos que no
existan intervalos temporales solapados. Muestra el SQL de esa restricción.
```

---

### 4. Especificación de la API

*No aplica en esta entrega.* La documentación de la API no formaba parte del alcance solicitado para esta fase.

---

### 5. Historias de Usuario

**Prompt 1:**

```
A partir de las épicas del PRD, genera el backlog de historias de usuario en
orden lógico de construcción, agrupadas por release.

Detalla con criterios de aceptación completos solo los releases que se van a
construir ahora. Para los posteriores, quédate en el título de la historia: hay
ocho decisiones de negocio abiertas y escribir criterios sobre supuestos
significa rehacerlos después.

Marca explícitamente qué historias están bloqueadas y por qué decisión.
```

**Prompt 2:**

```
Para el README, selecciona las tres historias de usuario más representativas y
redáctalas siguiendo buenas prácticas de producto.

Que las tres recorran el mismo hilo de valor —el que justifica económicamente el
proyecto— en lugar de ser tres historias sueltas.

Criterios de aceptación en Gherkin, cubriendo también los caminos de error y los
casos límite, no solo el camino feliz. Añade dependencias, prioridad y las
decisiones abiertas que afectan a cada una.
```

**Prompt 3:**

```
En la historia del registro de modificación de fechas: la especificación dice
que este es el mecanismo que cierra el gap de facturación.

Añade un escenario que verifique que no existe ninguna vía alternativa para
editar las fechas de una solicitud ya aprobada, en ningún rol. Si existe un
atajo, la funcionalidad no sirve.

Incluye también una nota de producto sobre el riesgo de adopción: el sistema
puede hacerlo técnicamente obligatorio, pero que el equipo deje de acordar
cambios por fuera es un cambio de comportamiento organizacional.
```

---

### 6. Tickets de Trabajo

**Prompt 1:**

```
Descompón las historias de los dos primeros releases en tickets de trabajo
técnicos.

Tipos: infraestructura, backend, frontend, base de datos y pruebas
transversales. Ningún ticket debe superar tres días de trabajo.

Incluye una definición de terminado común, específica de este proyecto y no
genérica, e identifica la ruta crítica.
```

**Prompt 2:**

```
Para el README necesito tres tickets con todo el detalle necesario para
desarrollarlos de inicio a fin: uno de base de datos, uno de backend y uno de
frontend, los tres implementando la misma historia de usuario.

Cada uno con: descripción, contexto técnico, alcance concreto de ficheros o
tablas, criterios técnicos de aceptación, definición de terminado, dependencias,
estimación y riesgos.

Incluye el SQL de las restricciones en el ticket de base de datos y la
estructura de tipos del resultado en el de backend.
```

**Prompt 3:**

```
En el ticket de frontend, añade dos cosas que suelen faltar:

1. Los estados de interfaz que hay que contemplar: carga, cálculo en curso,
   error de red con reintento, envío y confirmación.
2. Una restricción explícita de que el cliente no reimplemente el cálculo de
   días hábiles, porque duplicar esa lógica produciría divergencias en cuanto se
   añada un feriado.

Ten en cuenta que los colaboradores usan el sistema pocas veces al año, así que
la interfaz tiene que ser comprensible sin formación previa.
```

---

### 7. Pull Requests

*No aplica en esta entrega.* La sección corresponde a la fase de ejecución del desarrollo, posterior a esta documentación.
