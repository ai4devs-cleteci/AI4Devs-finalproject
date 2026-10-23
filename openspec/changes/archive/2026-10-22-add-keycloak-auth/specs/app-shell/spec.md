# Spec Delta

## ADDED Requirements

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
