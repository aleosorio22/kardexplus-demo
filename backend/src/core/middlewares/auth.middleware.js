const jwt = require('jsonwebtoken');
const UserModel = require('../../modules/users/user.model');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar formato del header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'Formato de token inválido' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar si el usuario existe y está activo
            const user = await UserModel.findById(decoded.id);
            if (!user) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Usuario no encontrado' 
                });
            }
            
            // Verificar estado (compatible con BIT de SQL Server y TINYINT de MySQL)
            if (!user.Usuario_Estado || user.Usuario_Estado === 0) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Usuario inactivo' 
                });
            }

            // Agregar información del usuario al request
            req.user = {
                id: decoded.id,
                correo: decoded.correo,
                rol: decoded.rol
            };
            
            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                success: false,
                message: 'Token inválido o expirado',
                error: jwtError.message 
            });
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error en la autenticación',
            error: error.message 
        });
    }
};

// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'Administrador') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado: se requiere rol de administrador' 
        });
    }
};

// Middleware para verificar roles específicos
const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.rol)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
            });
        }
    };
};

// Middleware para verificar permisos específicos
const hasPermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Obtener dialect y tablas según el motor de BD
            const dialect = process.env.DB_DIALECT || 'mysql';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const permisosTable = dialect === 'mssql' ? 'Security.Permisos' : 'Permisos';
            const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';

            // Verificar permiso usando JOIN (compatible con MySQL y SQL Server)
            const [rows] = await db.execute(
                `SELECT COUNT(*) as tiene_permiso
                FROM ${usuariosTable} u
                INNER JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id
                INNER JOIN ${rolesPermisosTable} rp ON r.Rol_Id = rp.Rol_Id
                INNER JOIN ${permisosTable} p ON rp.Permiso_Id = p.Permiso_Id
                WHERE u.Usuario_Id = ? AND p.Permiso_Codigo = ?`,
                [req.user.id, permissionCode]
            );

            if (rows[0].tiene_permiso > 0) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Se requiere el permiso: ${permissionCode}`
                });
            }
        } catch (error) {
            console.error('Error verificando permisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al verificar permisos',
                error: error.message
            });
        }
    };
};

// Middleware para verificar múltiples permisos (requiere todos)
const hasAllPermissions = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Obtener dialect y tablas según el motor de BD
            const dialect = process.env.DB_DIALECT || 'mysql';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const permisosTable = dialect === 'mssql' ? 'Security.Permisos' : 'Permisos';
            const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';

            // Verificar todos los permisos
            const permissionChecks = await Promise.all(
                permissionCodes.map(async (permissionCode) => {
                    const [rows] = await db.execute(
                        `SELECT COUNT(*) as tiene_permiso
                        FROM ${usuariosTable} u
                        INNER JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id
                        INNER JOIN ${rolesPermisosTable} rp ON r.Rol_Id = rp.Rol_Id
                        INNER JOIN ${permisosTable} p ON rp.Permiso_Id = p.Permiso_Id
                        WHERE u.Usuario_Id = ? AND p.Permiso_Codigo = ?`,
                        [req.user.id, permissionCode]
                    );
                    return { code: permissionCode, hasPermission: rows[0].tiene_permiso > 0 };
                })
            );

            const missingPermissions = permissionChecks
                .filter(check => !check.hasPermission)
                .map(check => check.code);

            if (missingPermissions.length === 0) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Se requieren los permisos: ${missingPermissions.join(', ')}`
                });
            }
        } catch (error) {
            console.error('Error verificando permisos múltiples:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al verificar permisos',
                error: error.message
            });
        }
    };
};

// Middleware para verificar múltiples permisos (requiere al menos uno)
const hasAnyPermission = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Obtener dialect y tablas según el motor de BD
            const dialect = process.env.DB_DIALECT || 'mysql';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const permisosTable = dialect === 'mssql' ? 'Security.Permisos' : 'Permisos';
            const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';

            // Verificar si tiene al menos uno de los permisos
            for (const permissionCode of permissionCodes) {
                const [rows] = await db.execute(
                    `SELECT COUNT(*) as tiene_permiso
                    FROM ${usuariosTable} u
                    INNER JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id
                    INNER JOIN ${rolesPermisosTable} rp ON r.Rol_Id = rp.Rol_Id
                    INNER JOIN ${permisosTable} p ON rp.Permiso_Id = p.Permiso_Id
                    WHERE u.Usuario_Id = ? AND p.Permiso_Codigo = ?`,
                    [req.user.id, permissionCode]
                );
                
                if (rows[0].tiene_permiso > 0) {
                    return next();
                }
            }

            res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere al menos uno de los permisos: ${permissionCodes.join(', ')}`
            });
        } catch (error) {
            console.error('Error verificando permisos alternativos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al verificar permisos',
                error: error.message
            });
        }
    };
};

module.exports = {
    authMiddleware,
    isAdmin,
    hasRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission
};
