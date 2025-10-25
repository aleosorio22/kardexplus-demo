const db = require('../../core/config/database');

// Detectar el dialecto de la base de datos
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';

// Nombres de tablas según el dialecto
const existenciasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Existencias' : 'Existencias';
const bodegasTable = DB_DIALECT === 'mssql' ? 'Warehouses.Bodegas' : 'Bodegas';
const itemsTable = DB_DIALECT === 'mssql' ? 'Items.Items' : 'Items';
const itemsPresentacionesTable = DB_DIALECT === 'mssql' ? 'Items.Items_Presentaciones' : 'Items_Presentaciones';
const categoriasTable = DB_DIALECT === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const unidadesTable = DB_DIALECT === 'mssql' ? 'Items.UnidadesMedida' : 'UnidadesMedida';
const itemsBodegasParametrosTable = DB_DIALECT === 'mssql' ? 'Warehouses.Items_Bodegas_Parametros' : 'Items_Bodegas_Parametros';

class ReporteModel {
    
    /**
     * Reporte de Inventario Actual
     * Muestra el inventario completo con SKU, nombre, cantidad, costo y precio de venta
     */
    static async getInventarioActual(filters = {}) {
        try {
            let whereClause = 'WHERE i.Item_Estado = 1';
            let params = [];

            // Filtro por bodega
            if (filters.bodega_id) {
                whereClause += ' AND e.Bodega_Id = ?';
                params.push(filters.bodega_id);
            }

            // Filtro por categoría
            if (filters.categoria_id) {
                whereClause += ' AND i.CategoriaItem_Id = ?';
                params.push(filters.categoria_id);
            }

            // Filtro de solo items con existencias
            if (filters.solo_con_stock === 'true') {
                whereClause += ' AND e.Cantidad > 0';
            }

            const query = `
                SELECT 
                    i.Item_Id,
                    i.Item_Codigo_SKU as SKU,
                    i.Item_Nombre as Nombre,
                    cat.CategoriaItem_Nombre as Categoria,
                    um.UnidadMedida_Nombre as Unidad_Medida,
                    b.Bodega_Nombre as Bodega,
                    ISNULL(e.Cantidad, 0) as Cantidad,
                    i.Item_Costo_Unitario as Costo_Unitario,
                    i.Item_Precio_Sugerido as Precio_Venta,
                    (ISNULL(e.Cantidad, 0) * ISNULL(i.Item_Costo_Unitario, 0)) as Valor_Total_Costo,
                    (ISNULL(e.Cantidad, 0) * ISNULL(i.Item_Precio_Sugerido, 0)) as Valor_Total_Venta,
                    ibp.Stock_Min_Bodega as Stock_Minimo,
                    ibp.Stock_Max_Bodega as Stock_Maximo,
                    ibp.Punto_Reorden,
                    CASE 
                        WHEN ISNULL(e.Cantidad, 0) = 0 THEN 'Sin Stock'
                        WHEN ibp.Stock_Min_Bodega IS NOT NULL AND e.Cantidad <= ibp.Stock_Min_Bodega THEN 'Stock Bajo'
                        WHEN ibp.Stock_Max_Bodega IS NOT NULL AND e.Cantidad >= ibp.Stock_Max_Bodega THEN 'Sobre Stock'
                        ELSE 'Normal'
                    END as Estado_Stock,
                    e.Fecha_Ultima_Actualizacion as Ultima_Actualizacion
                FROM ${itemsTable} i
                LEFT JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                LEFT JOIN ${unidadesTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${existenciasTable} e ON i.Item_Id = e.Item_Id
                LEFT JOIN ${bodegasTable} b ON e.Bodega_Id = b.Bodega_Id
                LEFT JOIN ${itemsBodegasParametrosTable} ibp ON i.Item_Id = ibp.Item_Id AND b.Bodega_Id = ibp.Bodega_Id
                ${whereClause}
                ORDER BY b.Bodega_Nombre, cat.CategoriaItem_Nombre, i.Item_Nombre
            `;

            const [rows] = await db.execute(query, params);
            
            // Calcular totales
            const totales = {
                total_items: rows.length,
                total_cantidad: rows.reduce((sum, row) => sum + (parseFloat(row.Cantidad) || 0), 0),
                total_valor_costo: rows.reduce((sum, row) => sum + (parseFloat(row.Valor_Total_Costo) || 0), 0),
                total_valor_venta: rows.reduce((sum, row) => sum + (parseFloat(row.Valor_Total_Venta) || 0), 0),
                margen_potencial: 0
            };

            totales.margen_potencial = totales.total_valor_venta - totales.total_valor_costo;

            return {
                items: rows,
                totales: totales,
                generado_en: new Date(),
                filtros_aplicados: filters
            };
        } catch (error) {
            console.error('Error en getInventarioActual:', error);
            throw error;
        }
    }

