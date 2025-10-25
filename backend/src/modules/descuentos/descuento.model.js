const db = require('../../core/config/database');

// Detección de dialecto y definición de tablas con schemas
const dialect = process.env.DB_DIALECT || 'mysql';
const descuentosTable = dialect === 'mssql' ? 'Items.Descuentos' : 'Descuentos';
const itemsTable = dialect === 'mssql' ? 'Items.Items' : 'Items';
const itemsPresentacionesTable = dialect === 'mssql' ? 'Items.Items_Presentaciones' : 'Items_Presentaciones';
const usuariosTable = dialect === 'mssql' ? 'Security.Usuarios' : 'Usuarios';

class DescuentoModel {
    
    /**
     * Obtener todos los descuentos con filtros opcionales
     */
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT 
                    d.Descuento_Id,
                    d.Item_Id,
                    d.Item_Presentaciones_Id,
                    d.Descuento_Tipo,
                    d.Descuento_Valor,
                    d.Cantidad_Minima,
                    d.Descuento_Fecha_Inicio,
                    d.Descuento_Fecha_Fin,
                    d.Descuento_Prioridad,
                    d.Es_Combinable,
                    d.Descuento_Estado,
                    d.Descuento_Descripcion,
                    d.Fecha_Creacion,
                    d.Fecha_Modificacion,
                    COALESCE(i.Item_Nombre, i2.Item_Nombre) as Item_Nombre,
                    COALESCE(i.Item_Codigo_SKU, i2.Item_Codigo_SKU) as Item_Codigo_SKU,
                    ip.Presentacion_Nombre,
                    ip.Cantidad_Base as Presentacion_Cantidad_Base,
                    uc.Usuario_Nombre as Usuario_Creacion_Nombre,
                    uc.Usuario_Apellido as Usuario_Creacion_Apellido,
                    um.Usuario_Nombre as Usuario_Modificacion_Nombre,
                    um.Usuario_Apellido as Usuario_Modificacion_Apellido
                FROM ${descuentosTable} d
                LEFT JOIN ${itemsTable} i ON d.Item_Id = i.Item_Id
                LEFT JOIN ${itemsPresentacionesTable} ip ON d.Item_Presentaciones_Id = ip.Item_Presentaciones_Id
                LEFT JOIN ${itemsTable} i2 ON ip.Item_Id = i2.Item_Id
                LEFT JOIN ${usuariosTable} uc ON d.Usuario_Creacion_Id = uc.Usuario_Id
                LEFT JOIN ${usuariosTable} um ON d.Usuario_Modificacion_Id = um.Usuario_Id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Filtros opcionales
            if (filters.estado !== undefined) {
                query += ` AND d.Descuento_Estado = ?`;
                params.push(filters.estado);
            }
            
            // Si se busca por item_id, incluir descuentos del item Y de sus presentaciones
            if (filters.item_id) {
                query += ` AND (d.Item_Id = ? OR ip.Item_Id = ?)`;
                params.push(filters.item_id);
                params.push(filters.item_id);
            }
            
            if (filters.presentacion_id) {
                query += ` AND d.Item_Presentaciones_Id = ?`;
                params.push(filters.presentacion_id);
            }
            
            if (filters.tipo) {
                query += ` AND d.Descuento_Tipo = ?`;
                params.push(filters.tipo);
            }
            
            // Filtrar descuentos vigentes
            if (filters.vigentes === 'true' || filters.vigentes === true) {
                const now = dialect === 'mssql' ? 'GETDATE()' : 'NOW()';
                query += ` AND d.Descuento_Fecha_Inicio <= ${now}`;
                query += ` AND (d.Descuento_Fecha_Fin IS NULL OR d.Descuento_Fecha_Fin >= ${now})`;
                query += ` AND d.Descuento_Estado = 1`;
            }
            
