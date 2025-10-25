const db = require('../../core/config/database');
const bcrypt = require('bcrypt');
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();

class UserModel {
    /**
     * Crea un nuevo usuario en la base de datos
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<number>} - ID del usuario creado
     */
    static async create(userData) {
        const { Usuario_Nombre, Usuario_Apellido, Usuario_Correo, Usuario_Contrasena, Rol_Id } = userData;
        
        // Verificar si el correo ya existe (schema Security en SQL Server)
        const usersTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
        const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';

        const [existingUser] = await db.execute(
            `SELECT Usuario_Id FROM ${usersTable} WHERE Usuario_Correo = ?`,
            [Usuario_Correo]
        );
        
        if (existingUser.length > 0) {
            throw new Error('El correo ya está registrado');
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(Usuario_Contrasena, 12);

        let insertResult;
        if (dialect === 'mssql') {
            // Usar OUTPUT para devolver el id insertado (incluir Usuario_Estado explícitamente)
            const insertQuery = `INSERT INTO ${usersTable} (Usuario_Nombre, Usuario_Apellido, Usuario_Correo, Usuario_Contrasena, Rol_Id, Usuario_Estado) OUTPUT INSERTED.Usuario_Id AS insertId VALUES (?, ?, ?, ?, ?, 1)`;
            const [rows, meta] = await db.execute(insertQuery, [Usuario_Nombre, Usuario_Apellido, Usuario_Correo, hashedPassword, Rol_Id]);
            insertResult = rows?.[0]?.insertId;
        } else {
            const [result] = await db.execute(
                'INSERT INTO Usuarios (Usuario_Nombre, Usuario_Apellido, Usuario_Correo, Usuario_Contrasena, Rol_Id) VALUES (?, ?, ?, ?, ?)',
                [Usuario_Nombre, Usuario_Apellido, Usuario_Correo, hashedPassword, Rol_Id]
            );
            insertResult = result.insertId;
        }

        return insertResult;
    }

    /**
     * Busca un usuario por correo electrónico
     * @param {string} email - Correo electrónico del usuario
     * @returns {Promise<Object|undefined>} - Usuario encontrado o undefined
     */
    static async findByEmail(email) {
        const usersTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
        const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';

        const [users] = await db.execute(`
            SELECT u.*, r.Rol_Nombre, r.Rol_Descripcion
            FROM ${usersTable} u 
            LEFT JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id 
            WHERE u.Usuario_Correo = ? AND u.Usuario_Estado = 1
        `, [email]);
        return users[0];
    }

    /**
     * Busca un usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|undefined>} - Usuario encontrado o undefined
     */
    static async findById(id) {
        const usersTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
        const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';

        const [users] = await db.execute(`
            SELECT u.*, r.Rol_Nombre, r.Rol_Descripcion
            FROM ${usersTable} u 
            LEFT JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id 
            WHERE u.Usuario_Id = ? AND u.Usuario_Estado = 1
        `, [id]);
        return users[0];
    }

    /**
     * Verifica si una contraseña coincide con el hash
     * @param {string} plainPassword - Contraseña en texto plano
     * @param {string} hashedPassword - Contraseña hasheada
     * @returns {Promise<boolean>} - true si coincide, false si no
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Verifica si ya existe un usuario administrador
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async adminExists() {
        const usersTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
        const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';

        const [admins] = await db.execute(`
            SELECT u.Usuario_Id 
            FROM ${usersTable} u 
            JOIN ${rolesTable} r ON u.Rol_Id = r.Rol_Id 
            WHERE r.Rol_Nombre = 'Administrador' AND u.Usuario_Estado = 1
        `);
        return admins.length > 0;
    }

    /**
     * Obtiene el ID de un rol por su nombre
     * @param {string} roleName - Nombre del rol
     * @returns {Promise<number|undefined>} - ID del rol o undefined
     */
    static async getRoleIdByName(roleName) {
        const rolesTable = dialect === 'mssql' ? 'Security.Roles' : 'Roles';
        const [roles] = await db.execute(
            `SELECT Rol_Id FROM ${rolesTable} WHERE Rol_Nombre = ?`,
            [roleName]
        );
        return roles[0]?.Rol_Id;
    }
}

module.exports = UserModel;
