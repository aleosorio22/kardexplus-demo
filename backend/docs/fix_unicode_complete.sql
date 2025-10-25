-- Script completo para convertir todas las columnas VARCHAR a NVARCHAR en SQL Server
-- Esto soluciona definitivamente los problemas de codificación con caracteres especiales
-- Fecha: 2025-10-24

USE DevSolutions;
GO

PRINT '========================================';
PRINT 'INICIANDO CONVERSIÓN VARCHAR -> NVARCHAR';
PRINT '========================================';
GO

-- ============================================
-- TABLA: Security.Roles
-- ============================================
PRINT '';
PRINT 'Procesando Security.Roles...';

-- Eliminar constraints que dependen de Rol_Nombre
ALTER TABLE Security.Roles DROP CONSTRAINT IF EXISTS UQ_Roles_Nombre;
ALTER TABLE Security.Roles DROP CONSTRAINT IF EXISTS CHK_Rol_Nombre_No_Vacio;
GO

-- Convertir columnas
ALTER TABLE Security.Roles ALTER COLUMN Rol_Nombre NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Roles ALTER COLUMN Rol_Descripcion NVARCHAR(100) NULL;
GO

-- Recrear constraints
ALTER TABLE Security.Roles ADD CONSTRAINT UQ_Roles_Nombre UNIQUE (Rol_Nombre);
ALTER TABLE Security.Roles ADD CONSTRAINT CHK_Rol_Nombre_No_Vacio CHECK (LEN(LTRIM(RTRIM(Rol_Nombre))) > 0);
GO

PRINT '✓ Security.Roles convertido';
GO

-- ============================================
-- TABLA: Security.Permisos
-- ============================================
PRINT '';
PRINT 'Procesando Security.Permisos...';

-- Eliminar constraints
ALTER TABLE Security.Permisos DROP CONSTRAINT IF EXISTS UQ_Permisos_Codigo;
ALTER TABLE Security.Permisos DROP CONSTRAINT IF EXISTS CHK_Permiso_Codigo_No_Vacio;
ALTER TABLE Security.Permisos DROP CONSTRAINT IF EXISTS CHK_Permiso_Nombre_No_Vacio;
GO

-- Convertir columnas
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Codigo NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Nombre NVARCHAR(100) NOT NULL;
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Modulo NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Descripcion NVARCHAR(255) NULL;
GO

-- Recrear constraints
ALTER TABLE Security.Permisos ADD CONSTRAINT UQ_Permisos_Codigo UNIQUE (Permiso_Codigo);
ALTER TABLE Security.Permisos ADD CONSTRAINT CHK_Permiso_Codigo_No_Vacio CHECK (LEN(LTRIM(RTRIM(Permiso_Codigo))) > 0);
ALTER TABLE Security.Permisos ADD CONSTRAINT CHK_Permiso_Nombre_No_Vacio CHECK (LEN(LTRIM(RTRIM(Permiso_Nombre))) > 0);
GO

PRINT '✓ Security.Permisos convertido';
GO

-- ============================================
-- TABLA: Security.Usuarios
-- ============================================
PRINT '';
PRINT 'Procesando Security.Usuarios...';

-- Eliminar constraints
ALTER TABLE Security.Usuarios DROP CONSTRAINT IF EXISTS UQ_Usuarios_Correo;
ALTER TABLE Security.Usuarios DROP CONSTRAINT IF EXISTS CHK_Usuario_Nombre_No_Vacio;
ALTER TABLE Security.Usuarios DROP CONSTRAINT IF EXISTS CHK_Usuario_Apellido_No_Vacio;
ALTER TABLE Security.Usuarios DROP CONSTRAINT IF EXISTS CHK_Usuario_Correo_Formato;
GO

-- Convertir columnas
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Nombre NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Apellido NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Correo NVARCHAR(100) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Contrasena NVARCHAR(255) NOT NULL;
GO

