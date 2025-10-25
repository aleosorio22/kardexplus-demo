const db = require('../../core/config/database');

// Detección de dialecto y definición de tablas con schemas
const dialect = process.env.DB_DIALECT || 'mysql';
const movimientosTable = dialect === 'mssql' ? 'Warehouses.Movimientos' : 'Movimientos';
const movimientosDetalleTable = dialect === 'mssql' ? 'Warehouses.Movimientos_Detalle' : 'Movimientos_Detalle';
const itemsTable = dialect === 'mssql' ? 'Items.Items' : 'Items';
const itemsPresentacionesTable = dialect === 'mssql' ? 'Items.Items_Presentaciones' : 'Items_Presentaciones';
const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';
const bodegasTable = dialect === 'mssql' ? 'Warehouses.Bodegas' : 'Bodegas';
const existenciasTable = dialect === 'mssql' ? 'Warehouses.Existencias' : 'Existencias';
const categoriasTable = dialect === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const unidadesMedidaTable = dialect === 'mssql' ? 'Items.UnidadesMedida' : 'UnidadesMedida';

class MovimientoModel {
    
    // =======================================
    // FUNCIÓN AUXILIAR PARA CÁLCULOS
    // =======================================
    
    /**
     * Calcular cantidad en unidades base para un item
     * @param {object} connection - Conexión a la base de datos
     * @param {object} item - Item con datos de presentación
     * @returns {object} - Datos calculados del item
     */
    static async calcularCantidadItem(connection, item) {
        if (!item.Item_Id) {
            throw new Error('Cada item debe tener ID válido');
        }

        // Determinar si es movimiento por presentación
        const esPorPresentacion = !!(item.Item_Presentaciones_Id && item.Cantidad_Presentacion);
        
        let cantidadFinal = item.Cantidad || 0; // Cantidad por defecto
        
        // Si es movimiento por presentación, calcular cantidad automáticamente
        if (esPorPresentacion) {
            if (!item.Cantidad_Presentacion || item.Cantidad_Presentacion <= 0) {
                throw new Error(`Item ${item.Item_Id}: Cantidad_Presentacion debe ser mayor a 0 para movimientos por presentación`);
            }
            
            // Obtener la cantidad base de la presentación
            const [presentacionRows] = await connection.execute(
                `SELECT Cantidad_Base, Presentacion_Nombre FROM ${itemsPresentacionesTable} WHERE Item_Presentaciones_Id = ?`,
                [item.Item_Presentaciones_Id]
            );
            
            if (!presentacionRows || presentacionRows.length === 0) {
                throw new Error(`No se encontró la presentación con ID ${item.Item_Presentaciones_Id}`);
            }
            
            const cantidadBase = presentacionRows[0].Cantidad_Base;
            const presentacionNombre = presentacionRows[0].Presentacion_Nombre;
            cantidadFinal = item.Cantidad_Presentacion * cantidadBase;
            
            console.log(`🧮 Cálculo automático para item ${item.Item_Id} (${presentacionNombre}):`, {
                Cantidad_Presentacion: item.Cantidad_Presentacion,
                Cantidad_Base: cantidadBase,
                Cantidad_Calculada: cantidadFinal,
                Item_Presentaciones_Id: item.Item_Presentaciones_Id
            });
        } else {
            // Para movimientos normales, validar que tenga cantidad
            if (!cantidadFinal || cantidadFinal <= 0) {
                throw new Error(`Item ${item.Item_Id}: Cantidad debe ser mayor a 0`);
            }
        }
        
        return {
            ...item,
            cantidadFinal,
            esPorPresentacion
        };
    }
    
    // =======================================
    // MÉTODOS DE CONSULTA
    // =======================================

    /**
     * Obtener todos los movimientos sin paginación (para DataTable frontend)
     * @param {object} filters - Filtros de búsqueda
     */
    static async findAll(filters = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];

            // Filtro por tipo de movimiento
            if (filters.tipo_movimiento) {
                whereClause += ' AND m.Tipo_Movimiento = ?';
                params.push(filters.tipo_movimiento);
            }

