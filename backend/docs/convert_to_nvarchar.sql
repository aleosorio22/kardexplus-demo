-- Script para convertir columnas VARCHAR a NVARCHAR en SQL Server
-- Esto soluciona problemas de codificación con caracteres especiales (tildes, ñ, etc.)
-- Fecha: 2025-10-24

USE DevSolutions;
GO

-- TABLA: Security.Roles
PRINT 'Actualizando Security.Roles...';
-- Rol_Descripcion no tiene constraints, se puede cambiar directamente
ALTER TABLE Security.Roles ALTER COLUMN Rol_Descripcion NVARCHAR(100) NULL;
PRINT 'Rol_Descripcion actualizado a NVARCHAR(100)';
GO

-- TABLA: Security.Permisos  
PRINT 'Actualizando Security.Permisos...';
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Nombre NVARCHAR(100) NOT NULL;
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Modulo NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Permisos ALTER COLUMN Permiso_Descripcion NVARCHAR(255) NULL;
PRINT 'Permisos actualizado a NVARCHAR';
GO

-- TABLA: Security.Usuarios
PRINT 'Actualizando Security.Usuarios...';
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Nombre NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Apellido NVARCHAR(50) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Correo NVARCHAR(100) NOT NULL;
ALTER TABLE Security.Usuarios ALTER COLUMN Usuario_Contrasena NVARCHAR(255) NOT NULL;
PRINT 'Usuarios actualizado a NVARCHAR';
GO

PRINT 'Conversión completada exitosamente';
GO

-- Verificar los cambios
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'Security'
    AND DATA_TYPE IN ('varchar', 'nvarchar', 'char', 'nchar')
ORDER BY TABLE_NAME, COLUMN_NAME;
GO