-- Recrear constraints
ALTER TABLE Security.Usuarios ADD CONSTRAINT UQ_Usuarios_Correo UNIQUE (Usuario_Correo);
ALTER TABLE Security.Usuarios ADD CONSTRAINT CHK_Usuario_Nombre_No_Vacio CHECK (LEN(LTRIM(RTRIM(Usuario_Nombre))) > 0);
ALTER TABLE Security.Usuarios ADD CONSTRAINT CHK_Usuario_Apellido_No_Vacio CHECK (LEN(LTRIM(RTRIM(Usuario_Apellido))) > 0);
ALTER TABLE Security.Usuarios ADD CONSTRAINT CHK_Usuario_Correo_Formato CHECK (Usuario_Correo LIKE '%_@_%.__%');
GO

PRINT '✓ Security.Usuarios convertido';
GO

-- ============================================
-- ACTUALIZAR DATOS EXISTENTES A UNICODE
-- ============================================
PRINT '';
PRINT 'Actualizando datos existentes con Unicode correcto...';

-- Roles
UPDATE Security.Roles SET Rol_Descripcion = N'Acceso completo al sistema' WHERE Rol_Id = 1;
UPDATE Security.Roles SET Rol_Descripcion = N'Gestión de inventario y reportes' WHERE Rol_Id = 2;
UPDATE Security.Roles SET Rol_Descripcion = N'Operaciones básicas de inventario' WHERE Rol_Id = 3;
UPDATE Security.Roles SET Rol_Descripcion = N'Solo lectura de información' WHERE Rol_Id = 4;
GO

-- Permisos (actualizar los que tengan caracteres especiales)
UPDATE Security.Permisos SET Permiso_Nombre = N'Eliminar Categorías' WHERE Permiso_Codigo = 'categorias.eliminar';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Eliminar categorías del sistema' WHERE Permiso_Codigo = 'categorias.eliminar';
UPDATE Security.Permisos SET Permiso_Nombre = N'Editar Categorías' WHERE Permiso_Codigo = 'categorias.editar';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Modificar información de categorías' WHERE Permiso_Codigo = 'categorias.editar';
UPDATE Security.Permisos SET Permiso_Nombre = N'Crear Categorías' WHERE Permiso_Codigo = 'categorias.crear';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Crear nuevas categorías' WHERE Permiso_Codigo = 'categorias.crear';
UPDATE Security.Permisos SET Permiso_Nombre = N'Ver Categorías' WHERE Permiso_Codigo = 'categorias.ver';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Visualizar lista de categorías' WHERE Permiso_Codigo = 'categorias.ver';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Resetear contraseñas de usuarios' WHERE Permiso_Codigo = 'usuarios.resetear_password';
UPDATE Security.Permisos SET Permiso_Nombre = N'Resetear Contraseña' WHERE Permiso_Codigo = 'usuarios.resetear_password';
UPDATE Security.Permisos SET Permiso_Nombre = N'Configurar Parámetros Stock' WHERE Permiso_Codigo = 'configuracion.parametros_stock';
UPDATE Security.Permisos SET Permiso_Descripcion = N'Configurar parámetros de control de stock' WHERE Permiso_Codigo = 'configuracion.parametros_stock';
GO

PRINT '✓ Datos actualizados con Unicode';
GO

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN DE CONVERSIÓN';
PRINT '========================================';

SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    CASE 
        WHEN DATA_TYPE = 'nvarchar' THEN '✓ Unicode'
        WHEN DATA_TYPE = 'varchar' THEN '✗ Legacy'
        ELSE DATA_TYPE
    END AS Status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'Security'
    AND DATA_TYPE IN ('varchar', 'nvarchar')
ORDER BY TABLE_NAME, COLUMN_NAME;
GO

PRINT '';
PRINT '========================================';
PRINT 'CONVERSIÓN COMPLETADA EXITOSAMENTE';
PRINT '========================================';
GO
