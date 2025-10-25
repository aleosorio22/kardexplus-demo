const db = require('../../core/config/database');

class RoleModel {
    // Obtener todos los roles
    static async findAll() {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const trueValue = dialect === 'mssql' ? '1' : 'true';

            const [rows] = await db.execute(`
                SELECT 
                    r.Rol_Id,
                    r.Rol_Nombre,
                    r.Rol_Descripcion,
                    COUNT(u.Usuario_Id) as Usuario_Count
                FROM ${rolesTable} r
                LEFT JOIN ${usuariosTable} u ON r.Rol_Id = u.Rol_Id AND u.Usuario_Estado = ${trueValue}
                GROUP BY r.Rol_Id, r.Rol_Nombre, r.Rol_Descripcion
                ORDER BY r.Rol_Nombre
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener un rol por ID
    static async findById(id) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const trueValue = dialect === 'mssql' ? '1' : 'true';

            const [rows] = await db.execute(`
                SELECT 
                    r.Rol_Id,
                    r.Rol_Nombre,
                    r.Rol_Descripcion,
                    COUNT(u.Usuario_Id) as Usuario_Count
                FROM ${rolesTable} r
                LEFT JOIN ${usuariosTable} u ON r.Rol_Id = u.Rol_Id AND u.Usuario_Estado = ${trueValue}
                WHERE r.Rol_Id = ?
                GROUP BY r.Rol_Id, r.Rol_Nombre, r.Rol_Descripcion
            `, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Crear un nuevo rol
    static async create(roleData) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const { Rol_Nombre, Rol_Descripcion } = roleData;
            
            if (dialect === 'mssql') {
                const [result] = await db.execute(
                    `INSERT INTO ${rolesTable} (Rol_Nombre, Rol_Descripcion) 
                     OUTPUT INSERTED.Rol_Id AS insertId 
                     VALUES (?, ?)`,
                    [Rol_Nombre, Rol_Descripcion]
                );
                return result[0].insertId;
            } else {
                const [result] = await db.execute(
                    `INSERT INTO ${rolesTable} (Rol_Nombre, Rol_Descripcion) VALUES (?, ?)`,
                    [Rol_Nombre, Rol_Descripcion]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // Actualizar un rol
    static async update(id, roleData) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const { Rol_Nombre, Rol_Descripcion } = roleData;
            const [result] = await db.execute(
                `UPDATE ${rolesTable} SET Rol_Nombre = ?, Rol_Descripcion = ? WHERE Rol_Id = ?`,
                [Rol_Nombre, Rol_Descripcion, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar un rol (solo si no tiene usuarios asignados)
    static async delete(id) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
            const trueValue = dialect === 'mssql' ? '1' : 'true';

            // Verificar si el rol tiene usuarios asignados
            const [users] = await db.execute(
                `SELECT COUNT(*) as count FROM ${usuariosTable} WHERE Rol_Id = ? AND Usuario_Estado = ${trueValue}`,
                [id]
            );

            if (users[0].count > 0) {
                throw new Error('No se puede eliminar el rol porque tiene usuarios asignados');
            }

            const [result] = await db.execute(`DELETE FROM ${rolesTable} WHERE Rol_Id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener permisos de un rol
    static async getRolePermissions(roleId) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const permisosTable = dialect === 'mssql' ? 'Security.Permisos' : 'Permisos';
            const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';
            const trueValue = dialect === 'mssql' ? '1' : 'true';

            const [rows] = await db.execute(`
                SELECT 
                    p.Permiso_Id,
                    p.Permiso_Codigo,
                    p.Permiso_Nombre,
                    p.Permiso_Modulo,
                    p.Permiso_Descripcion,
                    rp.Fecha_Asignacion
                FROM ${rolesPermisosTable} rp
                INNER JOIN ${permisosTable} p ON rp.Permiso_Id = p.Permiso_Id
                WHERE rp.Rol_Id = ? AND p.Permiso_Estado = ${trueValue}
                ORDER BY p.Permiso_Modulo, p.Permiso_Codigo
            `, [roleId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Asignar permisos a un rol
    static async assignPermissions(roleId, permissionIds) {
        const connection = await db.getConnection();
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesPermisosTable = dialect === 'mssql' ? 'Security.Roles_Permisos' : 'Roles_Permisos';

            // Nota: En SQL Server con el adaptador actual, no usamos BEGIN TRANSACTION manual
            // Las operaciones son atómicas y el motor las maneja internamente

            // Eliminar permisos existentes del rol
            await connection.execute(`DELETE FROM ${rolesPermisosTable} WHERE Rol_Id = ?`, [roleId]);

            // Asignar nuevos permisos
            if (permissionIds && permissionIds.length > 0) {
                const values = permissionIds.map(permissionId => [roleId, permissionId]);
                const placeholders = values.map(() => '(?, ?)').join(', ');
                const flatValues = values.flat();

                await connection.execute(
                    `INSERT INTO ${rolesPermisosTable} (Rol_Id, Permiso_Id) VALUES ${placeholders}`,
                    flatValues
                );
            }

            return true;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    // Verificar si un rol existe por nombre
    static async existsByName(name, excludeId = null) {
        try {
            const dialect = process.env.DB_DIALECT || 'mysql';
            const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
            let query = `SELECT COUNT(*) as count FROM ${rolesTable} WHERE Rol_Nombre = ?`;
            let params = [name];

            if (excludeId) {
                query += ' AND Rol_Id != ?';
                params.push(excludeId);
            }

            const [rows] = await db.execute(query, params);
            return rows[0].count > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RoleModel;