    /**
     * Reporte de Inventario por Bodega
     * Agrupa el inventario por bodega
     */
    static async getInventarioPorBodega(bodegaId = null) {
        try {
            let whereClause = 'WHERE i.Item_Estado = 1 AND b.Bodega_Estado = 1';
            let params = [];

            if (bodegaId) {
                whereClause += ' AND b.Bodega_Id = ?';
                params.push(bodegaId);
            }

            const query = `
                SELECT 
                    b.Bodega_Id,
                    b.Bodega_Nombre,
                    b.Bodega_Ubicacion,
                    CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido) as Bodega_Responsable,
                    COUNT(DISTINCT i.Item_Id) as Total_Items_Diferentes,
                    SUM(ISNULL(e.Cantidad, 0)) as Total_Cantidad,
                    SUM(ISNULL(e.Cantidad, 0) * ISNULL(i.Item_Costo_Unitario, 0)) as Valor_Total_Costo,
                    SUM(ISNULL(e.Cantidad, 0) * ISNULL(i.Item_Precio_Sugerido, 0)) as Valor_Total_Venta,
                    SUM(CASE WHEN ISNULL(e.Cantidad, 0) = 0 THEN 1 ELSE 0 END) as Items_Sin_Stock,
                    SUM(CASE WHEN ibp.Stock_Min_Bodega IS NOT NULL AND e.Cantidad <= ibp.Stock_Min_Bodega THEN 1 ELSE 0 END) as Items_Stock_Bajo
                FROM ${bodegasTable} b
                LEFT JOIN Security.Usuarios u ON b.Responsable_Id = u.Usuario_Id
                LEFT JOIN ${existenciasTable} e ON b.Bodega_Id = e.Bodega_Id
                LEFT JOIN ${itemsTable} i ON e.Item_Id = i.Item_Id
                LEFT JOIN ${itemsBodegasParametrosTable} ibp ON i.Item_Id = ibp.Item_Id AND b.Bodega_Id = ibp.Bodega_Id
                ${whereClause}
                GROUP BY b.Bodega_Id, b.Bodega_Nombre, b.Bodega_Ubicacion, u.Usuario_Nombre, u.Usuario_Apellido
                ORDER BY b.Bodega_Nombre
            `;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en getInventarioPorBodega:', error);
            throw error;
        }
    }

