const express = require('express');
const router = express.Router();
const db = require('../../core/config/database');
const { authMiddleware, isAdmin } = require('../../core/middlewares/auth.middleware');
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();
const permisosTable = dialect === 'mssql' ? 'Security.Permisos' : 'Permisos';
const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';

// Endpoint temporal para configurar permisos (solo para desarrollo)
router.post('/setup-permissions', authMiddleware, isAdmin, async (req, res) => {
    try {
        // Verificar si las tablas de permisos ya existen
        let tableCheck;
        if (dialect === 'mssql') {
            [tableCheck] = await db.execute(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Security' AND TABLE_NAME = 'Permisos'"
            );
        } else {
            [tableCheck] = await db.execute(
                "SHOW TABLES LIKE 'Permisos'"
            );
        }

        if (tableCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Las tablas de permisos no existen. Ejecuta primero el script permisos.sql'
            });
        }

        // Verificar si ya hay permisos
        const [permissionsCheck] = await db.execute(
            `SELECT COUNT(*) as count FROM ${permisosTable}`
        );

        if (permissionsCheck[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Los permisos ya están configurados en la base de datos'
            });
        }

        // Ejecutar configuración de permisos básicos
        const permissionsSetup = `
            INSERT INTO ${permisosTable} (Permiso_Codigo, Permiso_Nombre, Permiso_Descripcion, Permiso_Modulo) VALUES
            ('usuarios.ver', 'Ver Usuarios', 'Permite ver la lista de usuarios y sus detalles', 'usuarios'),
            ('usuarios.crear', 'Crear Usuarios', 'Permite crear nuevos usuarios en el sistema', 'usuarios'),
            ('usuarios.editar', 'Editar Usuarios', 'Permite modificar información de usuarios existentes', 'usuarios'),
            ('usuarios.eliminar', 'Eliminar Usuarios', 'Permite eliminar usuarios del sistema', 'usuarios'),
            ('roles.ver', 'Ver Roles', 'Permite ver la lista de roles y sus detalles', 'roles'),
            ('roles.crear', 'Crear Roles', 'Permite crear nuevos roles en el sistema', 'roles'),
            ('roles.editar', 'Editar Roles', 'Permite modificar roles existentes', 'roles'),
            ('roles.eliminar', 'Eliminar Roles', 'Permite eliminar roles del sistema', 'roles'),
            ('roles.asignar_permisos', 'Asignar Permisos', 'Permite asignar y gestionar permisos de roles', 'roles')
        `;

        await db.execute(permissionsSetup);

        // Asignar permisos al administrador (ID 1)
        await db.execute(`
            INSERT INTO ${rolesPermisosTable} (Rol_Id, Permiso_Id)
            SELECT 1, Permiso_Id FROM ${permisosTable}
        `);

        res.json({
            success: true,
            message: 'Permisos configurados exitosamente'
        });

    } catch (error) {
        console.error('Error configurando permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error configurando permisos',
            error: error.message
        });
    }
});

// Endpoint para asignar permisos a un rol específico
router.post('/assign-permissions/:roleName', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { roleName } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Se debe proporcionar un array de códigos de permisos'
            });
        }

        // Obtener el ID del rol
        const [roleResult] = await db.execute(
            `SELECT Rol_Id FROM ${rolesTable} WHERE Rol_Nombre = ?`,
            [roleName]
        );

        if (roleResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Rol "${roleName}" no encontrado`
            });
        }

        const rolId = roleResult[0].Rol_Id;

        // Limpiar permisos existentes del rol
        await db.execute(
            `DELETE FROM ${rolesPermisosTable} WHERE Rol_Id = ?`,
            [rolId]
        );

        // Asignar nuevos permisos
        if (permissions.length > 0) {
            const placeholders = permissions.map(() => `(?, (SELECT Permiso_Id FROM ${permisosTable} WHERE Permiso_Codigo = ?))`).join(', ');
            const values = permissions.flatMap(permission => [rolId, permission]);
            
            await db.execute(
                `INSERT INTO ${rolesPermisosTable} (Rol_Id, Permiso_Id) VALUES ${placeholders}`,
                values
            );
        }

        res.json({
            success: true,
            message: `Permisos asignados exitosamente al rol "${roleName}"`,
            data: {
                roleName,
                permissionsAssigned: permissions.length
            }
        });

    } catch (error) {
        console.error('Error asignando permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error asignando permisos',
            error: error.message
        });
    }
});

// Endpoint para verificar el estado de los permisos
router.get('/check-permissions-status', authMiddleware, async (req, res) => {
    try {
        // Verificar si las tablas existen
        let permisosTableExists, rolesPermisosTableExists;
        if (dialect === 'mssql') {
            const [permisosCheck] = await db.execute(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Security' AND TABLE_NAME = 'Permisos'"
            );
            const [rolesPermisosCheck] = await db.execute(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Security' AND TABLE_NAME = 'Roles_Permisos'"
            );
            permisosTableExists = permisosCheck.length > 0;
            rolesPermisosTableExists = rolesPermisosCheck.length > 0;
        } else {
            const [permisosTable] = await db.execute("SHOW TABLES LIKE 'Permisos'");
            const [rolesPermisosTable] = await db.execute("SHOW TABLES LIKE 'Roles_Permisos'");
            permisosTableExists = permisosTable.length > 0;
            rolesPermisosTableExists = rolesPermisosTable.length > 0;
        }
        
        if (!permisosTableExists || !rolesPermisosTableExists) {
            return res.json({
                success: true,
                data: {
                    tablesExist: false,
                    message: 'Las tablas de permisos no existen'
                }
            });
        }

        // Contar permisos y asignaciones
        const [permissionsCount] = await db.execute(`SELECT COUNT(*) as count FROM ${permisosTable}`);
        const [assignmentsCount] = await db.execute(`SELECT COUNT(*) as count FROM ${rolesPermisosTable}`);
        
        // La función fn_usuario_tiene_permiso no existe en SQL Server (requiere conversión a stored procedure)
        // Por ahora la marcamos como no existente
        let functionExists = false;

        res.json({
            success: true,
            data: {
                tablesExist: true,
                permissionsCount: permissionsCount[0].count,
                assignmentsCount: assignmentsCount[0].count,
                functionExists,
                isConfigured: permissionsCount[0].count > 0
            }
        });

    } catch (error) {
        console.error('Error verificando estado de permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando estado',
            error: error.message
        });
    }
});

module.exports = router;
