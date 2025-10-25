-- Script para insertar Roles y Permisos en SQL Server (DevSolutions)
-- Migrado desde MySQL kardexplus_db
-- Fecha: 2025-10-24

USE DevSolutions;
GO

-- ========================================
-- INSERTAR ROLES
-- ========================================
SET IDENTITY_INSERT Security.Roles ON;
GO

INSERT INTO Security.Roles (Rol_Id, Rol_Nombre, Rol_Descripcion) VALUES
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Gerente', 'Gestión de inventario y reportes'),
(3, 'Operador', 'Operaciones básicas de inventario'),
(4, 'Consulta', 'Solo lectura de información'),
(5, 'Test Rol', 'Test');
GO

SET IDENTITY_INSERT Security.Roles OFF;
GO

PRINT 'Roles insertados correctamente';
GO

-- ========================================
-- INSERTAR PERMISOS
-- ========================================
SET IDENTITY_INSERT Security.Permisos ON;
GO

INSERT INTO Security.Permisos (Permiso_Id, Permiso_Codigo, Permiso_Nombre, Permiso_Modulo, Permiso_Descripcion, Permiso_Estado) VALUES
-- Dashboard
(1, 'dashboard.ver', 'Ver Dashboard', 'dashboard', 'Acceso al panel principal del sistema', 1),

-- Usuarios
(2, 'usuarios.ver', 'Ver Usuarios', 'usuarios', 'Visualizar lista de usuarios del sistema', 1),
(3, 'usuarios.crear', 'Crear Usuarios', 'usuarios', 'Crear nuevos usuarios en el sistema', 1),
(4, 'usuarios.editar', 'Editar Usuarios', 'usuarios', 'Modificar información de usuarios existentes', 1),
(5, 'usuarios.eliminar', 'Eliminar Usuarios', 'usuarios', 'Eliminar usuarios del sistema', 1),
(6, 'usuarios.cambiar_estado', 'Cambiar Estado Usuario', 'usuarios', 'Activar o desactivar usuarios', 1),
(7, 'usuarios.resetear_password', 'Resetear Contraseña', 'usuarios', 'Resetear contraseñas de usuarios', 1),

-- Roles
(8, 'roles.ver', 'Ver Roles', 'roles', 'Visualizar roles del sistema', 1),
(9, 'roles.crear', 'Crear Roles', 'roles', 'Crear nuevos roles', 1),
(10, 'roles.editar', 'Editar Roles', 'roles', 'Modificar roles existentes', 1),
(11, 'roles.eliminar', 'Eliminar Roles', 'roles', 'Eliminar roles del sistema', 1),
(12, 'roles.asignar_permisos', 'Asignar Permisos', 'roles', 'Gestionar permisos de roles', 1),

-- Items
(13, 'items.ver', 'Ver Items', 'items', 'Visualizar catálogo de items', 1),
(14, 'items.crear', 'Crear Items', 'items', 'Crear nuevos items en el catálogo', 1),
(15, 'items.editar', 'Editar Items', 'items', 'Modificar items existentes', 1),
(16, 'items.eliminar', 'Eliminar Items', 'items', 'Eliminar items del catálogo', 1),
(17, 'items.ver_costos', 'Ver Costos Items', 'items', 'Visualizar información de costos', 1),
(18, 'items.editar_costos', 'Editar Costos Items', 'items', 'Modificar costos de items', 1),

-- Categorías
(19, 'categorias.ver', 'Ver Categorías', 'categorias', 'Visualizar categorías de items', 1),
(20, 'categorias.crear', 'Crear Categorías', 'categorias', 'Crear nuevas categorías', 1),
(21, 'categorias.editar', 'Editar Categorías', 'categorias', 'Modificar categorías existentes', 1),
(22, 'categorias.eliminar', 'Eliminar Categorías', 'categorias', 'Eliminar categorías', 1),

-- Bodegas
(23, 'bodegas.ver', 'Ver Bodegas', 'bodegas', 'Visualizar lista de bodegas', 1),
(24, 'bodegas.crear', 'Crear Bodegas', 'bodegas', 'Crear nuevas bodegas', 1),
(25, 'bodegas.editar', 'Editar Bodegas', 'bodegas', 'Modificar bodegas existentes', 1),
(26, 'bodegas.eliminar', 'Eliminar Bodegas', 'bodegas', 'Eliminar bodegas', 1),

-- Inventario
(27, 'inventario.ver', 'Ver Inventario', 'inventario', 'Visualizar existencias por bodega', 1),
(28, 'inventario.ver_todas_bodegas', 'Ver Inventario Todas Bodegas', 'inventario', 'Ver inventario de todas las bodegas', 1),
(29, 'inventario.ajustar', 'Ajustar Inventario', 'inventario', 'Realizar ajustes de inventario', 1),

