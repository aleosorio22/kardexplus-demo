-- =============================================
-- Script: Permisos para Módulo de Reportes
-- Descripción: Crea los permisos necesarios para el módulo de reportes
-- Fecha: 2024-10-25
-- =============================================

USE DevSolutions;
GO

-- Insertar permisos para el módulo de Reportes
PRINT 'Insertando permisos para módulo de Reportes...';

-- Permiso: Ver Reportes
IF NOT EXISTS (SELECT 1 FROM Security.Permisos WHERE Permiso_Codigo = 'reportes.ver')
BEGIN
    INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo)
    VALUES ('reportes.ver', 'Ver Reportes', 'Permite ver y generar reportes de inventario', 'reportes');
    PRINT 'Permiso "reportes.ver" creado';
END
ELSE
BEGIN
    PRINT 'Permiso "reportes.ver" ya existe';
END
GO

-- Permiso: Exportar Reportes
IF NOT EXISTS (SELECT 1 FROM Security.Permisos WHERE Permiso_Codigo = 'reportes.exportar')
BEGIN
    INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo)
    VALUES ('reportes.exportar', 'Exportar Reportes', 'Permite exportar reportes a Excel y PDF', 'reportes');
    PRINT 'Permiso "reportes.exportar" creado';
END
ELSE
BEGIN
    PRINT 'Permiso "reportes.exportar" ya existe';
END
GO

-- Permiso: Reportes de Inventario
IF NOT EXISTS (SELECT 1 FROM Security.Permisos WHERE Permiso_Codigo = 'reportes.inventario')
BEGIN
    INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo)
    VALUES ('reportes.inventario', 'Reportes de Inventario', 'Permite generar reportes de inventario actual', 'reportes');
    PRINT 'Permiso "reportes.inventario" creado';
END
ELSE
BEGIN
    PRINT 'Permiso "reportes.inventario" ya existe';
END
GO

-- Permiso: Reportes de Valorización
IF NOT EXISTS (SELECT 1 FROM Security.Permisos WHERE Permiso_Codigo = 'reportes.valorizacion')
BEGIN
    INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo)
    VALUES ('reportes.valorizacion', 'Reportes de Valorización', 'Permite ver reportes de valorización y márgenes', 'reportes');
    PRINT 'Permiso "reportes.valorizacion" creado';
END
ELSE
BEGIN
    PRINT 'Permiso "reportes.valorizacion" ya existe';
END
GO

-- Permiso: Reportes de Stock Bajo
IF NOT EXISTS (SELECT 1 FROM Security.Permisos WHERE Permiso_Codigo = 'reportes.stock_bajo')
BEGIN
    INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo)
    VALUES ('reportes.stock_bajo', 'Reportes de Stock Bajo', 'Permite ver reportes de items con stock bajo', 'reportes');
    PRINT 'Permiso "reportes.stock_bajo" creado';
END
ELSE
BEGIN
    PRINT 'Permiso "reportes.stock_bajo" ya existe';
END
GO

PRINT 'Permisos de reportes procesados exitosamente';
GO

-- Asignar permisos al rol Administrador
PRINT 'Asignando permisos de reportes al rol Administrador...';

DECLARE @AdminRolId INT;
SELECT @AdminRolId = Rol_Id FROM Security.Roles WHERE Rol_Nombre = 'Administrador';

