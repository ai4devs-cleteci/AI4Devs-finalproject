# Spec Delta

## ADDED Requirements

### Requirement: Paleta de marca de Cleteci
La interfaz SHALL usar la paleta corporativa de Cleteci (https://cleteci.com/) en ambos temas: el azul de marca `#0161EF` como color primario de las acciones y estados destacados, una escala azul derivada de él cuyos tonos oscuros son los marinos `#001C63` y `#00174D`, y superficies neutras con tinte marino cuyo tono más oscuro es `#030620`. Ningún elemento de la aplicación SHALL conservar el primario esmeralda por defecto.

#### Scenario: Acción primaria en tema claro
- **WHEN** el usuario abre un formulario de colaborador en tema claro
- **THEN** el botón principal tiene fondo azul de marca `#0161EF` con texto blanco

#### Scenario: Entrada activa de la navegación
- **WHEN** el usuario está en `/colaboradores`
- **THEN** el resaltado de la entrada "Colaboradores" y el distintivo de la aplicación usan tonos de la escala azul de Cleteci, no verdes

#### Scenario: Superficies en tema oscuro
- **WHEN** el usuario activa el tema oscuro
- **THEN** el fondo de la aplicación y de la navegación usa las superficies marinas de la paleta, con `#030620` como tono más oscuro

#### Scenario: Pantalla de error de arranque
- **WHEN** el servidor de identidad no responde al arrancar y se muestra el aviso con "Reintentar"
- **THEN** el botón "Reintentar" usa el azul de marca de Cleteci

### Requirement: Contraste de la paleta de marca
Las combinaciones de color de la paleta de Cleteci usadas por la interfaz SHALL cumplir contraste WCAG 2.1 AA (4,5:1 para texto normal, 3:1 para texto grande, iconos y bordes de foco) en tema claro y oscuro.

#### Scenario: Texto atenuado en tema claro
- **WHEN** se muestra texto secundario (por ejemplo, el rol del usuario en el pie de la navegación) sobre la superficie clara
- **THEN** su contraste es al menos 4,5:1

#### Scenario: Acción primaria en tema oscuro
- **WHEN** el usuario ve un botón primario en tema oscuro
- **THEN** el contraste entre su texto y su fondo es al menos 4,5:1 y el foco visible contrasta al menos 3:1 con la superficie