-- Movimientos
(30, 'movimientos.ver', 'Ver Movimientos', 'movimientos', 'Visualizar historial de movimientos', 1),
(31, 'movimientos.crear_entrada', 'Crear Entradas', 'movimientos', 'Registrar entradas de mercancía', 1),
(32, 'movimientos.crear_salida', 'Crear Salidas', 'movimientos', 'Registrar salidas de mercancía', 1),
(33, 'movimientos.crear_transferencia', 'Crear Transferencias', 'movimientos', 'Realizar transferencias entre bodegas', 1),
(34, 'movimientos.aprobar', 'Aprobar Movimientos', 'movimientos', 'Aprobar movimientos pendientes', 1),
(52, 'movimientos.crear_ajuste', 'Crear ajustes', 'movimientos', 'Permite crear ajuste de existentcias', 1),

-- Compras
(35, 'compras.ver', 'Ver Compras', 'compras', 'Visualizar historial de compras', 1),
(36, 'compras.crear', 'Crear Compras', 'compras', 'Registrar nuevas compras', 1),
(37, 'compras.editar', 'Editar Compras', 'compras', 'Modificar compras existentes', 1),
(38, 'compras.anular', 'Anular Compras', 'compras', 'Anular compras registradas', 1),
(39, 'compras.aprobar', 'Aprobar Compras', 'compras', 'Aprobar solicitudes de compra', 1),

-- Proveedores
(40, 'proveedores.ver', 'Ver Proveedores', 'proveedores', 'Visualizar lista de proveedores', 1),
(41, 'proveedores.crear', 'Crear Proveedores', 'proveedores', 'Registrar nuevos proveedores', 1),
(42, 'proveedores.editar', 'Editar Proveedores', 'proveedores', 'Modificar proveedores existentes', 1),
(43, 'proveedores.eliminar', 'Eliminar Proveedores', 'proveedores', 'Eliminar proveedores', 1),

-- Reportes
(44, 'reportes.inventario', 'Reportes Inventario', 'reportes', 'Generar reportes de inventario', 1),
(45, 'reportes.movimientos', 'Reportes Movimientos', 'reportes', 'Generar reportes de movimientos', 1),
(46, 'reportes.compras', 'Reportes Compras', 'reportes', 'Generar reportes de compras', 1),
(47, 'reportes.kardex', 'Reportes Kardex', 'reportes', 'Generar reportes kardex por item', 1),
(48, 'reportes.auditoria', 'Reportes Auditoría', 'reportes', 'Acceso a reportes de auditoría', 1),

-- Configuración
(49, 'configuracion.ver', 'Ver Configuración', 'configuracion', 'Acceso a configuraciones del sistema', 1),
(50, 'configuracion.editar', 'Editar Configuración', 'configuracion', 'Modificar configuraciones del sistema', 1),

-- Auditoría
(51, 'auditoria.ver', 'Ver Auditoría', 'auditoria', 'Visualizar logs de auditoría del sistema', 1),

-- Requerimientos
(53, 'requerimientos.ver', 'Ver Requerimientos', 'requerimientos', 'Permite ver requerimientos propios y relacionados', 1),
(54, 'requerimientos.ver_todos', 'Ver Todos los Requerimientos', 'requerimientos', 'Permite ver todos los requerimientos del sistema', 1),
(55, 'requerimientos.crear', 'Crear Requerimientos', 'requerimientos', 'Permite crear nuevos requerimientos entre bodegas', 1),
(56, 'requerimientos.editar', 'Editar Requerimientos', 'requerimientos', 'Permite modificar requerimientos pendientes', 1),
(57, 'requerimientos.cancelar', 'Cancelar Requerimientos', 'requerimientos', 'Permite cancelar requerimientos propios', 1),
(58, 'requerimientos.cancelar_otros', 'Cancelar Requerimientos de Otros', 'requerimientos', 'Permite cancelar requerimientos de otros usuarios', 1),
(59, 'requerimientos.aprobar', 'Aprobar Requerimientos', 'requerimientos', 'Permite aprobar o rechazar requerimientos', 1),
(60, 'requerimientos.despachar', 'Despachar Requerimientos', 'requerimientos', 'Permite marcar requerimientos como despachados', 1),
(61, 'requerimientos.recibir', 'Recibir Requerimientos', 'requerimientos', 'Permite confirmar recepción de requerimientos', 1),
(62, 'requerimientos.eliminar', 'Eliminar Requerimientos', 'requerimientos', 'Permite eliminar requerimientos del sistema', 1),
(63, 'requerimientos.reportes', 'Reportes de Requerimientos', 'requerimientos', 'Permite generar reportes de requerimientos', 1);
GO

SET IDENTITY_INSERT Security.Permisos OFF;
GO

PRINT 'Permisos insertados correctamente';
GO

-- Verificación de la inserción
SELECT COUNT(*) AS Total_Roles FROM Security.Roles;
SELECT COUNT(*) AS Total_Permisos FROM Security.Permisos;
GO

PRINT 'Script completado exitosamente';
GO