IF @AdminRolId IS NOT NULL
BEGIN
    -- Obtener todos los permisos de reportes
    DECLARE @PermisoId INT;
    DECLARE permiso_cursor CURSOR FOR
    SELECT Permiso_Id FROM Security.Permisos WHERE Permiso_Modulo = 'reportes';

    OPEN permiso_cursor;
    FETCH NEXT FROM permiso_cursor INTO @PermisoId;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Verificar si el permiso ya está asignado
        IF NOT EXISTS (SELECT 1 FROM Security.Roles_Permisos 
                       WHERE Rol_Id = @AdminRolId AND Permiso_Id = @PermisoId)
        BEGIN
            INSERT INTO Security.Roles_Permisos (Rol_Id, Permiso_Id)
            VALUES (@AdminRolId, @PermisoId);
            PRINT 'Permiso ID ' + CAST(@PermisoId AS VARCHAR) + ' asignado al rol Administrador';
        END
        ELSE
        BEGIN
            PRINT 'Permiso ID ' + CAST(@PermisoId AS VARCHAR) + ' ya está asignado al rol Administrador';
        END

        FETCH NEXT FROM permiso_cursor INTO @PermisoId;
    END

    CLOSE permiso_cursor;
    DEALLOCATE permiso_cursor;

    PRINT 'Permisos de reportes asignados al Administrador exitosamente';
END
ELSE
BEGIN
    PRINT 'ERROR: No se encontró el rol Administrador';
END
GO

-- Asignar permisos básicos al rol Gerente
PRINT 'Asignando permisos básicos de reportes al rol Gerente...';

DECLARE @GerenteRolId INT;
SELECT @GerenteRolId = Rol_Id FROM Security.Roles WHERE Rol_Nombre = 'Gerente';

IF @GerenteRolId IS NOT NULL
BEGIN
    -- Asignar solo permisos de visualización y exportación
    INSERT INTO Security.Roles_Permisos (Rol_Id, Permiso_Id)
    SELECT @GerenteRolId, Permiso_Id
    FROM Security.Permisos
    WHERE Permiso_Modulo = 'reportes'
    AND Permiso_Codigo IN ('reportes.ver', 'reportes.exportar', 'reportes.inventario', 'reportes.stock_bajo')
    AND NOT EXISTS (
        SELECT 1 FROM Security.Roles_Permisos
        WHERE Rol_Id = @GerenteRolId AND Permiso_Id = Security.Permisos.Permiso_Id
    );

    PRINT 'Permisos básicos de reportes asignados al Gerente exitosamente';
END
ELSE
BEGIN
    PRINT 'ADVERTENCIA: No se encontró el rol Gerente';
END
GO

-- Verificar permisos creados
PRINT '';
PRINT '=== VERIFICACIÓN DE PERMISOS CREADOS ===';
SELECT 
    p.Permiso_Id,
    p.Permiso_Codigo,
    p.Permiso_Nombre,
    p.Permiso_Descripcion,
    p.Permiso_Modulo,
    p.Permiso_Estado
FROM Security.Permisos p
WHERE p.Permiso_Modulo = 'reportes'
ORDER BY p.Permiso_Codigo;

PRINT '';
PRINT '=== PERMISOS ASIGNADOS AL ROL ADMINISTRADOR ===';
SELECT 
    r.Rol_Nombre,
    p.Permiso_Codigo,
    p.Permiso_Nombre,
    p.Permiso_Descripcion
FROM Security.Roles_Permisos rp
INNER JOIN Security.Roles r ON rp.Rol_Id = r.Rol_Id
INNER JOIN Security.Permisos p ON rp.Permiso_Id = p.Permiso_Id
WHERE r.Rol_Nombre = 'Administrador'
AND p.Permiso_Modulo = 'reportes'
ORDER BY p.Permiso_Codigo;

PRINT '';
PRINT '=== PERMISOS ASIGNADOS AL ROL GERENTE ===';
SELECT 
    r.Rol_Nombre,
    p.Permiso_Codigo,
    p.Permiso_Nombre,
    p.Permiso_Descripcion
FROM Security.Roles_Permisos rp
INNER JOIN Security.Roles r ON rp.Rol_Id = r.Rol_Id
INNER JOIN Security.Permisos p ON rp.Permiso_Id = p.Permiso_Id
WHERE r.Rol_Nombre = 'Gerente'
AND p.Permiso_Modulo = 'reportes'
ORDER BY p.Permiso_Codigo;

PRINT '';
PRINT 'Script ejecutado exitosamente';
GO
