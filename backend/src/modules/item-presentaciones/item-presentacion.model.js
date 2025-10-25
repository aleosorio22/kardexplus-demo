const db = require('../../core/config/database');

// Soporte para múltiples dialectos de base de datos
const dialect = process.env.DB_DIALECT || 'mysql';
const presentacionesTable = dialect === 'mssql' ? 'Items.Items_Presentaciones' : 'Items_Presentaciones';
const itemsTable = dialect === 'mssql' ? 'Items.Items' : 'Items';
const categoriasTable = dialect === 'mssql' ? 'Items.CategoriasItems' : 'CategoriasItems';
const unidadesMedidaTable = dialect === 'mssql' ? 'Items.UnidadesMedida' : 'UnidadesMedida';

class ItemPresentacionModel {
    static async create(itemPresentacionData) {
        const {
            Item_Id,
            Presentacion_Nombre,
            Cantidad_Base,
            Item_Presentacion_CodigoSKU,
            Item_Presentaciones_CodigoBarras,
            Item_Presentaciones_Costo,
            Item_Presentaciones_Precio_Sugerido
        } = itemPresentacionData;

        if (await this.existsByItemAndPresentacion(Item_Id, Presentacion_Nombre)) {
            throw new Error('Ya existe una presentación con este nombre para este item');
        }

        if (Item_Presentacion_CodigoSKU && await this.existsBySKU(Item_Presentacion_CodigoSKU)) {
            throw new Error('Ya existe una presentación con este código SKU');
        }

        if (Item_Presentaciones_CodigoBarras && await this.existsByBarcode(Item_Presentaciones_CodigoBarras)) {
            throw new Error('Ya existe una presentación con este código de barras');
        }

        let query;
        if (dialect === 'mssql') {
            query = `INSERT INTO ${presentacionesTable} (
                Item_Id, Presentacion_Nombre, Cantidad_Base,
                Item_Presentacion_CodigoSKU, Item_Presentaciones_CodigoBarras,
                Item_Presentaciones_Costo, Item_Presentaciones_Precio_Sugerido
            ) OUTPUT INSERTED.Item_Presentaciones_Id AS insertId
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        } else {
            query = `INSERT INTO ${presentacionesTable} (
                Item_Id, Presentacion_Nombre, Cantidad_Base,
                Item_Presentacion_CodigoSKU, Item_Presentaciones_CodigoBarras,
                Item_Presentaciones_Costo, Item_Presentaciones_Precio_Sugerido
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        }

        const [rows, result] = await db.execute(query, [
            Item_Id, Presentacion_Nombre, Cantidad_Base,
            Item_Presentacion_CodigoSKU || null,
            Item_Presentaciones_CodigoBarras || null,
            Item_Presentaciones_Costo || null,
            Item_Presentaciones_Precio_Sugerido || null
        ]);
        
        return dialect === 'mssql' ? rows[0].insertId : result.insertId;
    }

    static async findAll() {
        const [presentaciones] = await db.execute(`
            SELECT ip.Item_Presentaciones_Id, ip.Item_Id, ip.Presentacion_Nombre,
                ip.Cantidad_Base, ip.Item_Presentacion_CodigoSKU, ip.Item_Presentaciones_CodigoBarras,
                ip.Item_Presentaciones_Costo, ip.Item_Presentaciones_Precio_Sugerido,
                i.Item_Nombre, i.Item_Costo_Unitario, c.CategoriaItem_Nombre,
                um.UnidadMedida_Nombre, um.UnidadMedida_Prefijo
            FROM ${presentacionesTable} ip
            INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
            ORDER BY i.Item_Nombre ASC, ip.Presentacion_Nombre ASC
        `);
        return presentaciones;
    }

    static async findById(id) {
        const [presentaciones] = await db.execute(`
            SELECT ip.Item_Presentaciones_Id, ip.Item_Id, ip.Presentacion_Nombre,
                ip.Cantidad_Base, ip.Item_Presentacion_CodigoSKU, ip.Item_Presentaciones_CodigoBarras,
                ip.Item_Presentaciones_Costo, ip.Item_Presentaciones_Precio_Sugerido,
                i.Item_Nombre, i.Item_Costo_Unitario, i.Item_Estado,
                c.CategoriaItem_Nombre, um.UnidadMedida_Nombre, um.UnidadMedida_Prefijo
            FROM ${presentacionesTable} ip
            INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
            WHERE ip.Item_Presentaciones_Id = ?
        `, [id]);
        return presentaciones[0];
    }

    static async findByItemId(itemId) {
        const [presentaciones] = await db.execute(`
            SELECT ip.Item_Presentaciones_Id, ip.Item_Id, ip.Presentacion_Nombre,
                ip.Cantidad_Base, ip.Item_Presentacion_CodigoSKU, ip.Item_Presentaciones_CodigoBarras,
                ip.Item_Presentaciones_Costo, ip.Item_Presentaciones_Precio_Sugerido,
                i.Item_Nombre, i.Item_Costo_Unitario,
                um.UnidadMedida_Nombre, um.UnidadMedida_Prefijo
            FROM ${presentacionesTable} ip
            INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
            INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
            WHERE ip.Item_Id = ?
            ORDER BY ip.Cantidad_Base ASC
        `, [itemId]);
        return presentaciones;
    }

    static async update(id, itemPresentacionData) {
        const {
            Item_Id, Presentacion_Nombre, Cantidad_Base,
            Item_Presentacion_CodigoSKU, Item_Presentaciones_CodigoBarras,
            Item_Presentaciones_Costo, Item_Presentaciones_Precio_Sugerido
        } = itemPresentacionData;

        if (await this.existsByItemAndPresentacion(Item_Id, Presentacion_Nombre, id)) {
            throw new Error('Ya existe una presentación con este nombre para este item');
        }

        if (Item_Presentacion_CodigoSKU && await this.existsBySKU(Item_Presentacion_CodigoSKU, id)) {
            throw new Error('Ya existe una presentación con este código SKU');
        }

        if (Item_Presentaciones_CodigoBarras && await this.existsByBarcode(Item_Presentaciones_CodigoBarras, id)) {
            throw new Error('Ya existe una presentación con este código de barras');
        }

        const [rows, result] = await db.execute(`
            UPDATE ${presentacionesTable} SET
                Item_Id = ?, Presentacion_Nombre = ?, Cantidad_Base = ?,
                Item_Presentacion_CodigoSKU = ?, Item_Presentaciones_CodigoBarras = ?,
                Item_Presentaciones_Costo = ?, Item_Presentaciones_Precio_Sugerido = ?
            WHERE Item_Presentaciones_Id = ?
        `, [
            Item_Id, Presentacion_Nombre, Cantidad_Base,
            Item_Presentacion_CodigoSKU || null,
            Item_Presentaciones_CodigoBarras || null,
            Item_Presentaciones_Costo || null,
            Item_Presentaciones_Precio_Sugerido || null,
            id
        ]);
        
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    static async delete(id) {
        const [rows, result] = await db.execute(
            `DELETE FROM ${presentacionesTable} WHERE Item_Presentaciones_Id = ?`,
            [id]
        );
        const affectedRows = result.affectedRows || result.rowsAffected || 0;
        return affectedRows > 0;
    }

    static async findWithPagination(offset = 0, limit = 10, search = '', itemId = '') {
        let query = `
            SELECT ip.Item_Presentaciones_Id, ip.Item_Id, ip.Presentacion_Nombre,
                ip.Cantidad_Base, ip.Item_Presentacion_CodigoSKU, ip.Item_Presentaciones_CodigoBarras,
                ip.Item_Presentaciones_Costo, ip.Item_Presentaciones_Precio_Sugerido,
                i.Item_Nombre, i.Item_Costo_Unitario, c.CategoriaItem_Nombre,
                um.UnidadMedida_Nombre, um.UnidadMedida_Prefijo
            FROM ${presentacionesTable} ip
            INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
            INNER JOIN ${categoriasTable} c ON i.CategoriaItem_Id = c.CategoriaItem_Id
            INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
        `;
        let countQuery = `SELECT COUNT(*) as total FROM ${presentacionesTable} ip INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id`;
        let params = [];
        let whereConditions = [];

        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            whereConditions.push('(i.Item_Nombre LIKE ? OR ip.Presentacion_Nombre LIKE ? OR ip.Item_Presentacion_CodigoSKU LIKE ? OR ip.Item_Presentaciones_CodigoBarras LIKE ?)');
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (itemId && itemId.trim() !== '') {
            whereConditions.push('ip.Item_Id = ?');
            params.push(parseInt(itemId));
        }

        if (whereConditions.length > 0) {
            const whereClause = ' WHERE ' + whereConditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        if (dialect === 'mssql') {
            query += ' ORDER BY i.Item_Nombre ASC, ip.Cantidad_Base ASC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY';
            params.push(parseInt(offset), parseInt(limit));
        } else {
            query += ' ORDER BY i.Item_Nombre ASC, ip.Cantidad_Base ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
        }
        
        const queryParams = [...params];
        const countParams = params.slice(0, params.length - 2);

        const [presentaciones] = await db.execute(query, queryParams);
        const [countResult] = await db.execute(countQuery, countParams);

        return {
            data: presentaciones,
            total: countResult[0].total
        };
    }

    static async count() {
        const [result] = await db.execute(`SELECT COUNT(*) as total FROM ${presentacionesTable}`);
        return result[0].total;
    }

    static async exists(id) {
        const [result] = await db.execute(
            `SELECT Item_Presentaciones_Id FROM ${presentacionesTable} WHERE Item_Presentaciones_Id = ?`,
            [id]
        );
        return result.length > 0;
    }

    static async existsByItemAndPresentacion(itemId, presentacionNombre, excludeId = null) {
        let query = `SELECT Item_Presentaciones_Id FROM ${presentacionesTable} WHERE Item_Id = ? AND Presentacion_Nombre = ?`;
        let params = [itemId, presentacionNombre];
        
        if (excludeId) {
            query += ' AND Item_Presentaciones_Id != ?';
            params.push(excludeId);
        }
        
        const [result] = await db.execute(query, params);
        return result.length > 0;
    }

    static async existsBySKU(sku, excludeId = null) {
        let query = `SELECT Item_Presentaciones_Id FROM ${presentacionesTable} WHERE Item_Presentacion_CodigoSKU = ?`;
        let params = [sku];
        
        if (excludeId) {
            query += ' AND Item_Presentaciones_Id != ?';
            params.push(excludeId);
        }
        
        const [result] = await db.execute(query, params);
        return result.length > 0;
    }

    static async existsByBarcode(barcode, excludeId = null) {
        let query = `SELECT Item_Presentaciones_Id FROM ${presentacionesTable} WHERE Item_Presentaciones_CodigoBarras = ?`;
        let params = [barcode];
        
        if (excludeId) {
            query += ' AND Item_Presentaciones_Id != ?';
            params.push(excludeId);
        }
        
        const [result] = await db.execute(query, params);
        return result.length > 0;
    }

    static async search(searchTerm) {
        const searchPattern = `%${searchTerm}%`;
        const [presentaciones] = await db.execute(`
            SELECT ip.Item_Presentaciones_Id, ip.Item_Id, ip.Presentacion_Nombre,
                ip.Cantidad_Base, ip.Item_Presentacion_CodigoSKU, ip.Item_Presentaciones_CodigoBarras,
                ip.Item_Presentaciones_Costo, ip.Item_Presentaciones_Precio_Sugerido,
                i.Item_Nombre, um.UnidadMedida_Prefijo
            FROM ${presentacionesTable} ip
            INNER JOIN ${itemsTable} i ON ip.Item_Id = i.Item_Id
            INNER JOIN ${unidadesMedidaTable} um ON i.UnidadMedidaBase_Id = um.UnidadMedida_Id
            WHERE i.Item_Nombre LIKE ? OR ip.Presentacion_Nombre LIKE ?
               OR ip.Item_Presentacion_CodigoSKU LIKE ? OR ip.Item_Presentaciones_CodigoBarras LIKE ?
            ORDER BY i.Item_Nombre ASC, ip.Cantidad_Base ASC
        `, [searchPattern, searchPattern, searchPattern, searchPattern]);
        return presentaciones;
    }

    static async getStats() {
        const [stats] = await db.execute(`
            SELECT COUNT(*) as totalPresentaciones,
                COUNT(DISTINCT ip.Item_Id) as itemsConPresentaciones,
                AVG(ip.Item_Presentaciones_Costo) as costoPromedio,
                AVG(ip.Cantidad_Base) as cantidadBasePromedio
            FROM ${presentacionesTable} ip
        `);
        return stats[0];
    }
}

module.exports = ItemPresentacionModel;
