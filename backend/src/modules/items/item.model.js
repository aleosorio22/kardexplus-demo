const db = require('../../core/config/database');

// Soporte para múltiples dialectos de base de datos
const dialect = process.env.DB_DIALECT || 'mysql';
const itemsTable = dialect === 'mssql' ? 'Items.Items' : 'Items';
const categoriasTable = dialect === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const unidadesMedidaTable = dialect === 'mssql' ? 'Items.UnidadesMedida' : 'UnidadesMedida';

class ItemModel {
    /**
     * Crea un nuevo item en la base de datos
     * @param {Object} itemData - Datos del item
     * @returns {Promise<number>} - ID del item creado
     */
    static async create(itemData) {
        const {
            Item_Codigo_SKU,
            Item_Codigo_Barra,
            Item_Nombre,
            Item_Descripcion,
            Item_Tipo,
            Item_Costo_Unitario,
            Item_Precio_Sugerido,
            Item_Imagen_URL,
            Item_Estado,
            CategoriaItem_Id,
            UnidadMedidaBase_Id
        } = itemData;

        // Verificar duplicados
        if (Item_Nombre && await this.existsByName(Item_Nombre)) {
            throw new Error('Ya existe un item con ese nombre');
        }

        if (Item_Codigo_SKU && await this.existsBySKU(Item_Codigo_SKU)) {
            throw new Error('Ya existe un item con ese código SKU');
        }

        if (Item_Codigo_Barra && await this.existsByBarcode(Item_Codigo_Barra)) {
            throw new Error('Ya existe un item con ese código de barras');
        }

        // INSERT con soporte para SQL Server y MySQL
        let query;
        if (dialect === 'mssql') {
            query = `INSERT INTO ${itemsTable} (
                Item_Codigo_SKU,
                Item_Codigo_Barra,
                Item_Nombre,
                Item_Descripcion,
                Item_Tipo,
                Item_Costo_Unitario,
                Item_Precio_Sugerido,
                Item_Imagen_URL,
                Item_Estado,
                CategoriaItem_Id,
                UnidadMedidaBase_Id
            ) OUTPUT INSERTED.Item_Id AS insertId
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        } else {
            query = `INSERT INTO ${itemsTable} (
                Item_Codigo_SKU,
                Item_Codigo_Barra,
                Item_Nombre,
                Item_Descripcion,
                Item_Tipo,
                Item_Costo_Unitario,
                Item_Precio_Sugerido,
                Item_Imagen_URL,
                Item_Estado,
                CategoriaItem_Id,
                UnidadMedidaBase_Id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        }

        const [rows, result] = await db.execute(query, [
            Item_Codigo_SKU || null,
            Item_Codigo_Barra || null,
            Item_Nombre,
            Item_Descripcion || null,
            Item_Tipo || 'B',
            Item_Costo_Unitario,
            Item_Precio_Sugerido || null,
            Item_Imagen_URL || null,
            Item_Estado !== undefined ? Item_Estado : 1,
            CategoriaItem_Id,
            UnidadMedidaBase_Id
        ]);
        
        return dialect === 'mssql' ? rows[0].insertId : result.insertId;
    }

    /**
     * Obtiene todos los items
     * @returns {Promise<Array>} - Array de items
     */
    static async findAll() {
        const [items] = await db.execute(`
            SELECT 
                i.Item_Id,
                i.Item_Codigo_SKU,
                i.Item_Codigo_Barra,
                i.Item_Nombre,
                i.Item_Descripcion,
                i.Item_Tipo,
                i.Item_Costo_Unitario,
                i.Item_Precio_Sugerido,
                i.Item_Imagen_URL,
                i.Item_Estado,
                i.Item_Fecha_Creacion,
                i.Item_Fecha_Actualizacion,
                i.CategoriaItem_Id,
                i.UnidadMedidaBase_Id,
                c.CategoriaItem_Nombre,
                c.CategoriaItem_Descripcion,
                u.UnidadMedida_Nombre,
                u.UnidadMedida_Prefijo
            FROM ${itemsTable} i
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id
            ORDER BY i.Item_Nombre ASC
        `);
        return items;
    }

    /**
     * Busca un item por ID
     * @param {number} id - ID del item
     * @returns {Promise<Object|undefined>} - Item encontrado o undefined
     */
    static async findById(id) {
        const [items] = await db.execute(`
            SELECT 
                i.Item_Id,
                i.Item_Codigo_SKU,
                i.Item_Codigo_Barra,
                i.Item_Nombre,
                i.Item_Descripcion,
                i.Item_Tipo,
                i.Item_Costo_Unitario,
                i.Item_Precio_Sugerido,
                i.Item_Imagen_URL,
                i.Item_Estado,
                i.Item_Fecha_Creacion,
                i.Item_Fecha_Actualizacion,
                i.CategoriaItem_Id,
                i.UnidadMedidaBase_Id,
                c.CategoriaItem_Nombre,
                c.CategoriaItem_Descripcion,
                u.UnidadMedida_Nombre,
                u.UnidadMedida_Prefijo
            FROM ${itemsTable} i
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id
            WHERE i.Item_Id = ?
        `, [id]);
        return items[0];
    }

    /**
     * Actualiza un item
     * @param {number} id - ID del item
     * @param {Object} itemData - Datos actualizados del item
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async update(id, itemData) {
        const {
            Item_Codigo_SKU,
            Item_Codigo_Barra,
            Item_Nombre,
            Item_Descripcion,
            Item_Tipo,
            Item_Costo_Unitario,
            Item_Precio_Sugerido,
            Item_Imagen_URL,
            Item_Estado,
            CategoriaItem_Id,
            UnidadMedidaBase_Id
        } = itemData;

        // Verificar duplicados (excluyendo el item actual)
        if (Item_Nombre && await this.existsByName(Item_Nombre, id)) {
            throw new Error('Ya existe otro item con ese nombre');
        }

        if (Item_Codigo_SKU && await this.existsBySKU(Item_Codigo_SKU, id)) {
            throw new Error('Ya existe otro item con ese código SKU');
        }

        if (Item_Codigo_Barra && await this.existsByBarcode(Item_Codigo_Barra, id)) {
            throw new Error('Ya existe otro item con ese código de barras');
        }

        const [rows, result] = await db.execute(`
            UPDATE ${itemsTable} SET
                Item_Codigo_SKU = ?,
                Item_Codigo_Barra = ?,
                Item_Nombre = ?,
                Item_Descripcion = ?,
                Item_Tipo = ?,
                Item_Costo_Unitario = ?,
                Item_Precio_Sugerido = ?,
                Item_Imagen_URL = ?,
                Item_Estado = ?,
                CategoriaItem_Id = ?,
                UnidadMedidaBase_Id = ?
            WHERE Item_Id = ?
        `, [
            Item_Codigo_SKU || null,
            Item_Codigo_Barra || null,
            Item_Nombre,
            Item_Descripcion || null,
            Item_Tipo || 'B',
            Item_Costo_Unitario,
            Item_Precio_Sugerido || null,
            Item_Imagen_URL || null,
            Item_Estado !== undefined ? Item_Estado : 1,
            CategoriaItem_Id,
            UnidadMedidaBase_Id,
            id
        ]);
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Elimina un item (cambio de estado en lugar de eliminación física)
     * @param {number} id - ID del item
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async delete(id) {
        // En lugar de eliminar físicamente, cambiar estado a 0 (false)
        const [rows, result] = await db.execute(
            `UPDATE ${itemsTable} SET Item_Estado = 0 WHERE Item_Id = ?`,
            [id]
        );
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Restaura un item (cambio de estado a activo)
     * @param {number} id - ID del item
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async restore(id) {
        const [rows, result] = await db.execute(
            `UPDATE ${itemsTable} SET Item_Estado = 1 WHERE Item_Id = ?`,
            [id]
        );
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Toggle del estado de un item
     * @param {number} id - ID del item
     * @returns {Promise<boolean>} - true si se actualizó, false si no
     */
    static async toggleStatus(id) {
        // SQL Server y MySQL manejan el toggle de manera diferente
        let query;
        if (dialect === 'mssql') {
            // SQL Server: usar CASE para invertir BIT
            query = `UPDATE ${itemsTable} SET Item_Estado = CASE WHEN Item_Estado = 1 THEN 0 ELSE 1 END WHERE Item_Id = ?`;
        } else {
            // MySQL: usar NOT
            query = `UPDATE ${itemsTable} SET Item_Estado = NOT Item_Estado WHERE Item_Id = ?`;
        }
        
        const [rows, result] = await db.execute(query, [id]);
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    /**
     * Busca items con paginación
     * @param {number} offset - Número de registros a saltar
     * @param {number} limit - Número máximo de registros a retornar
     * @param {string} search - Término de búsqueda (opcional)
     * @param {string} categoria - ID de categoría para filtrar (opcional)
     * @param {string} estado - Estado para filtrar (opcional)
     * @returns {Promise<Object>} - Objeto con data y total
     */
    static async findWithPagination(offset = 0, limit = 10, search = '', categoria = '', estado = '') {
        let query = `
            SELECT 
                i.Item_Id,
                i.Item_Codigo_SKU,
                i.Item_Codigo_Barra,
                i.Item_Nombre,
                i.Item_Descripcion,
                i.Item_Tipo,
                i.Item_Costo_Unitario,
                i.Item_Precio_Sugerido,
                i.Item_Imagen_URL,
                i.Item_Estado,
                i.Item_Fecha_Creacion,
                i.Item_Fecha_Actualizacion,
                i.CategoriaItem_Id,
                i.UnidadMedidaBase_Id,
                c.CategoriaItem_Nombre,
                c.CategoriaItem_Descripcion,
                u.UnidadMedida_Nombre,
                u.UnidadMedida_Prefijo
            FROM ${itemsTable} i
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id
        `;
        let countQuery = `SELECT COUNT(*) as total FROM ${itemsTable} i INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id`;
        let params = [];
        let whereConditions = [];

        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            whereConditions.push('(i.Item_Nombre LIKE ? OR i.Item_Codigo_SKU LIKE ? OR i.Item_Codigo_Barra LIKE ?)');
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (categoria && categoria.trim() !== '') {
            whereConditions.push('i.CategoriaItem_Id = ?');
            params.push(parseInt(categoria));
        }

        if (estado && estado.trim() !== '') {
            whereConditions.push('i.Item_Estado = ?');
            // Convertir a 1 o 0 para BIT de SQL Server
            const estadoBool = (estado === 'true' || estado === '1') ? 1 : 0;
            params.push(estadoBool);
        }

        if (whereConditions.length > 0) {
            const whereClause = ' WHERE ' + whereConditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Paginación: SQL Server usa OFFSET/FETCH NEXT, MySQL usa LIMIT
        if (dialect === 'mssql') {
            query += ' ORDER BY i.Item_Nombre ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY';
            params.push(parseInt(offset), parseInt(limit));
        } else {
            query += ' ORDER BY i.Item_Nombre ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
        }
        
        // Para la consulta principal, usamos params con paginación
        const queryParams = [...params];
        
        // Para la consulta de conteo, solo usamos los parámetros de filtro (sin limit/offset)
        const countParams = params.slice(0, params.length - 2);

        const [items] = await db.execute(query, queryParams);
        const [countResult] = await db.execute(countQuery, countParams);

        return {
            data: items,
            total: countResult[0].total
        };
    }

    /**
     * Obtiene items por categoría
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<Array>} - Array de items
     */
    static async findByCategory(categoriaId) {
        const [items] = await db.execute(`
            SELECT 
                i.Item_Id,
                i.Item_Codigo_SKU,
                i.Item_Codigo_Barra,
                i.Item_Nombre,
                i.Item_Descripcion,
                i.Item_Tipo,
                i.Item_Costo_Unitario,
                i.Item_Precio_Sugerido,
                i.Item_Imagen_URL,
                i.Item_Estado,
                i.Item_Fecha_Creacion,
                i.Item_Fecha_Actualizacion,
                i.CategoriaItem_Id,
                i.UnidadMedidaBase_Id,
                c.CategoriaItem_Nombre,
                c.CategoriaItem_Descripcion,
                u.UnidadMedida_Nombre,
                u.UnidadMedida_Prefijo
            FROM ${itemsTable} i
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id
            WHERE i.CategoriaItem_Id = ?
            ORDER BY i.Item_Nombre ASC
        `, [categoriaId]);
        return items;
    }

    /**
     * Busca items por término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} - Array de items encontrados
     */
    static async search(searchTerm) {
        const searchPattern = `%${searchTerm}%`;
        const [items] = await db.execute(`
            SELECT 
                i.Item_Id,
                i.Item_Codigo_SKU,
                i.Item_Codigo_Barra,
                i.Item_Nombre,
                i.Item_Descripcion,
                i.Item_Tipo,
                i.Item_Costo_Unitario,
                i.Item_Precio_Sugerido,
                i.Item_Imagen_URL,
                i.Item_Estado,
                i.Item_Fecha_Creacion,
                i.Item_Fecha_Actualizacion,
                i.CategoriaItem_Id,
                i.UnidadMedidaBase_Id,
                c.CategoriaItem_Nombre,
                c.CategoriaItem_Descripcion,
                u.UnidadMedida_Nombre,
                u.UnidadMedida_Prefijo
            FROM ${itemsTable} i
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} u ON i.UnidadMedidaBase_Id = u.UnidadMedida_Id
            WHERE i.Item_Nombre LIKE ? 
               OR i.Item_Codigo_SKU LIKE ? 
               OR i.Item_Codigo_Barra LIKE ?
               OR c.CategoriaItem_Nombre LIKE ?
            ORDER BY i.Item_Nombre ASC
        `, [searchPattern, searchPattern, searchPattern, searchPattern]);
        return items;
    }

    /**
     * Cuenta el número total de items
     * @returns {Promise<number>} - Número total de items
     */
    static async count() {
        const [result] = await db.execute(`SELECT COUNT(*) as total FROM ${itemsTable}`);
        return result[0].total;
    }

    /**
     * Verifica si un item existe
     * @param {number} id - ID del item
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async exists(id) {
        const [items] = await db.execute(
            `SELECT Item_Id FROM ${itemsTable} WHERE Item_Id = ?`,
            [id]
        );
        return items.length > 0;
    }

    /**
     * Verifica si existe un item con el nombre dado
     * @param {string} nombre - Nombre del item
     * @param {number} excludeId - ID a excluir de la búsqueda (opcional)
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async existsByName(nombre, excludeId = null) {
        let query = `SELECT Item_Id FROM ${itemsTable} WHERE Item_Nombre = ?`;
        let params = [nombre];
        
        if (excludeId) {
            query += ' AND Item_Id != ?';
            params.push(excludeId);
        }
        
        const [items] = await db.execute(query, params);
        return items.length > 0;
    }

    /**
     * Verifica si existe un item con el código SKU dado
     * @param {string} sku - Código SKU
     * @param {number} excludeId - ID a excluir de la búsqueda (opcional)
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async existsBySKU(sku, excludeId = null) {
        let query = `SELECT Item_Id FROM ${itemsTable} WHERE Item_Codigo_SKU = ?`;
        let params = [sku];
        
        if (excludeId) {
            query += ' AND Item_Id != ?';
            params.push(excludeId);
        }
        
        const [items] = await db.execute(query, params);
        return items.length > 0;
    }

    /**
     * Verifica si existe un item con el código de barras dado
     * @param {string} barcode - Código de barras
     * @param {number} excludeId - ID a excluir de la búsqueda (opcional)
     * @returns {Promise<boolean>} - true si existe, false si no
     */
    static async existsByBarcode(barcode, excludeId = null) {
        let query = `SELECT Item_Id FROM ${itemsTable} WHERE Item_Codigo_Barra = ?`;
        let params = [barcode];
        
        if (excludeId) {
            query += ' AND Item_Id != ?';
            params.push(excludeId);
        }
        
        const [items] = await db.execute(query, params);
        return items.length > 0;
    }
}

module.exports = ItemModel;
