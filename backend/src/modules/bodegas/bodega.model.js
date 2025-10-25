const db = require('../../core/config/database');

// Detectar el dialecto de la base de datos
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';

// Nombres de tablas según el dialecto
const bodegasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Bodegas' : 'Bodegas';
const usuariosTable = DB_DIALECT === 'mssql' ? 'Security.Usuarios' : 'Usuarios';

class BodegaModel {
    /**
     * Crea una nueva bodega en la base de datos
     * @param {Object} bodegaData - Datos de la bodega
     * @returns {Promise<number>} - ID de la bodega creada
     */
    static async create(bodegaData) {
        const {
            Bodega_Nombre,
            Bodega_Tipo,
            Bodega_Ubicacion,
            Responsable_Id,
            Bodega_Estado
        } = bodegaData;

        // Verificar duplicados
        if (await this.existsByName(Bodega_Nombre)) {
            throw new Error('Ya existe una bodega con ese nombre');
        }

        let query, result;

        if (DB_DIALECT === 'mssql') {
            query = `
                INSERT INTO ${bodegasTable} (
                    Bodega_Nombre,
                    Bodega_Tipo,
                    Bodega_Ubicacion,
                    Responsable_Id,
                    Bodega_Estado
                )
                OUTPUT INSERTED.Bodega_Id
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [rows] = await db.execute(query, [
                Bodega_Nombre,
                Bodega_Tipo || null,
                Bodega_Ubicacion || null,
                Responsable_Id || null,
                Bodega_Estado !== undefined ? (Bodega_Estado ? 1 : 0) : 1
            ]);
            
            return rows[0].Bodega_Id;
        } else {
            query = `
                INSERT INTO ${bodegasTable} (
                    Bodega_Nombre,
                    Bodega_Tipo,
                    Bodega_Ubicacion,
                    Responsable_Id,
                    Bodega_Estado
                ) VALUES (?, ?, ?, ?, ?)
            `;
            
            const [resultSet] = await db.execute(query, [
                Bodega_Nombre,
                Bodega_Tipo || null,
                Bodega_Ubicacion || null,
                Responsable_Id || null,
                Bodega_Estado !== undefined ? (Bodega_Estado ? 1 : 0) : 1
            ]);
            
            return resultSet.insertId;
        }
    }

    /**
     * Obtiene todas las bodegas
     * @returns {Promise<Array>} - Array de bodegas
     */
    static async findAll() {
        const query = `
            SELECT 
                b.Bodega_Id,
                b.Bodega_Nombre,
                b.Bodega_Tipo,
                b.Bodega_Ubicacion,
                b.Bodega_Estado,
                b.Responsable_Id,
                CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Responsable_Nombre,
                u.Usuario_Correo as Responsable_Correo
            FROM ${bodegasTable} b
            LEFT JOIN ${usuariosTable} u ON b.Responsable_Id = u.Usuario_Id
            ORDER BY b.Bodega_Nombre ASC
        `;
        
        const [bodegas] = await db.execute(query);
        return bodegas;
    }

    /**
     * Busca una bodega por ID
     * @param {number} id - ID de la bodega
     * @returns {Promise<Object|undefined>} - Bodega encontrada o undefined
     */
    static async findById(id) {
        const query = `
            SELECT 
                b.Bodega_Id,
                b.Bodega_Nombre,
                b.Bodega_Tipo,
                b.Bodega_Ubicacion,
                b.Bodega_Estado,
                b.Responsable_Id,
                CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Responsable_Nombre,
                u.Usuario_Correo as Responsable_Correo
            FROM ${bodegasTable} b
            LEFT JOIN ${usuariosTable} u ON b.Responsable_Id = u.Usuario_Id
            WHERE b.Bodega_Id = ?
        `;
        
        const [bodegas] = await db.execute(query, [id]);
        return bodegas[0];
    }

    /**
     * Actualiza una bodega
     * @param {number} id - ID de la bodega
     * @param {Object} bodegaData - Datos actualizados
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async update(id, bodegaData) {
        const {
            Bodega_Nombre,
            Bodega_Tipo,
            Bodega_Ubicacion,
            Responsable_Id,
            Bodega_Estado
        } = bodegaData;

        // Verificar duplicados (excluyendo la bodega actual)
        if (await this.existsByName(Bodega_Nombre, id)) {
            throw new Error('Ya existe una bodega con ese nombre');
        }

        const query = `
            UPDATE ${bodegasTable} SET
                Bodega_Nombre = ?,
                Bodega_Tipo = ?,
                Bodega_Ubicacion = ?,
                Responsable_Id = ?,
                Bodega_Estado = ?
            WHERE Bodega_Id = ?
        `;
        
        const [, result] = await db.execute(query, [
            Bodega_Nombre,
            Bodega_Tipo || null,
            Bodega_Ubicacion || null,
            Responsable_Id || null,
            Bodega_Estado !== undefined ? (Bodega_Estado ? 1 : 0) : 1,
            id
        ]);
        
        // SQL Server usa rowsAffected, MySQL usa affectedRows
        const affected = result.rowsAffected || result.affectedRows || 0;
        return affected > 0;
    }

    /**
     * Elimina una bodega (soft delete)
     * @param {number} id - ID de la bodega
     * @returns {Promise<boolean>} - true si se eliminó, false si no
     */
    static async delete(id) {
        const query = `UPDATE ${bodegasTable} SET Bodega_Estado = 0 WHERE Bodega_Id = ?`;
        const [, result] = await db.execute(query, [id]);
        const affected = result.rowsAffected || result.affectedRows || 0;
        return affected > 0;
    }

    /**
     * Restaura una bodega eliminada
     * @param {number} id - ID de la bodega
     * @returns {Promise<boolean>} - true si se restauró, false si no
     */
    static async restore(id) {
        const query = `UPDATE ${bodegasTable} SET Bodega_Estado = 1 WHERE Bodega_Id = ?`;
        const [, result] = await db.execute(query, [id]);
        const affected = result.rowsAffected || result.affectedRows || 0;
        return affected > 0;
    }

    /**
     * Busca bodegas con paginación
     * @param {number} offset - Número de registros a saltar
     * @param {number} limit - Número máximo de registros a retornar
     * @returns {Promise<Object>} - Objeto con data y total
     */
    static async findWithPagination(offset = 0, limit = 10) {
        // Asegurar que offset y limit sean enteros
        const parsedOffset = parseInt(offset, 10) || 0;
        const parsedLimit = parseInt(limit, 10) || 10;
        
        let query;
        if (DB_DIALECT === 'mssql') {
            query = `
                SELECT 
                    b.Bodega_Id,
                    b.Bodega_Nombre,
                    b.Bodega_Tipo,
                    b.Bodega_Ubicacion,
                    b.Bodega_Estado,
                    b.Responsable_Id,
                    CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Responsable_Nombre,
                    u.Usuario_Correo as Responsable_Correo
                FROM ${bodegasTable} b
                LEFT JOIN ${usuariosTable} u ON b.Responsable_Id = u.Usuario_Id
                ORDER BY b.Bodega_Nombre ASC 
                OFFSET ${parsedOffset} ROWS
                FETCH NEXT ${parsedLimit} ROWS ONLY
            `;
        } else {
            query = `
                SELECT 
                    b.Bodega_Id,
                    b.Bodega_Nombre,
                    b.Bodega_Tipo,
                    b.Bodega_Ubicacion,
                    b.Bodega_Estado,
                    b.Responsable_Id,
                    CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Responsable_Nombre,
                    u.Usuario_Correo as Responsable_Correo
                FROM ${bodegasTable} b
                LEFT JOIN ${usuariosTable} u ON b.Responsable_Id = u.Usuario_Id
                ORDER BY b.Bodega_Nombre ASC 
                LIMIT ${parsedOffset}, ${parsedLimit}
            `;
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM ${bodegasTable}`;
        
        const [bodegas] = await db.execute(query);
        const [countResult] = await db.execute(countQuery);
        
        return {
            data: bodegas,
            total: countResult[0].total
        };
    }


    /**
     * Cuenta el número total de bodegas
     * @returns {Promise<number>} - Número total de bodegas
     */
    static async count() {
        const query = `SELECT COUNT(*) as total FROM ${bodegasTable}`;
        const [result] = await db.execute(query);
        return result[0].total;
    }

    /**
     * Verifica si una bodega existe
     * @param {number} id - ID de la bodega
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async exists(id) {
        const query = `SELECT COUNT(*) as count FROM ${bodegasTable} WHERE Bodega_Id = ?`;
        const [result] = await db.execute(query, [id]);
        return result[0].count > 0;
    }

    /**
     * Verifica si existe una bodega con el nombre dado
     * @param {string} nombre - Nombre de la bodega
     * @param {number} excludeId - ID a excluir de la búsqueda (opcional)
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async existsByName(nombre, excludeId = null) {
        let query = `SELECT COUNT(*) as count FROM ${bodegasTable} WHERE Bodega_Nombre = ?`;
        let params = [nombre];

        if (excludeId) {
            query += ' AND Bodega_Id != ?';
            params.push(excludeId);
        }

        const [result] = await db.execute(query, params);
        return result[0].count > 0;
    }

    /**
     * Busca bodegas por término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} - Array de bodegas encontradas
     */
    static async search(searchTerm) {
        const query = `
            SELECT 
                b.Bodega_Id,
                b.Bodega_Nombre,
                b.Bodega_Tipo,
                b.Bodega_Ubicacion,
                b.Bodega_Estado,
                b.Responsable_Id,
                CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Responsable_Nombre
            FROM ${bodegasTable} b
            LEFT JOIN ${usuariosTable} u ON b.Responsable_Id = u.Usuario_Id
            WHERE b.Bodega_Nombre LIKE ? 
               OR b.Bodega_Ubicacion LIKE ?
               OR CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) LIKE ?
            ORDER BY b.Bodega_Nombre ASC
            ${DB_DIALECT === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY' : 'LIMIT 20'}
        `;
        
        const [bodegas] = await db.execute(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
        return bodegas;
    }

    /**
     * Obtiene estadísticas de bodegas
     * @returns {Promise<Object>} - Estadísticas
     */
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_bodegas,
                COUNT(CASE WHEN Bodega_Estado = 1 THEN 1 END) as bodegas_activas,
                COUNT(CASE WHEN Bodega_Estado = 0 THEN 1 END) as bodegas_inactivas,
                COUNT(CASE WHEN Bodega_Tipo = 'Central' THEN 1 END) as bodegas_centrales,
                COUNT(CASE WHEN Bodega_Tipo = 'Producción' THEN 1 END) as bodegas_produccion,
                COUNT(CASE WHEN Bodega_Tipo = 'Frío' THEN 1 END) as bodegas_frio,
                COUNT(CASE WHEN Bodega_Tipo = 'Temporal' THEN 1 END) as bodegas_temporales,
                COUNT(CASE WHEN Responsable_Id IS NOT NULL THEN 1 END) as bodegas_con_responsable
            FROM ${bodegasTable}
        `;
        
        const [stats] = await db.execute(query);
        return stats[0];
    }

    /**
     * Obtiene bodegas activas para selects/dropdowns
     * @returns {Promise<Array>} - Array de bodegas activas
     */
    static async getActiveBodegas() {
        const query = `
            SELECT 
                Bodega_Id,
                Bodega_Nombre,
                Bodega_Tipo
            FROM ${bodegasTable} 
            WHERE Bodega_Estado = 1
            ORDER BY Bodega_Nombre ASC
        `;
        
        const [bodegas] = await db.execute(query);
        return bodegas;
    }

    /**
     * Obtiene bodegas por responsable
     * @param {number} responsableId - ID del responsable
     * @returns {Promise<Array>} - Array de bodegas del responsable
     */
    static async findByResponsable(responsableId) {
        const query = `
            SELECT 
                b.Bodega_Id,
                b.Bodega_Nombre,
                b.Bodega_Tipo,
                b.Bodega_Ubicacion,
                b.Bodega_Estado
            FROM ${bodegasTable} b
            WHERE b.Responsable_Id = ? AND b.Bodega_Estado = 1
            ORDER BY b.Bodega_Nombre ASC
        `;
        
        const [bodegas] = await db.execute(query, [responsableId]);
        return bodegas;
    }

    /**
     * Verifica si se puede eliminar una bodega (no tiene existencias)
     * @param {number} id - ID de la bodega
     * @returns {Promise<boolean>} - true si se puede eliminar, false si no
     */
    static async canDelete(id) {
        const existenciasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Existencias' : 'Existencias';
        const query = `
            SELECT COUNT(*) as count 
            FROM ${existenciasTable} 
            WHERE Bodega_Id = ? AND Cantidad > 0
        `;
        
        const [result] = await db.execute(query, [id]);
        return result[0].count === 0;
    }
}

module.exports = BodegaModel;
