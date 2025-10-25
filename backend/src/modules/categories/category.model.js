const db = require('../../core/config/database');

// Soporte para múltiples dialectos de base de datos
const dialect = process.env.DB_DIALECT || 'mysql';
const categoriasTable = dialect === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const itemsTable = dialect === 'mssql' ? 'Items.Items' : 'Items';

class CategoryModel {
    /**
     * Crea una nueva categoría en la base de datos
     * @param {Object} categoryData - Datos de la categoría
     * @returns {Promise<number>} - ID de la categoría creada
     */
    static async create(categoryData) {
        const { CategoriaItem_Nombre, CategoriaItem_Descripcion } = categoryData;
        
        // Verificar si el nombre ya existe
        const [existingCategory] = await db.execute(
            `SELECT CategoriaItem_Id FROM ${categoriasTable} WHERE CategoriaItem_Nombre = ?`,
            [CategoriaItem_Nombre]
            
        );
        
        if (existingCategory.length > 0) {
            throw new Error('Ya existe una categoría con este nombre');
        }

        // INSERT con soporte para SQL Server y MySQL
        let query;
        if (dialect === 'mssql') {
            query = `INSERT INTO ${categoriasTable} (CategoriaItem_Nombre, CategoriaItem_Descripcion) 
                     OUTPUT INSERTED.CategoriaItem_Id AS insertId 
                     VALUES (?, ?)`;
        } else {
            query = `INSERT INTO ${categoriasTable} (CategoriaItem_Nombre, CategoriaItem_Descripcion) VALUES (?, ?)`;
        }

        const [rows, result] = await db.execute(query, [CategoriaItem_Nombre, CategoriaItem_Descripcion || null]);
        
        // Obtener el ID insertado (compatible con ambos dialectos)
        return dialect === 'mssql' ? rows[0].insertId : result.insertId;
    }

    /**
     * Obtiene todas las categorías
     * @returns {Promise<Array>} - Array de categorías
     */
    static async findAll() {
        const [categories] = await db.execute(`
            SELECT 
                CategoriaItem_Id,
                CategoriaItem_Nombre,
                CategoriaItem_Descripcion
            FROM ${categoriasTable} 
            ORDER BY CategoriaItem_Nombre ASC
        `);
        return categories;
    }

    /**
     * Busca una categoría por ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object|undefined>} - Categoría encontrada o undefined
     */
    static async findById(id) {
        const [categories] = await db.execute(`
            SELECT 
                CategoriaItem_Id,
                CategoriaItem_Nombre,
                CategoriaItem_Descripcion
            FROM ${categoriasTable} 
            WHERE CategoriaItem_Id = ?
        `, [id]);
        return categories[0];
    }

    /**
     * Busca una categoría por nombre
     * @param {string} name - Nombre de la categoría
     * @returns {Promise<Object|undefined>} - Categoría encontrada o undefined
     */
    static async findByName(name) {
        const [categories] = await db.execute(`
            SELECT 
                CategoriaItem_Id,
                CategoriaItem_Nombre,
                CategoriaItem_Descripcion
            FROM ${categoriasTable} 
            WHERE CategoriaItem_Nombre = ?
        `, [name]);
        return categories[0];
    }

    /**
     * Actualiza una categoría
     * @param {number} id - ID de la categoría
     * @param {Object} categoryData - Datos actualizados de la categoría
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async update(id, categoryData) {
        const { CategoriaItem_Nombre, CategoriaItem_Descripcion } = categoryData;
        
        // Verificar si el nombre ya existe en otra categoría
        const [existingCategory] = await db.execute(
            `SELECT CategoriaItem_Id FROM ${categoriasTable} WHERE CategoriaItem_Nombre = ? AND CategoriaItem_Id != ?`,
            [CategoriaItem_Nombre, id]
        );
        
        if (existingCategory.length > 0) {
            throw new Error('Ya existe una categoría con este nombre');
        }

        const [rows, result] = await db.execute(
            `UPDATE ${categoriasTable} SET CategoriaItem_Nombre = ?, CategoriaItem_Descripcion = ? WHERE CategoriaItem_Id = ?`,
            [CategoriaItem_Nombre, CategoriaItem_Descripcion || null, id]
        );
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Elimina una categoría
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>} - true si se eliminó, false si no
     */
    static async delete(id) {
        // Verificar si la categoría está siendo usada por algún item
        const [itemsUsingCategory] = await db.execute(
            `SELECT COUNT(*) as count FROM ${itemsTable} WHERE CategoriaItem_Id = ?`,
            [id]
        );
        
        if (itemsUsingCategory[0].count > 0) {
            throw new Error('No se puede eliminar la categoría porque está siendo utilizada por uno o más items');
        }

        const [rows, result] = await db.execute(
            `DELETE FROM ${categoriasTable} WHERE CategoriaItem_Id = ?`,
            [id]
        );
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Cuenta el número total de categorías
     * @returns {Promise<number>} - Número total de categorías
     */
    static async count() {
        const [result] = await db.execute(`SELECT COUNT(*) as total FROM ${categoriasTable}`);
        return result[0].total;
    }

    /**
     * Busca categorías con paginación
     * @param {number} offset - Número de registros a saltar
     * @param {number} limit - Número máximo de registros a retornar
     * @param {string} search - Término de búsqueda (opcional)
     * @returns {Promise<Object>} - Objeto con data y total
     */
    static async findWithPagination(offset = 0, limit = 10, search = '') {
        let query = `
            SELECT 
                CategoriaItem_Id,
                CategoriaItem_Nombre,
                CategoriaItem_Descripcion
            FROM ${categoriasTable}
        `;
        let countQuery = `SELECT COUNT(*) as total FROM ${categoriasTable}`;
        let params = [];
        let countParams = [];

        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            query += ' WHERE (CategoriaItem_Nombre LIKE ? OR CategoriaItem_Descripcion LIKE ?)';
            countQuery += ' WHERE (CategoriaItem_Nombre LIKE ? OR CategoriaItem_Descripcion LIKE ?)';
            params = [searchPattern, searchPattern];
            countParams = [searchPattern, searchPattern];
        }

        // Paginación: SQL Server usa OFFSET/FETCH NEXT, MySQL usa LIMIT
        if (dialect === 'mssql') {
            query += ' ORDER BY CategoriaItem_Nombre ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY';
            params.push(offset, limit);
        } else {
            query += ' ORDER BY CategoriaItem_Nombre ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        const [categories] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, countParams);

        return {
            data: categories,
            total: countResult[0].total
        };
    }

    /**
     * Verifica si una categoría existe
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async exists(id) {
        const [categories] = await db.execute(
            `SELECT CategoriaItem_Id FROM ${categoriasTable} WHERE CategoriaItem_Id = ?`,
            [id]
        );
        return categories.length > 0;
    }
}

module.exports = CategoryModel;
