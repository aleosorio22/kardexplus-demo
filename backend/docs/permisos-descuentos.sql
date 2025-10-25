-- =====================================================
-- PERMISOS PARA MÓDULO DE DESCUENTOS
-- =====================================================

-- Insertar permisos del módulo Descuentos
INSERT INTO Security.Permisos (Permiso_Codigo, Permiso_Nombre, Permiso_Modulo, Permiso_Descripcion, Permiso_Estado)
VALUES 
    ('descuentos.ver', 'Ver Descuentos', 'Descuentos', 'Permite visualizar la lista de descuentos', 1),
    ('descuentos.crear', 'Crear Descuentos', 'Descuentos', 'Permite crear nuevos descuentos', 1),
    ('descuentos.editar', 'Editar Descuentos', 'Descuentos', 'Permite modificar descuentos existentes', 1),
    ('descuentos.eliminar', 'Eliminar Descuentos', 'Descuentos', 'Permite eliminar descuentos', 1),
    ('descuentos.activar_desactivar', 'Activar/Desactivar Descuentos', 'Descuentos', 'Permite cambiar el estado de los descuentos', 1),
    ('descuentos.ver_todos', 'Ver Todos los Descuentos', 'Descuentos', 'Permite ver todos los descuentos del sistema incluyendo inactivos', 1),
    ('descuentos.aplicar', 'Aplicar Descuentos', 'Descuentos', 'Permite aplicar descuentos en operaciones', 1);
GO

-- Asignar todos los permisos de descuentos al rol Administrador
DECLARE @AdminRolId INT;
DECLARE @PermisoId INT;

-- Obtener el ID del rol Administrador
SELECT @AdminRolId = Rol_Id FROM Security.Roles WHERE Rol_Nombre = 'Administrador';

-- Asignar cada permiso de descuentos al rol Administrador
DECLARE permiso_cursor CURSOR FOR
SELECT Permiso_Id FROM Security.Permisos WHERE Permiso_Modulo = 'Descuentos';

OPEN permiso_cursor;
FETCH NEXT FROM permiso_cursor INTO @PermisoId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Verificar si el permiso ya está asignado
    IF NOT EXISTS (SELECT 1 FROM Security.Roles_Permisos WHERE Rol_Id = @AdminRolId AND Permiso_Id = @PermisoId)
    BEGIN
        INSERT INTO Security.Roles_Permisos (Rol_Id, Permiso_Id)
        VALUES (@AdminRolId, @PermisoId);
    END
    
    FETCH NEXT FROM permiso_cursor INTO @PermisoId;
END

CLOSE permiso_cursor;
DEALLOCATE permiso_cursor;

PRINT 'Permisos del módulo Descuentos creados y asignados al rol Administrador exitosamente';
GO

-- Opcional: Asignar permisos básicos al rol Gerente
DECLARE @GerenteRolId INT;

SELECT @GerenteRolId = Rol_Id FROM Security.Roles WHERE Rol_Nombre = 'Gerente';

IF @GerenteRolId IS NOT NULL
BEGIN
    -- Gerente puede ver, crear, editar y aplicar descuentos
    INSERT INTO Security.Roles_Permisos (Rol_Id, Permiso_Id)
    SELECT @GerenteRolId, Permiso_Id
    FROM Security.Permisos
    WHERE Permiso_Codigo IN ('descuentos.ver', 'descuentos.crear', 'descuentos.editar', 'descuentos.aplicar')
    AND NOT EXISTS (
        SELECT 1 FROM Security.Roles_Permisos 
        WHERE Rol_Id = @GerenteRolId AND Permiso_Id = Security.Permisos.Permiso_Id
    );
    
    PRINT 'Permisos básicos de descuentos asignados al rol Gerente';
END
GO

-- Verificar permisos creados
SELECT 
    p.Permiso_Codigo,
    p.Permiso_Nombre,
    p.Permiso_Modulo,
    p.Permiso_Descripcion,
    r.Rol_Nombre
FROM Security.Permisos p
LEFT JOIN Security.Roles_Permisos rp ON p.Permiso_Id = rp.Permiso_Id
LEFT JOIN Security.Roles r ON rp.Rol_Id = r.Rol_Id
WHERE p.Permiso_Modulo = 'Descuentos'
ORDER BY p.Permiso_Codigo, r.Rol_Nombre;
GO