    /**
     * Reporte de Items con Stock Bajo
     */
    static async getItemsStockBajo(bodegaId = null) {
        try {
            let whereClause = `WHERE i.Item_Estado = 1 
                               AND ibp.Stock_Min_Bodega IS NOT NULL 
                               AND e.Cantidad <= ibp.Stock_Min_Bodega`;
            let params = [];

            if (bodegaId) {
                whereClause += ' AND e.Bodega_Id = ?';
                params.push(bodegaId);
            }

            const query = `
                SELECT 
                    i.Item_Codigo_SKU as SKU,
                    i.Item_Nombre as Nombre,
                    b.Bodega_Nombre as Bodega,
                    e.Cantidad as Cantidad_Actual,
                    ibp.Stock_Min_Bodega as Stock_Minimo,
                    (ibp.Stock_Min_Bodega - e.Cantidad) as Diferencia,
                    i.Item_Costo_Unitario as Costo_Unitario,
                    ((ibp.Stock_Min_Bodega - e.Cantidad) * i.Item_Costo_Unitario) as Costo_Reposicion_Sugerida,
                    e.Fecha_Ultima_Actualizacion as Ultima_Actualizacion
                FROM ${existenciasTable} e
                INNER JOIN ${bodegasTable} b ON e.Bodega_Id = b.Bodega_Id
                INNER JOIN ${itemsTable} i ON e.Item_Id = i.Item_Id
                INNER JOIN ${itemsBodegasParametrosTable} ibp ON i.Item_Id = ibp.Item_Id AND b.Bodega_Id = ibp.Bodega_Id
                ${whereClause}
                ORDER BY (ibp.Stock_Min_Bodega - e.Cantidad) DESC, b.Bodega_Nombre, i.Item_Nombre
            `;

            const [rows] = await db.execute(query, params);
            
            const total_costo_reposicion = rows.reduce((sum, row) => 
                sum + (parseFloat(row.Costo_Reposicion_Sugerida) || 0), 0
            );

            return {
                items: rows,
                total_items_bajo_stock: rows.length,
                total_costo_reposicion: total_costo_reposicion,
                generado_en: new Date()
            };
        } catch (error) {
            console.error('Error en getItemsStockBajo:', error);
            throw error;
        }
    }

    /**
     * Reporte de Valorización de Inventario
     */
    static async getValorizacionInventario(bodegaId = null) {
        try {
            let whereClause = 'WHERE i.Item_Estado = 1 AND e.Cantidad > 0';
            let params = [];

            if (bodegaId) {
                whereClause += ' AND e.Bodega_Id = ?';
                params.push(bodegaId);
            }

            const query = `
                SELECT 
                    cat.CategoriaItem_Nombre as Categoria,
                    COUNT(DISTINCT i.Item_Id) as Total_Items,
                    SUM(e.Cantidad) as Total_Cantidad,
                    SUM(e.Cantidad * i.Item_Costo_Unitario) as Valor_Costo,
                    SUM(e.Cantidad * i.Item_Precio_Sugerido) as Valor_Venta,
                    SUM((i.Item_Precio_Sugerido - i.Item_Costo_Unitario) * e.Cantidad) as Margen_Potencial,
                    CASE 
                        WHEN SUM(e.Cantidad * i.Item_Costo_Unitario) > 0 
                        THEN (SUM((i.Item_Precio_Sugerido - i.Item_Costo_Unitario) * e.Cantidad) / 
                              SUM(e.Cantidad * i.Item_Costo_Unitario)) * 100
                        ELSE 0
                    END as Porcentaje_Margen
                FROM ${existenciasTable} e
                INNER JOIN ${itemsTable} i ON e.Item_Id = i.Item_Id
                LEFT JOIN ${categoriasTable} cat ON i.CategoriaItem_Id = cat.CategoriaItem_Id
                ${whereClause}
                GROUP BY cat.CategoriaItem_Nombre
                ORDER BY Valor_Costo DESC
            `;

            const [rows] = await db.execute(query, params);
            
            const totales = {
                total_categorias: rows.length,
                total_items: rows.reduce((sum, row) => sum + parseInt(row.Total_Items || 0), 0),
                total_cantidad: rows.reduce((sum, row) => sum + parseFloat(row.Total_Cantidad || 0), 0),
                total_valor_costo: rows.reduce((sum, row) => sum + parseFloat(row.Valor_Costo || 0), 0),
                total_valor_venta: rows.reduce((sum, row) => sum + parseFloat(row.Valor_Venta || 0), 0),
                total_margen: rows.reduce((sum, row) => sum + parseFloat(row.Margen_Potencial || 0), 0)
            };

            totales.porcentaje_margen_global = totales.total_valor_costo > 0 
                ? (totales.total_margen / totales.total_valor_costo) * 100 
                : 0;

            return {
                categorias: rows,
                totales: totales,
                generado_en: new Date()
            };
        } catch (error) {
            console.error('Error en getValorizacionInventario:', error);
            throw error;
        }
    }
}

module.exports = ReporteModel;