            // Filtro por bodega (origen o destino)
            if (filters.bodega_id) {
                whereClause += ' AND (m.Origen_Bodega_Id = ? OR m.Destino_Bodega_Id = ?)';
                params.push(filters.bodega_id, filters.bodega_id);
            }

            // Filtro por usuario
            if (filters.usuario_id) {
                whereClause += ' AND m.Usuario_Id = ?';
                params.push(filters.usuario_id);
            }

            // Filtro por rango de fechas
            if (filters.fecha_inicio) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) >= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) >= ?';
                }
                params.push(filters.fecha_inicio);
            }

            if (filters.fecha_fin) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) <= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) <= ?';
                }
                params.push(filters.fecha_fin);
            }

            // Filtro por item específico
            if (filters.item_id) {
                whereClause += ` AND EXISTS (SELECT 1 FROM ${movimientosDetalleTable} md WHERE md.Movimiento_Id = m.Movimiento_Id AND md.Item_Id = ?)`;
                params.push(filters.item_id);
            }

            // Búsqueda por texto (motivo u observaciones)
            if (filters.search) {
                whereClause += ' AND (m.Motivo LIKE ? OR m.Observaciones LIKE ? OR u.Usuario_Nombre LIKE ? OR u.Usuario_Apellido LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // CONCAT compatible con SQL Server
            const concatUsuario = dialect === 'mssql' 
                ? "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)" 
                : "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)";

            const query = `
                SELECT 
                    m.*,
                    ${concatUsuario} as Usuario_Nombre_Completo,
                    bo.Bodega_Nombre as Origen_Bodega_Nombre,
                    bd.Bodega_Nombre as Destino_Bodega_Nombre,
                    COUNT(md.Item_Id) as Total_Items,
                    SUM(md.Cantidad) as Total_Cantidad
                FROM ${movimientosTable} m
                INNER JOIN ${usuariosTable} u ON m.Usuario_Id = u.Usuario_Id
                LEFT JOIN ${bodegasTable} bo ON m.Origen_Bodega_Id = bo.Bodega_Id
                LEFT JOIN ${bodegasTable} bd ON m.Destino_Bodega_Id = bd.Bodega_Id
                LEFT JOIN ${movimientosDetalleTable} md ON m.Movimiento_Id = md.Movimiento_Id
                ${whereClause}
                GROUP BY m.Movimiento_Id, m.Tipo_Movimiento, m.Fecha, m.Usuario_Id, m.Recepcionista, 
                         m.Origen_Bodega_Id, m.Destino_Bodega_Id, m.Motivo, m.Observaciones,
                         u.Usuario_Nombre, u.Usuario_Apellido, bo.Bodega_Nombre, bd.Bodega_Nombre
                ORDER BY m.Fecha DESC
            `;

            const [rows] = await db.execute(query, params);
            return rows;

        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Obtener todos los movimientos con paginación y filtros
     * @param {number} offset - Desplazamiento para paginación
     * @param {number} limit - Límite de resultados
     * @param {object} filters - Filtros de búsqueda
     */
    static async findWithPagination(offset = 0, limit = 10, filters = {}) {
        try {
            offset = parseInt(offset) || 0;
            limit = parseInt(limit) || 10;
            
            let whereClause = 'WHERE 1=1';
            let params = [];

            // Filtro por tipo de movimiento
            if (filters.tipo_movimiento) {
                whereClause += ' AND m.Tipo_Movimiento = ?';
                params.push(filters.tipo_movimiento);
            }

            // Filtro por bodega (origen o destino)
            if (filters.bodega_id) {
                whereClause += ' AND (m.Origen_Bodega_Id = ? OR m.Destino_Bodega_Id = ?)';
                params.push(filters.bodega_id, filters.bodega_id);
            }

            // Filtro por usuario
            if (filters.usuario_id) {
                whereClause += ' AND m.Usuario_Id = ?';
                params.push(filters.usuario_id);
            }

            // Filtro por rango de fechas
            if (filters.fecha_inicio) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) >= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) >= ?';
                }
                params.push(filters.fecha_inicio);
            }

            if (filters.fecha_fin) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) <= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) <= ?';
                }
                params.push(filters.fecha_fin);
            }

            // Filtro por item específico
            if (filters.item_id) {
                whereClause += ` AND EXISTS (SELECT 1 FROM ${movimientosDetalleTable} md WHERE md.Movimiento_Id = m.Movimiento_Id AND md.Item_Id = ?)`;
                params.push(filters.item_id);
            }

            // Búsqueda por texto
            if (filters.search) {
                whereClause += ' AND (m.Motivo LIKE ? OR m.Observaciones LIKE ? OR u.Usuario_Nombre LIKE ? OR u.Usuario_Apellido LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // CONCAT compatible
            const concatUsuario = dialect === 'mssql' 
                ? "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)" 
                : "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)";

            // Paginación adaptativa
            const paginationClause = dialect === 'mssql'
                ? `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
                : `LIMIT ${offset}, ${limit}`;

            const query = `
                SELECT 
                    m.*,
                    ${concatUsuario} as Usuario_Nombre_Completo,
                    bo.Bodega_Nombre as Origen_Bodega_Nombre,
                    bd.Bodega_Nombre as Destino_Bodega_Nombre,
                    COUNT(md.Item_Id) as Total_Items,
                    SUM(md.Cantidad) as Total_Cantidad
                FROM ${movimientosTable} m
                INNER JOIN ${usuariosTable} u ON m.Usuario_Id = u.Usuario_Id
                LEFT JOIN ${bodegasTable} bo ON m.Origen_Bodega_Id = bo.Bodega_Id
                LEFT JOIN ${bodegasTable} bd ON m.Destino_Bodega_Id = bd.Bodega_Id
                LEFT JOIN ${movimientosDetalleTable} md ON m.Movimiento_Id = md.Movimiento_Id
                ${whereClause}
                GROUP BY m.Movimiento_Id, m.Tipo_Movimiento, m.Fecha, m.Usuario_Id, m.Recepcionista, 
                         m.Origen_Bodega_Id, m.Destino_Bodega_Id, m.Motivo, m.Observaciones,
                         u.Usuario_Nombre, u.Usuario_Apellido, bo.Bodega_Nombre, bd.Bodega_Nombre
                ORDER BY m.Fecha DESC
                ${paginationClause}
            `;

            const [rows] = await db.execute(query, params);
            
            // Contar total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT m.Movimiento_Id) as total
                FROM ${movimientosTable} m
                INNER JOIN ${usuariosTable} u ON m.Usuario_Id = u.Usuario_Id
                LEFT JOIN ${bodegasTable} bo ON m.Origen_Bodega_Id = bo.Bodega_Id
                LEFT JOIN ${bodegasTable} bd ON m.Destino_Bodega_Id = bd.Bodega_Id
                LEFT JOIN ${movimientosDetalleTable} md ON m.Movimiento_Id = md.Movimiento_Id
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
     * Obtener movimiento por ID con detalle completo
     * @param {number} movimientoId - ID del movimiento
     */
    static async findById(movimientoId) {
        try {
            const concatUsuario = dialect === 'mssql' 
                ? "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)" 
                : "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)";

            const movimientoQuery = `
                SELECT 
                    m.*,
                    ${concatUsuario} as Usuario_Nombre_Completo,
                    bo.Bodega_Nombre as Origen_Bodega_Nombre,
                    bd.Bodega_Nombre as Destino_Bodega_Nombre
                FROM ${movimientosTable} m
                INNER JOIN ${usuariosTable} u ON m.Usuario_Id = u.Usuario_Id
                LEFT JOIN ${bodegasTable} bo ON m.Origen_Bodega_Id = bo.Bodega_Id
                LEFT JOIN ${bodegasTable} bd ON m.Destino_Bodega_Id = bd.Bodega_Id
                WHERE m.Movimiento_Id = ?
            `;

            // Conversión IS NOT NULL para BIT en SQL Server
            const esPorPresentacionExpr = dialect === 'mssql'
                ? "CASE WHEN md.Item_Presentaciones_Id IS NOT NULL THEN 1 ELSE 0 END"
                : "(md.Item_Presentaciones_Id IS NOT NULL)";

            // Usar ISNULL/IFNULL para valores por defecto
            const nullFunc = dialect === 'mssql' ? 'ISNULL' : 'IFNULL';
            const castDecimal = dialect === 'mssql' 
                ? 'CAST(md.Cantidad_Presentacion AS DECIMAL(14,4))'
                : 'md.Cantidad_Presentacion';
            
            const detalleQuery = `
                SELECT 
                    md.Movimiento_Detalle_Id,
                    md.Movimiento_Id,
                    md.Item_Id,
                    md.Item_Presentaciones_Id,
                    ${nullFunc}(${castDecimal}, 0) as Cantidad_Presentacion,
                    md.Cantidad,
                    ${nullFunc}(md.Es_Movimiento_Por_Presentacion, 0) as Es_Movimiento_Por_Presentacion,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU as Item_Codigo,
                    i.Item_Nombre as Item_Descripcion,
                    i.Item_Codigo_Barra,
                    i.Item_Costo_Unitario,
                    c.CategoriaItem_Nombre,
                    um.UnidadMedida_Nombre,
                    um.UnidadMedida_Prefijo as Item_Unidad_Medida,
                    ip.Presentacion_Nombre,
                    ${nullFunc}(ip.Cantidad_Base, 1) as Factor_Conversion,
                    um.UnidadMedida_Nombre as Presentacion_Unidad_Nombre,
                    um.UnidadMedida_Prefijo as Presentacion_Unidad_Prefijo,
                    (md.Cantidad * i.Item_Costo_Unitario) as Valor_Total
                FROM ${movimientosDetalleTable} md
                INNER JOIN ${itemsTable} i ON md.Item_Id = i.Item_Id
                INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
                INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
                LEFT JOIN ${itemsPresentacionesTable} ip ON md.Item_Presentaciones_Id = ip.Item_Presentaciones_Id
                WHERE md.Movimiento_Id = ?
                ORDER BY i.Item_Nombre
            `;

            const [movimientoRows] = await db.execute(movimientoQuery, [movimientoId]);
            const [detalleRows] = await db.execute(detalleQuery, [movimientoId]);

            if (!movimientoRows || movimientoRows.length === 0) {
                return null;
            }

            return {
                ...movimientoRows[0],
                detalles: detalleRows
            };
        } catch (error) {
            throw error;
        }
    }

    // =======================================
    // MÉTODOS DE CREACIÓN DE MOVIMIENTOS
    // =======================================

    /**
     * Crear movimiento de entrada
     * @param {object} movimientoData - Datos del movimiento
     * @param {array} items - Array de items con cantidad
     */
    static async crearEntrada(movimientoData, items) {
        const connection = await db.getConnection();
        
        try {
            // Nota: En SQL Server con triggers INSTEAD OF INSERT, no usamos BEGIN TRANSACTION manual
            // Los triggers manejan la transacción automáticamente

            // Validaciones
            if (!movimientoData.Destino_Bodega_Id) {
                throw new Error('La bodega de destino es requerida para entradas');
            }

            if (!items || items.length === 0) {
                throw new Error('Debe especificar al menos un item');
            }

            // Crear el movimiento principal
            let movimientoQuery;
            if (dialect === 'mssql') {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Destino_Bodega_Id, 
                        Recepcionista, Motivo, Observaciones
                    )
                    OUTPUT INSERTED.Movimiento_Id
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
            } else {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Destino_Bodega_Id, 
                        Recepcionista, Motivo, Observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
            }

            const [movimientoResult] = await connection.execute(movimientoQuery, [
                'Entrada',
                movimientoData.Usuario_Id,
                movimientoData.Destino_Bodega_Id,
                movimientoData.Recepcionista || null,
                movimientoData.Motivo || null,
                movimientoData.Observaciones || null
            ]);

            // Obtener ID insertado
            const movimientoId = dialect === 'mssql' 
                ? movimientoResult[0].Movimiento_Id 
                : movimientoResult.insertId;

            // Crear el detalle - El trigger TR_MovimientosDetalle_ActualizarExistencias se encarga del stock
            for (const item of items) {
                // Calcular cantidad usando función auxiliar
                const itemCalculado = await this.calcularCantidadItem(connection, item);
                
                console.log(`🏗️ MovimientoModel: Insertando detalle para item ${item.Item_Id}:`, {
                    Item_Presentaciones_Id: itemCalculado.Item_Presentaciones_Id || null,
                    Cantidad_Presentacion: itemCalculado.Cantidad_Presentacion || null,
                    Es_Movimiento_Por_Presentacion: itemCalculado.esPorPresentacion,
                    Cantidad_Final: itemCalculado.cantidadFinal
                });
                
                // Insertar detalle con soporte para presentaciones
                const detalleQuery = `
                    INSERT INTO ${movimientosDetalleTable} (
                        Movimiento_Id, 
                        Item_Id, 
                        Item_Presentaciones_Id,
                        Cantidad, 
                        Cantidad_Presentacion,
                        Es_Movimiento_Por_Presentacion
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                await connection.execute(detalleQuery, [
                    movimientoId, 
                    itemCalculado.Item_Id, 
                    itemCalculado.Item_Presentaciones_Id || null,
                    itemCalculado.cantidadFinal,
                    itemCalculado.Cantidad_Presentacion || null,
                    itemCalculado.esPorPresentacion ? 1 : 0
                ]);
            }

            return movimientoId;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Crear movimiento de salida
     * @param {object} movimientoData - Datos del movimiento
     * @param {array} items - Array de items con cantidad
     */
    static async crearSalida(movimientoData, items) {
        const connection = await db.getConnection();
        
        try {
            // Validaciones
            if (!movimientoData.Origen_Bodega_Id) {
                throw new Error('La bodega de origen es requerida para salidas');
            }

            if (!items || items.length === 0) {
                throw new Error('Debe especificar al menos un item');
            }

            // Validar stock suficiente para cada item (pre-validación antes del trigger)
            for (const item of items) {
                if (!item.Item_Id || !item.Cantidad || item.Cantidad <= 0) {
                    throw new Error('Cada item debe tener ID y cantidad válida');
                }

                // ISNULL en SQL Server, IFNULL en MySQL
                const nullFunction = dialect === 'mssql' ? 'ISNULL' : 'IFNULL';
                
                const [stockRows] = await connection.execute(
                    `SELECT ${nullFunction}(Cantidad, 0) as Stock_Actual FROM ${existenciasTable} WHERE Bodega_Id = ? AND Item_Id = ?`,
                    [movimientoData.Origen_Bodega_Id, item.Item_Id]
                );

                const stockActual = stockRows && stockRows.length > 0 ? stockRows[0].Stock_Actual : 0;
                
                if (stockActual < item.Cantidad) {
                    // Obtener nombre del item para error más descriptivo
                    const [itemRows] = await connection.execute(
                        `SELECT Item_Nombre FROM ${itemsTable} WHERE Item_Id = ?`,
                        [item.Item_Id]
                    );
                    const itemNombre = itemRows && itemRows.length > 0 ? itemRows[0].Item_Nombre : `Item ID ${item.Item_Id}`;
                    
                    throw new Error(`Stock insuficiente para ${itemNombre}. Stock actual: ${stockActual}, Solicitado: ${item.Cantidad}`);
                }
            }

            // Crear el movimiento principal
            let movimientoQuery;
            if (dialect === 'mssql') {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Origen_Bodega_Id, 
                        Recepcionista, Motivo, Observaciones
                    )
                    OUTPUT INSERTED.Movimiento_Id
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
            } else {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Origen_Bodega_Id, 
                        Recepcionista, Motivo, Observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
            }

            const [movimientoResult] = await connection.execute(movimientoQuery, [
                'Salida',
                movimientoData.Usuario_Id,
                movimientoData.Origen_Bodega_Id,
                movimientoData.Recepcionista || null,
                movimientoData.Motivo || null,
                movimientoData.Observaciones || null
            ]);

            const movimientoId = dialect === 'mssql' 
                ? movimientoResult[0].Movimiento_Id 
                : movimientoResult.insertId;

            // Crear el detalle - Los triggers se encargan de validación y actualización de stock
            for (const item of items) {
                const detalleQuery = `
                    INSERT INTO ${movimientosDetalleTable} (
                        Movimiento_Id, 
                        Item_Id, 
                        Cantidad,
                        Item_Presentaciones_Id,
                        Cantidad_Presentacion,
                        Es_Movimiento_Por_Presentacion
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                await connection.execute(detalleQuery, [
                    movimientoId, 
                    item.Item_Id, 
                    item.Cantidad,
                    item.Item_Presentaciones_Id || null,
                    item.Cantidad_Presentacion || null,
                    item.Es_Movimiento_Por_Presentacion || 0
                ]);
            }

            return movimientoId;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Crear movimiento de transferencia
     * @param {object} movimientoData - Datos del movimiento
     * @param {array} items - Array de items con cantidad
     */
    static async crearTransferencia(movimientoData, items) {
        const connection = await db.getConnection();
        
        try {
            // Validaciones
            if (!movimientoData.Origen_Bodega_Id || !movimientoData.Destino_Bodega_Id) {
                throw new Error('Las bodegas de origen y destino son requeridas para transferencias');
            }

            if (movimientoData.Origen_Bodega_Id === movimientoData.Destino_Bodega_Id) {
                throw new Error('Las bodegas de origen y destino deben ser diferentes');
            }

            if (!items || items.length === 0) {
                throw new Error('Debe especificar al menos un item');
            }

            // Validar stock suficiente en origen
            const nullFunction = dialect === 'mssql' ? 'ISNULL' : 'IFNULL';
            
            for (const item of items) {
                if (!item.Item_Id || !item.Cantidad || item.Cantidad <= 0) {
                    throw new Error('Cada item debe tener ID y cantidad válida');
                }

                const [stockRows] = await connection.execute(
                    `SELECT ${nullFunction}(Cantidad, 0) as Stock_Actual FROM ${existenciasTable} WHERE Bodega_Id = ? AND Item_Id = ?`,
                    [movimientoData.Origen_Bodega_Id, item.Item_Id]
                );

                const stockActual = stockRows && stockRows.length > 0 ? stockRows[0].Stock_Actual : 0;
                
                if (stockActual < item.Cantidad) {
                    const [itemRows] = await connection.execute(
                        `SELECT Item_Nombre FROM ${itemsTable} WHERE Item_Id = ?`,
                        [item.Item_Id]
                    );
                    const itemNombre = itemRows && itemRows.length > 0 ? itemRows[0].Item_Nombre : `Item ID ${item.Item_Id}`;
                    
                    throw new Error(`Stock insuficiente en bodega origen para ${itemNombre}. Stock actual: ${stockActual}, Solicitado: ${item.Cantidad}`);
                }
            }

            // Crear el movimiento principal
            let movimientoQuery;
            if (dialect === 'mssql') {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Origen_Bodega_Id, Destino_Bodega_Id,
                        Recepcionista, Motivo, Observaciones
                    )
                    OUTPUT INSERTED.Movimiento_Id
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
            } else {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Origen_Bodega_Id, Destino_Bodega_Id,
                        Recepcionista, Motivo, Observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
            }

            const [movimientoResult] = await connection.execute(movimientoQuery, [
                'Transferencia',
                movimientoData.Usuario_Id,
                movimientoData.Origen_Bodega_Id,
                movimientoData.Destino_Bodega_Id,
                movimientoData.Recepcionista || null,
                movimientoData.Motivo || null,
                movimientoData.Observaciones || null
            ]);

            const movimientoId = dialect === 'mssql' 
                ? movimientoResult[0].Movimiento_Id 
                : movimientoResult.insertId;

            // Crear el detalle - Los triggers se encargan del resto
            for (const item of items) {
                const detalleQuery = `
                    INSERT INTO ${movimientosDetalleTable} (
                        Movimiento_Id, 
                        Item_Id, 
                        Cantidad,
                        Item_Presentaciones_Id,
                        Cantidad_Presentacion,
                        Es_Movimiento_Por_Presentacion
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                await connection.execute(detalleQuery, [
                    movimientoId, 
                    item.Item_Id, 
                    item.Cantidad,
                    item.Item_Presentaciones_Id || null,
                    item.Cantidad_Presentacion || null,
                    item.Es_Movimiento_Por_Presentacion || 0
                ]);
            }

            return movimientoId;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Crear movimiento de ajuste (para correcciones de inventario)
     * @param {object} movimientoData - Datos del movimiento
     * @param {array} items - Array de items con cantidad (cantidad final deseada)
     */
    static async crearAjuste(movimientoData, items) {
        const connection = await db.getConnection();
        
        try {
            // Validaciones
            if (!movimientoData.Destino_Bodega_Id) {
                throw new Error('La bodega es requerida para ajustes');
            }

            if (!items || items.length === 0) {
                throw new Error('Debe especificar al menos un item');
            }

            // Validar que se proporcione motivo para ajustes
            if (!movimientoData.Motivo) {
                throw new Error('El motivo es obligatorio para ajustes de inventario');
            }

            // Crear el movimiento principal
            let movimientoQuery;
            if (dialect === 'mssql') {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Destino_Bodega_Id,
                        Recepcionista, Motivo, Observaciones
                    )
                    OUTPUT INSERTED.Movimiento_Id
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
            } else {
                movimientoQuery = `
                    INSERT INTO ${movimientosTable} (
                        Tipo_Movimiento, Usuario_Id, Destino_Bodega_Id,
                        Recepcionista, Motivo, Observaciones
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
            }

            const [movimientoResult] = await connection.execute(movimientoQuery, [
                'Ajuste',
                movimientoData.Usuario_Id,
                movimientoData.Destino_Bodega_Id,
                movimientoData.Recepcionista || null,
                movimientoData.Motivo,
                movimientoData.Observaciones || null
            ]);

            const movimientoId = dialect === 'mssql' 
                ? movimientoResult[0].Movimiento_Id 
                : movimientoResult.insertId;

            // Procesar cada item del ajuste
            const nullFunction = dialect === 'mssql' ? 'ISNULL' : 'IFNULL';
            
            for (const item of items) {
                if (!item.Item_Id || item.Cantidad === undefined || item.Cantidad < 0) {
                    throw new Error('Cada item debe tener ID y cantidad válida (>= 0)');
                }

                // Obtener cantidad actual
                const [stockRows] = await connection.execute(
                    `SELECT ${nullFunction}(Cantidad, 0) as Stock_Actual FROM ${existenciasTable} WHERE Bodega_Id = ? AND Item_Id = ?`,
                    [movimientoData.Destino_Bodega_Id, item.Item_Id]
                );

                const stockActual = stockRows && stockRows.length > 0 ? stockRows[0].Stock_Actual : 0;
                const diferencia = item.Cantidad - stockActual;

                // Solo registrar el movimiento si hay diferencia
                if (diferencia !== 0) {
                    const detalleQuery = `
                        INSERT INTO ${movimientosDetalleTable} (
                            Movimiento_Id, 
                            Item_Id, 
                            Cantidad,
                            Item_Presentaciones_Id,
                            Cantidad_Presentacion,
                            Es_Movimiento_Por_Presentacion
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.execute(detalleQuery, [
                        movimientoId, 
                        item.Item_Id, 
                        item.Cantidad, // Para ajustes, guardamos la cantidad final
                        item.Item_Presentaciones_Id || null,
                        item.Cantidad_Presentacion || null,
                        item.Es_Movimiento_Por_Presentacion || 0
                    ]);
                }
            }

            return movimientoId;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    // =======================================
    // MÉTODOS DE CONSULTA ESPECIALIZADOS
    // =======================================

    /**
     * Obtener kardex de un item específico
     * @param {number} itemId - ID del item
     * @param {number} bodegaId - ID de la bodega (opcional)
     * @param {string} fechaInicio - Fecha inicial
     * @param {string} fechaFin - Fecha final
     */
    static async getKardexItem(itemId, bodegaId = null, fechaInicio = null, fechaFin = null) {
        try {
            let whereClause = 'WHERE md.Item_Id = ?';
            let params = [itemId];

            if (bodegaId) {
                whereClause += ' AND (m.Origen_Bodega_Id = ? OR m.Destino_Bodega_Id = ?)';
                params.push(bodegaId, bodegaId);
            }

            if (fechaInicio) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) >= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) >= ?';
                }
                params.push(fechaInicio);
            }

            if (fechaFin) {
                if (dialect === 'mssql') {
                    whereClause += ' AND CAST(m.Fecha AS DATE) <= ?';
                } else {
                    whereClause += ' AND DATE(m.Fecha) <= ?';
                }
                params.push(fechaFin);
            }

            const concatUsuario = dialect === 'mssql' 
                ? "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)" 
                : "CONCAT(u.Usuario_Nombre, ' ', u.Usuario_Apellido)";

            const query = `
                SELECT 
                    m.Movimiento_Id,
                    m.Tipo_Movimiento,
                    m.Fecha,
                    m.Motivo,
                    md.Cantidad,
                    bo.Bodega_Nombre as Bodega_Origen,
                    bd.Bodega_Nombre as Bodega_Destino,
                    ${concatUsuario} as Usuario,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU
                FROM ${movimientosTable} m
                INNER JOIN ${movimientosDetalleTable} md ON m.Movimiento_Id = md.Movimiento_Id
                INNER JOIN ${itemsTable} i ON md.Item_Id = i.Item_Id
                INNER JOIN ${usuariosTable} u ON m.Usuario_Id = u.Usuario_Id
                LEFT JOIN ${bodegasTable} bo ON m.Origen_Bodega_Id = bo.Bodega_Id
                LEFT JOIN ${bodegasTable} bd ON m.Destino_Bodega_Id = bd.Bodega_Id
                ${whereClause}
                ORDER BY m.Fecha ASC
            `;

            const [rows] = await db.execute(query, params);
            return rows;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener resumen de movimientos por período
     * @param {string} fechaInicio - Fecha inicial
     * @param {string} fechaFin - Fecha final
     * @param {string} tipoMovimiento - Tipo específico (opcional)
     */
    static async getResumenPorPeriodo(fechaInicio, fechaFin, tipoMovimiento = null) {
        try {
            const dateFunction = dialect === 'mssql' ? 'CAST(m.Fecha AS DATE)' : 'DATE(m.Fecha)';
            
            let whereClause = `WHERE ${dateFunction} BETWEEN ? AND ?`;
            let params = [fechaInicio, fechaFin];

            if (tipoMovimiento) {
                whereClause += ' AND m.Tipo_Movimiento = ?';
                params.push(tipoMovimiento);
            }

            // COALESCE es compatible con ambos
            const query = `
                SELECT 
                    m.Tipo_Movimiento,
                    COUNT(DISTINCT m.Movimiento_Id) as Total_Movimientos,
                    SUM(md.Cantidad) as Total_Cantidad,
                    COUNT(DISTINCT md.Item_Id) as Items_Diferentes,
                    COUNT(DISTINCT COALESCE(m.Origen_Bodega_Id, m.Destino_Bodega_Id)) as Bodegas_Afectadas
                FROM ${movimientosTable} m
                INNER JOIN ${movimientosDetalleTable} md ON m.Movimiento_Id = md.Movimiento_Id
                ${whereClause}
                GROUP BY m.Tipo_Movimiento
                ORDER BY Total_Movimientos DESC
            `;

            const [rows] = await db.execute(query, params);
            return rows;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener stock actual de un item en una bodega específica
     * @param {number} itemId - ID del item
     * @param {number} bodegaId - ID de la bodega
     */
    static async getStockActual(itemId, bodegaId) {
        try {
            const nullFunction = dialect === 'mssql' ? 'ISNULL' : 'IFNULL';
            
            const [rows] = await db.execute(
                `SELECT ${nullFunction}(Cantidad, 0) as Stock_Actual FROM ${existenciasTable} WHERE Item_Id = ? AND Bodega_Id = ?`,
                [itemId, bodegaId]
            );

            return rows && rows.length > 0 ? rows[0].Stock_Actual : 0;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = MovimientoModel;