            query += ` ORDER BY d.Descuento_Prioridad DESC, d.Descuento_Fecha_Inicio DESC`;
            
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en findAll descuentos:', error);
            throw error;
        }
    }
    
    /**
     * Obtener un descuento por ID
     */
    static async findById(descuentoId) {
        try {
            const query = `
                SELECT 
                    d.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    i.Item_Codigo_Barra,
                    ip.Presentacion_Nombre,
                    ip.Cantidad_Base as Presentacion_Cantidad_Base,
                    uc.Usuario_Nombre as Usuario_Creacion_Nombre,
                    uc.Usuario_Apellido as Usuario_Creacion_Apellido,
                    um.Usuario_Nombre as Usuario_Modificacion_Nombre,
                    um.Usuario_Apellido as Usuario_Modificacion_Apellido
                FROM ${descuentosTable} d
                LEFT JOIN ${itemsTable} i ON d.Item_Id = i.Item_Id
                LEFT JOIN ${itemsPresentacionesTable} ip ON d.Item_Presentaciones_Id = ip.Item_Presentaciones_Id
                LEFT JOIN ${usuariosTable} uc ON d.Usuario_Creacion_Id = uc.Usuario_Id
                LEFT JOIN ${usuariosTable} um ON d.Usuario_Modificacion_Id = um.Usuario_Id
                WHERE d.Descuento_Id = ?
            `;
            
            const [rows] = await db.execute(query, [descuentoId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error en findById descuento:', error);
            throw error;
        }
    }
    
    /**
     * Obtener descuentos aplicables a un item específico
     */
    static async findByItem(itemId, cantidad = 1) {
        try {
            const now = dialect === 'mssql' ? 'GETDATE()' : 'NOW()';
            const query = `
                SELECT 
                    d.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU
                FROM ${descuentosTable} d
                INNER JOIN ${itemsTable} i ON d.Item_Id = i.Item_Id
                WHERE d.Item_Id = ?
                  AND d.Descuento_Estado = 1
                  AND d.Descuento_Fecha_Inicio <= ${now}
                  AND (d.Descuento_Fecha_Fin IS NULL OR d.Descuento_Fecha_Fin >= ${now})
                  AND d.Cantidad_Minima <= ?
                ORDER BY d.Descuento_Prioridad DESC, d.Descuento_Valor DESC
            `;
            
            const [rows] = await db.execute(query, [itemId, cantidad]);
            return rows;
        } catch (error) {
            console.error('Error en findByItem:', error);
            throw error;
        }
    }
    
    /**
     * Obtener descuentos aplicables a una presentación específica
     */
    static async findByPresentacion(presentacionId, cantidad = 1) {
        try {
            const now = dialect === 'mssql' ? 'GETDATE()' : 'NOW()';
            const query = `
                SELECT 
                    d.*,
                    i.Item_Nombre,
                    i.Item_Codigo_SKU,
                    ip.Presentacion_Nombre,
                    ip.Cantidad_Base
                FROM ${descuentosTable} d
                INNER JOIN ${itemsPresentacionesTable} ip ON d.Item_Presentaciones_Id = ip.Item_Presentaciones_Id
                INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
                WHERE d.Item_Presentaciones_Id = ?
                  AND d.Descuento_Estado = 1
                  AND d.Descuento_Fecha_Inicio <= ${now}
                  AND (d.Descuento_Fecha_Fin IS NULL OR d.Descuento_Fecha_Fin >= ${now})
                  AND d.Cantidad_Minima <= ?
                ORDER BY d.Descuento_Prioridad DESC, d.Descuento_Valor DESC
            `;
            
            const [rows] = await db.execute(query, [presentacionId, cantidad]);
            return rows;
        } catch (error) {
            console.error('Error en findByPresentacion:', error);
            throw error;
        }
    }
    
    /**
     * Crear un nuevo descuento
     */
    static async create(descuentoData, usuarioId) {
        try {
            // Validar que solo uno de Item_Id o Item_Presentaciones_Id esté presente
            if (descuentoData.Item_Id && descuentoData.Item_Presentaciones_Id) {
                throw new Error('Un descuento solo puede aplicarse a un Item O a una Presentación, no a ambos');
            }
            
            if (!descuentoData.Item_Id && !descuentoData.Item_Presentaciones_Id) {
                throw new Error('Debe especificar un Item_Id o Item_Presentaciones_Id');
            }
            
            // Validar tipo de descuento
            if (!['P', 'M'].includes(descuentoData.Descuento_Tipo)) {
                throw new Error('Tipo de descuento inválido. Use P (Porcentaje) o M (Monto)');
            }
            
            // Validar valor según tipo
            if (descuentoData.Descuento_Tipo === 'P' && (descuentoData.Descuento_Valor <= 0 || descuentoData.Descuento_Valor > 100)) {
                throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
            }
            
            if (descuentoData.Descuento_Valor <= 0) {
                throw new Error('El valor del descuento debe ser mayor a 0');
            }
            
            // Preparar query según dialecto
            let query, params;
            
            if (dialect === 'mssql') {
                query = `
                    INSERT INTO ${descuentosTable} (
                        Item_Id, Item_Presentaciones_Id, Descuento_Tipo, Descuento_Valor,
                        Cantidad_Minima, Descuento_Fecha_Inicio, Descuento_Fecha_Fin,
                        Descuento_Prioridad, Es_Combinable, Descuento_Estado,
                        Descuento_Descripcion, Usuario_Creacion_Id
                    )
                    OUTPUT INSERTED.Descuento_Id
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                params = [
                    descuentoData.Item_Id || null,
                    descuentoData.Item_Presentaciones_Id || null,
                    descuentoData.Descuento_Tipo,
                    descuentoData.Descuento_Valor,
                    descuentoData.Cantidad_Minima || 1,
                    descuentoData.Descuento_Fecha_Inicio,
                    descuentoData.Descuento_Fecha_Fin || null,
                    descuentoData.Descuento_Prioridad || 1,
                    descuentoData.Es_Combinable || 0,
                    descuentoData.Descuento_Estado !== undefined ? descuentoData.Descuento_Estado : 1,
                    descuentoData.Descuento_Descripcion || null,
                    usuarioId
                ];
                
                const [result] = await db.execute(query, params);
                return result[0].Descuento_Id;
                
            } else {
                query = `
                    INSERT INTO ${descuentosTable} (
                        Item_Id, Item_Presentaciones_Id, Descuento_Tipo, Descuento_Valor,
                        Cantidad_Minima, Descuento_Fecha_Inicio, Descuento_Fecha_Fin,
                        Descuento_Prioridad, Es_Combinable, Descuento_Estado,
                        Descuento_Descripcion, Usuario_Creacion_Id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                params = [
                    descuentoData.Item_Id || null,
                    descuentoData.Item_Presentaciones_Id || null,
                    descuentoData.Descuento_Tipo,
                    descuentoData.Descuento_Valor,
                    descuentoData.Cantidad_Minima || 1,
                    descuentoData.Descuento_Fecha_Inicio,
                    descuentoData.Descuento_Fecha_Fin || null,
                    descuentoData.Descuento_Prioridad || 1,
                    descuentoData.Es_Combinable || 0,
                    descuentoData.Descuento_Estado !== undefined ? descuentoData.Descuento_Estado : 1,
                    descuentoData.Descuento_Descripcion || null,
                    usuarioId
                ];
                
                const [result] = await db.execute(query, params);
                return result.insertId;
            }
        } catch (error) {
            console.error('Error en create descuento:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar un descuento existente
     */
    static async update(descuentoId, descuentoData, usuarioId) {
        try {
            // Validar que solo uno de Item_Id o Item_Presentaciones_Id esté presente
            if (descuentoData.Item_Id && descuentoData.Item_Presentaciones_Id) {
                throw new Error('Un descuento solo puede aplicarse a un Item O a una Presentación, no a ambos');
            }
            
            // Validar tipo si se proporciona
            if (descuentoData.Descuento_Tipo && !['P', 'M'].includes(descuentoData.Descuento_Tipo)) {
                throw new Error('Tipo de descuento inválido. Use P (Porcentaje) o M (Monto)');
            }
            
            const now = dialect === 'mssql' ? 'GETDATE()' : 'NOW()';
            
            const query = `
                UPDATE ${descuentosTable}
                SET Item_Id = ?,
                    Item_Presentaciones_Id = ?,
                    Descuento_Tipo = ?,
                    Descuento_Valor = ?,
                    Cantidad_Minima = ?,
                    Descuento_Fecha_Inicio = ?,
                    Descuento_Fecha_Fin = ?,
                    Descuento_Prioridad = ?,
                    Es_Combinable = ?,
                    Descuento_Descripcion = ?,
                    Usuario_Modificacion_Id = ?,
                    Fecha_Modificacion = ${now}
                WHERE Descuento_Id = ?
            `;
            
            const [, result] = await db.execute(query, [
                descuentoData.Item_Id !== undefined ? descuentoData.Item_Id : null,
                descuentoData.Item_Presentaciones_Id !== undefined ? descuentoData.Item_Presentaciones_Id : null,
                descuentoData.Descuento_Tipo,
                descuentoData.Descuento_Valor,
                descuentoData.Cantidad_Minima || 1,
                descuentoData.Descuento_Fecha_Inicio,
                descuentoData.Descuento_Fecha_Fin || null,
                descuentoData.Descuento_Prioridad || 1,
                descuentoData.Es_Combinable || 0,
                descuentoData.Descuento_Descripcion || null,
                usuarioId,
                descuentoId
            ]);
            
            const affectedRows = result.affectedRows || result.rowsAffected || 0;
            return affectedRows > 0;
        } catch (error) {
            console.error('Error en update descuento:', error);
            throw error;
        }
    }
    
    /**
     * Cambiar estado de un descuento (activar/desactivar)
     */
    static async toggleStatus(descuentoId, usuarioId) {
        try {
            // Obtener estado actual
            const descuento = await this.findById(descuentoId);
            if (!descuento) {
                throw new Error('Descuento no encontrado');
            }
            
            const nuevoEstado = descuento.Descuento_Estado === 1 || descuento.Descuento_Estado === true ? 0 : 1;
            const now = dialect === 'mssql' ? 'GETDATE()' : 'NOW()';
            
            const query = `
                UPDATE ${descuentosTable}
                SET Descuento_Estado = ?,
                    Usuario_Modificacion_Id = ?,
                    Fecha_Modificacion = ${now}
                WHERE Descuento_Id = ?
            `;
            
            const [, result] = await db.execute(query, [nuevoEstado, usuarioId, descuentoId]);
            const affectedRows = result.affectedRows || result.rowsAffected || 0;
            
            return affectedRows > 0;
        } catch (error) {
            console.error('Error en toggleStatus descuento:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar un descuento (borrado físico)
     */
    static async delete(descuentoId) {
        try {
            const query = `DELETE FROM ${descuentosTable} WHERE Descuento_Id = ?`;
            const [, result] = await db.execute(query, [descuentoId]);
            
            const affectedRows = result.affectedRows || result.rowsAffected || 0;
            return affectedRows > 0;
        } catch (error) {
            console.error('Error en delete descuento:', error);
            throw error;
        }
    }
    
    /**
     * Calcular el descuento aplicable para un item/presentación
     */
    static async calcularDescuento(itemId, presentacionId, cantidad, precioBase) {
        try {
            let descuentos = [];
            
            if (presentacionId) {
                descuentos = await this.findByPresentacion(presentacionId, cantidad);
            } else if (itemId) {
                descuentos = await this.findByItem(itemId, cantidad);
            } else {
                return { descuento_aplicado: 0, precio_final: precioBase, descuentos_disponibles: [] };
            }
            
            if (descuentos.length === 0) {
                return { descuento_aplicado: 0, precio_final: precioBase, descuentos_disponibles: [] };
            }
            
            // Tomar el descuento con mayor prioridad y mayor valor
            const descuentoPrincipal = descuentos[0];
            let descuentoTotal = 0;
            
            if (descuentoPrincipal.Descuento_Tipo === 'P') {
                descuentoTotal = precioBase * (descuentoPrincipal.Descuento_Valor / 100);
            } else {
                descuentoTotal = descuentoPrincipal.Descuento_Valor;
            }
            
            // Si es combinable, agregar otros descuentos combinables
            if (descuentoPrincipal.Es_Combinable) {
                const descuentosAdicionales = descuentos.slice(1).filter(d => d.Es_Combinable);
                for (const desc of descuentosAdicionales) {
                    if (desc.Descuento_Tipo === 'P') {
                        descuentoTotal += precioBase * (desc.Descuento_Valor / 100);
                    } else {
                        descuentoTotal += desc.Descuento_Valor;
                    }
                }
            }
            
            // No permitir descuento mayor al precio base
            descuentoTotal = Math.min(descuentoTotal, precioBase);
            
            const precioFinal = Math.max(precioBase - descuentoTotal, 0);
            
            return {
                descuento_aplicado: descuentoTotal,
                precio_final: precioFinal,
                descuentos_disponibles: descuentos,
                descuento_principal: descuentoPrincipal
            };
        } catch (error) {
            console.error('Error en calcularDescuento:', error);
            throw error;
        }
    }
}

module.exports = DescuentoModel;
