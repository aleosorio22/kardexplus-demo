const db = require('../../core/config/database');

// Detectar el dialecto de la base de datos
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';

// Nombres de tablas según el dialecto
const itemsBodegasParamsTable = DB_DIALECT === 'mssql' ? 'Warehouses.Items_Bodegas_Parametros' : 'Items_Bodegas_Parametros';
const itemsTable = DB_DIALECT === 'mssql' ? 'Items.Items' : 'Items';
const bodegasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Bodegas' : 'Bodegas';
const categoriasTable = DB_DIALECT === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const unidadesTable = DB_DIALECT === 'mssql' ? 'Items.UnidadesMedida' : 'UnidadesMedida';
const usuariosTable = DB_DIALECT === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
const existenciasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Existencias' : 'Existencias';

class ItemBodegaParamModel {
    
    // =======================================
    // CONSULTAS PRINCIPALES
    // =======================================

    /**
     * Obtener todos los parámetros con paginación y filtros
     * @param {number} offset - Desplazamiento para paginación
     * @param {number} limit - Límite de registros por página
     * @param {Object} filters - Filtros de búsqueda
     */
    static async findWithPagination(offset = 0, limit = 10, filters = {}) {
        try {
            offset = parseInt(offset) || 0;
            limit = parseInt(limit) || 10;
            
            let whereClause = 'WHERE 1=1';
            let params = [];

            // Filtro por bodega
            if (filters.bodega_id) {
                whereClause += ' AND ibp.Bodega_Id = ?';
                params.push(filters.bodega_id);
            }

            // Filtro por item
            if (filters.item_id) {
                whereClause += ' AND ibp.Item_Id = ?';
                params.push(filters.item_id);
            }

            // Filtro por categoría de item
            if (filters.categoria_id) {
                whereClause += ' AND i.CategoriaItem_Id = ?';
                params.push(filters.categoria_id);
            }

            // Filtro por items activos en bodega
            if (filters.activos_bodega === 'true') {
                whereClause += ' AND ibp.Es_Item_Activo_Bodega = 1';
            }

            // Filtro por búsqueda de texto
            if (filters.search) {
                whereClause += ' AND (i.Item_Nombre LIKE ? OR i.Item_Codigo_SKU LIKE ? OR b.Bodega_Nombre LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            let paginationClause;
            if (DB_DIALECT === 'mssql') {
                paginationClause = `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
            } else {
                paginationClause = `LIMIT ${offset}, ${limit}`;
            }

            const query = `
                SELECT 
                    ibp.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    i.Item_Codigo_Barra,
                    i.Item_Costo_Unitario,
                    i.Item_Estado,
                    b.Bodega_Nombre,
                    b.Bodega_Tipo,
                    b.Bodega_Estado,
                    cat.CategoriaItem_Nombre,
                    um.UnidadMedida_Nombre,
                    um.UnidadMedida_Prefijo,
                    u.Usuario_Nombre as Configurado_Por,
                    
                    -- Información de existencia actual
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual,
                    
                    -- Estados calculados
                    CASE 
                        WHEN COALESCE(e.Cantidad, 0) = 0 THEN 'Sin Stock'
                        WHEN ibp.Stock_Min_Bodega IS NOT NULL AND COALESCE(e.Cantidad, 0) < ibp.Stock_Min_Bodega THEN 'Stock Bajo'
                        WHEN ibp.Stock_Max_Bodega IS NOT NULL AND COALESCE(e.Cantidad, 0) > ibp.Stock_Max_Bodega THEN 'Sobre Stock'
                        WHEN ibp.Punto_Reorden IS NOT NULL AND COALESCE(e.Cantidad, 0) <= ibp.Punto_Reorden THEN 'Punto Reorden'
                        ELSE 'Normal'
                    END as Estado_Stock_Actual
                    
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                INNER JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${usuariosTable} u ON ibp.Usuario_Configuracion = u.Usuario_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                ${whereClause}
                ORDER BY b.Bodega_Nombre, i.Item_Nombre
                ${paginationClause}
            `;

            const [rows] = await db.execute(query, params);

            // Contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                ${whereClause}
            `;

            const [countRows] = await db.execute(countQuery, params);
            const total = countRows[0].total;

            return {
                data: rows,
                pagination: {
                    offset,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener parámetros específicos por item y bodega
     * @param {number} itemId - ID del item
     * @param {number} bodegaId - ID de la bodega
     */
    static async findByItemAndBodega(itemId, bodegaId) {
        try {
            const query = `
                SELECT 
                    ibp.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    i.Item_Costo_Unitario,
                    b.Bodega_Nombre,
                    b.Bodega_Tipo,
                    cat.CategoriaItem_Nombre,
                    um.UnidadMedida_Prefijo,
                    u.Usuario_Nombre as Configurado_Por,
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                INNER JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${usuariosTable} u ON ibp.Usuario_Configuracion = u.Usuario_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                WHERE ibp.Item_Id = ? AND ibp.Bodega_Id = ?
            `;

            const [rows] = await db.execute(query, [itemId, bodegaId]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los parámetros por bodega específica
     * @param {number} bodegaId - ID de la bodega
     */
    static async findByBodega(bodegaId) {
        try {
            const query = `
                SELECT 
                    ibp.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    i.Item_Costo_Unitario,
                    cat.CategoriaItem_Nombre,
                    um.UnidadMedida_Prefijo,
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual,
                    CASE 
                        WHEN COALESCE(e.Cantidad, 0) = 0 THEN 'Sin Stock'
                        WHEN COALESCE(e.Cantidad, 0) < ibp.Stock_Min_Bodega THEN 'Stock Bajo'
                        WHEN ibp.Stock_Max_Bodega IS NOT NULL AND COALESCE(e.Cantidad, 0) > ibp.Stock_Max_Bodega THEN 'Sobre Stock'
                        WHEN ibp.Punto_Reorden IS NOT NULL AND COALESCE(e.Cantidad, 0) <= ibp.Punto_Reorden THEN 'Punto Reorden'
                        ELSE 'Normal'
                    END as Estado_Stock
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                INNER JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                WHERE ibp.Bodega_Id = ? AND ibp.Es_Item_Activo_Bodega = 1
                ORDER BY i.Item_Nombre
            `;

            const [rows] = await db.execute(query, [bodegaId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los parámetros por item específico
     * @param {number} itemId - ID del item
     */
    static async findByItem(itemId) {
        try {
            const query = `
                SELECT 
                    ibp.*,
                    b.Bodega_Nombre,
                    b.Bodega_Tipo,
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual,
                    CASE 
                        WHEN COALESCE(e.Cantidad, 0) = 0 THEN 'Sin Stock'
                        WHEN COALESCE(e.Cantidad, 0) < ibp.Stock_Min_Bodega THEN 'Stock Bajo'
                        WHEN ibp.Stock_Max_Bodega IS NOT NULL AND COALESCE(e.Cantidad, 0) > ibp.Stock_Max_Bodega THEN 'Sobre Stock'
                        WHEN ibp.Punto_Reorden IS NOT NULL AND COALESCE(e.Cantidad, 0) <= ibp.Punto_Reorden THEN 'Punto Reorden'
                        ELSE 'Normal'
                    END as Estado_Stock
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                WHERE ibp.Item_Id = ? AND ibp.Es_Item_Activo_Bodega = 1 AND b.Bodega_Estado = 1
                ORDER BY b.Bodega_Nombre
            `;

            const [rows] = await db.execute(query, [itemId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // =======================================
    // OPERACIONES CRUD
    // =======================================

    /**
     * Crear nuevos parámetros de item-bodega
     * @param {Object} data - Datos del parámetro
     */
    static async create(data) {
        try {
            const query = `
                INSERT INTO ${itemsBodegasParamsTable} (
                    Item_Id, Bodega_Id, Stock_Min_Bodega, Stock_Max_Bodega,
                    Punto_Reorden, Es_Item_Activo_Bodega, Usuario_Configuracion
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                data.Item_Id,
                data.Bodega_Id,
                data.Stock_Min_Bodega || 0,
                data.Stock_Max_Bodega || null,
                data.Punto_Reorden || null,
                data.Es_Item_Activo_Bodega !== undefined ? (data.Es_Item_Activo_Bodega ? 1 : 0) : 1,
                data.Usuario_Configuracion || null
            ]);

            return result;
        } catch (error) {
            // SQL Server: error.number === 2627, MySQL: error.code === 'ER_DUP_ENTRY'
            if (error.code === 'ER_DUP_ENTRY' || error.number === 2627) {
                throw new Error('Ya existen parámetros para este item en esta bodega');
            }
            throw error;
        }
    }

    /**
     * Actualizar parámetros existentes
     * @param {number} itemId - ID del item
     * @param {number} bodegaId - ID de la bodega
     * @param {Object} data - Datos a actualizar
     */
    static async update(itemId, bodegaId, data) {
        try {
            // Verificar que existe el registro
            const existingParam = await this.findByItemAndBodega(itemId, bodegaId);
            if (!existingParam) {
                throw new Error('Parámetros no encontrados');
            }

            const query = `
                UPDATE ${itemsBodegasParamsTable} 
                SET 
                    Stock_Min_Bodega = ?,
                    Stock_Max_Bodega = ?,
                    Punto_Reorden = ?,
                    Es_Item_Activo_Bodega = ?,
                    Usuario_Configuracion = ?
                WHERE Item_Id = ? AND Bodega_Id = ?
            `;

            const [result] = await db.execute(query, [
                data.Stock_Min_Bodega !== undefined ? data.Stock_Min_Bodega : existingParam.Stock_Min_Bodega,
                data.Stock_Max_Bodega !== undefined ? data.Stock_Max_Bodega : existingParam.Stock_Max_Bodega,
                data.Punto_Reorden !== undefined ? data.Punto_Reorden : existingParam.Punto_Reorden,
                data.Es_Item_Activo_Bodega !== undefined ? (data.Es_Item_Activo_Bodega ? 1 : 0) : existingParam.Es_Item_Activo_Bodega,
                data.Usuario_Configuracion || existingParam.Usuario_Configuracion,
                itemId,
                bodegaId
            ]);

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crear o actualizar parámetros (upsert)
     * @param {Object} data - Datos del parámetro
     */
    static async createOrUpdate(data) {
        try {
            if (DB_DIALECT === 'mssql') {
                // SQL Server: usar MERGE
                const query = `
                    MERGE INTO ${itemsBodegasParamsTable} AS target
                    USING (SELECT ? AS Item_Id, ? AS Bodega_Id) AS source
                    ON target.Item_Id = source.Item_Id AND target.Bodega_Id = source.Bodega_Id
                    WHEN MATCHED THEN
                        UPDATE SET 
                            Stock_Min_Bodega = ?,
                            Stock_Max_Bodega = ?,
                            Punto_Reorden = ?,
                            Es_Item_Activo_Bodega = ?,
                            Usuario_Configuracion = ?,
                            Fecha_Configuracion = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (Item_Id, Bodega_Id, Stock_Min_Bodega, Stock_Max_Bodega, Punto_Reorden, Es_Item_Activo_Bodega, Usuario_Configuracion)
                        VALUES (?, ?, ?, ?, ?, ?, ?);
                `;

                const [result] = await db.execute(query, [
                    data.Item_Id,
                    data.Bodega_Id,
                    data.Stock_Min_Bodega || 0,
                    data.Stock_Max_Bodega || null,
                    data.Punto_Reorden || null,
                    data.Es_Item_Activo_Bodega !== undefined ? (data.Es_Item_Activo_Bodega ? 1 : 0) : 1,
                    data.Usuario_Configuracion || null,
                    data.Item_Id,
                    data.Bodega_Id,
                    data.Stock_Min_Bodega || 0,
                    data.Stock_Max_Bodega || null,
                    data.Punto_Reorden || null,
                    data.Es_Item_Activo_Bodega !== undefined ? (data.Es_Item_Activo_Bodega ? 1 : 0) : 1,
                    data.Usuario_Configuracion || null
                ]);

                return result;
            } else {
                // MySQL: usar ON DUPLICATE KEY UPDATE
                const query = `
                    INSERT INTO ${itemsBodegasParamsTable} (
                        Item_Id, Bodega_Id, Stock_Min_Bodega, Stock_Max_Bodega,
                        Punto_Reorden, Es_Item_Activo_Bodega, Usuario_Configuracion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        Stock_Min_Bodega = VALUES(Stock_Min_Bodega),
                        Stock_Max_Bodega = VALUES(Stock_Max_Bodega),
                        Punto_Reorden = VALUES(Punto_Reorden),
                        Es_Item_Activo_Bodega = VALUES(Es_Item_Activo_Bodega),
                        Usuario_Configuracion = VALUES(Usuario_Configuracion),
                        Fecha_Configuracion = CURRENT_TIMESTAMP
                `;

                const [result] = await db.execute(query, [
                    data.Item_Id,
                    data.Bodega_Id,
                    data.Stock_Min_Bodega || 0,
                    data.Stock_Max_Bodega || null,
                    data.Punto_Reorden || null,
                    data.Es_Item_Activo_Bodega !== undefined ? (data.Es_Item_Activo_Bodega ? 1 : 0) : 1,
                    data.Usuario_Configuracion || null
                ]);

                return result;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar parámetros específicos
     * @param {number} itemId - ID del item
     * @param {number} bodegaId - ID de la bodega
     */
    static async delete(itemId, bodegaId) {
        try {
            const query = `DELETE FROM ${itemsBodegasParamsTable} WHERE Item_Id = ? AND Bodega_Id = ?`;
            const [result] = await db.execute(query, [itemId, bodegaId]);

            if (result.affectedRows === 0) {
                throw new Error('Parámetros no encontrados');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    // =======================================
    // CONSULTAS ESPECIALES
    // =======================================

    /**
     * Obtener items con stock bajo según sus parámetros por bodega
     * @param {number} bodegaId - ID de bodega (opcional)
     */
    static async getItemsStockBajo(bodegaId = null) {
        try {
            let whereClause = `WHERE ibp.Es_Item_Activo_Bodega = 1
                              AND i.Item_Estado = 1
                              AND COALESCE(e.Cantidad, 0) < ibp.Stock_Min_Bodega`;
            let params = [];

            if (bodegaId) {
                whereClause += ' AND ibp.Bodega_Id = ?';
                params.push(bodegaId);
            }

            const query = `
                SELECT 
                    ibp.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    b.Bodega_Nombre,
                    cat.CategoriaItem_Nombre,
                    um.UnidadMedida_Prefijo,
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual,
                    (ibp.Stock_Min_Bodega - COALESCE(e.Cantidad, 0)) as Cantidad_Faltante,
                    ibp.Punto_Reorden
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                INNER JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                ${whereClause}
                ORDER BY (ibp.Stock_Min_Bodega - COALESCE(e.Cantidad, 0)) DESC, i.Item_Nombre
            `;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener items en punto de reorden
     * @param {number} bodegaId - ID de bodega (opcional)
     */
    static async getItemsPuntoReorden(bodegaId = null) {
        try {
            let whereClause = `WHERE ibp.Es_Item_Activo_Bodega = 1
                              AND i.Item_Estado = 1
                              AND ibp.Punto_Reorden IS NOT NULL
                              AND COALESCE(e.Cantidad, 0) <= ibp.Punto_Reorden`;
            let params = [];

            if (bodegaId) {
                whereClause += ' AND ibp.Bodega_Id = ?';
                params.push(bodegaId);
            }

            const query = `
                SELECT 
                    ibp.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    b.Bodega_Nombre,
                    cat.CategoriaItem_Nombre,
                    um.UnidadMedida_Prefijo,
                    COALESCE(e.Cantidad, 0) as Cantidad_Actual
                FROM ${itemsBodegasParamsTable} ibp
                INNER JOIN ${itemsTable} i ON ibp.Item_Id = i.Item_Id
                INNER JOIN ${bodegasTable} b ON ibp.Bodega_Id = b.Bodega_Id
                INNER JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                INNER JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${existenciasTable} e ON ibp.Item_Id = e.Item_Id AND ibp.Bodega_Id = e.Bodega_Id
                ${whereClause}
                ORDER BY b.Bodega_Nombre, i.Item_Nombre
            `;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Configurar parámetros masivos para una bodega
     * @param {number} bodegaId - ID de la bodega
     * @param {Array} items - Array de items con sus parámetros
     * @param {number} usuarioId - ID del usuario que configura
     */
    static async configurarParametrosMasivos(bodegaId, items, usuarioId) {
        try {
            // Procesar cada item usando createOrUpdate (que ya maneja MERGE/ON DUPLICATE KEY)
            const results = [];
            
            for (const item of items) {
                const result = await this.createOrUpdate({
                    Item_Id: item.Item_Id,
                    Bodega_Id: bodegaId,
                    Stock_Min_Bodega: item.Stock_Min_Bodega || 0,
                    Stock_Max_Bodega: item.Stock_Max_Bodega || null,
                    Punto_Reorden: item.Punto_Reorden || null,
                    Es_Item_Activo_Bodega: item.Es_Item_Activo_Bodega !== undefined ? item.Es_Item_Activo_Bodega : true,
                    Usuario_Configuracion: usuarioId
                });
                results.push(result);
            }

            return { success: true, processed: items.length };
            
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ItemBodegaParamModel;
