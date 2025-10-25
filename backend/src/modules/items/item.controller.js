const ItemModel = require('./item.model');

/**
 * Obtiene todos los items
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getAllItems = async (req, res) => {
    try {
        const items = await ItemModel.findAll();
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error al obtener items:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtiene items con paginación y filtros
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getItemsWithPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const categoria = req.query.categoria || '';
        const estado = req.query.estado || '';
        const offset = (page - 1) * limit;

        const result = await ItemModel.findWithPagination(offset, limit, search, categoria, estado);
        
        res.json({
            success: true,
            data: result.data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(result.total / limit),
                totalRecords: result.total,
                recordsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error al obtener items con paginación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtiene un item por ID
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        const item = await ItemModel.findById(parseInt(id));
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error al obtener item:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Crea un nuevo item
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.createItem = async (req, res) => {
    try {
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
        } = req.body;

        // Validaciones
        if (!Item_Nombre || Item_Nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre del item es requerido'
            });
        }

        if (Item_Nombre.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del item no puede exceder 50 caracteres'
            });
        }

        if (Item_Descripcion && Item_Descripcion.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La descripción no puede exceder 500 caracteres'
            });
        }

        if (Item_Tipo && !['B', 'S'].includes(Item_Tipo)) {
            return res.status(400).json({
                success: false,
                message: 'El tipo debe ser "B" (Bien) o "S" (Servicio)'
            });
        }

        if (!Item_Costo_Unitario || Item_Costo_Unitario < 0) {
            return res.status(400).json({
                success: false,
                message: 'El costo unitario es requerido y debe ser mayor o igual a 0'
            });
        }

        if (Item_Precio_Sugerido !== undefined && Item_Precio_Sugerido !== null && Item_Precio_Sugerido < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio sugerido debe ser mayor o igual a 0'
            });
        }

        if (!CategoriaItem_Id || isNaN(CategoriaItem_Id)) {
            return res.status(400).json({
                success: false,
                message: 'La categoría es requerida'
            });
        }

        if (!UnidadMedidaBase_Id || isNaN(UnidadMedidaBase_Id)) {
            return res.status(400).json({
                success: false,
                message: 'La unidad de medida base es requerida'
            });
        }

        if (Item_Codigo_SKU && Item_Codigo_SKU.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código SKU no puede exceder 20 caracteres'
            });
        }

        if (Item_Codigo_Barra && Item_Codigo_Barra.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código de barras no puede exceder 20 caracteres'
            });
        }

        if (Item_Imagen_URL && Item_Imagen_URL.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La URL de la imagen no puede exceder 500 caracteres'
            });
        }

        const itemData = {
            Item_Codigo_SKU: Item_Codigo_SKU ? Item_Codigo_SKU.trim() : null,
            Item_Codigo_Barra: Item_Codigo_Barra ? Item_Codigo_Barra.trim() : null,
            Item_Nombre: Item_Nombre.trim(),
            Item_Descripcion: Item_Descripcion ? Item_Descripcion.trim() : null,
            Item_Tipo: Item_Tipo || 'B',
            Item_Costo_Unitario: parseFloat(Item_Costo_Unitario),
            Item_Precio_Sugerido: Item_Precio_Sugerido ? parseFloat(Item_Precio_Sugerido) : null,
            Item_Imagen_URL: Item_Imagen_URL ? Item_Imagen_URL.trim() : null,
            Item_Estado: Item_Estado !== undefined ? (Item_Estado === true || Item_Estado === 1 ? 1 : 0) : 1,
            CategoriaItem_Id: parseInt(CategoriaItem_Id),
            UnidadMedidaBase_Id: parseInt(UnidadMedidaBase_Id)
        };

        const itemId = await ItemModel.create(itemData);
        
        res.status(201).json({
            success: true,
            message: 'Item creado exitosamente',
            data: { 
                Item_Id: itemId,
                ...itemData
            }
        });
    } catch (error) {
        console.error('Error al crear item:', error);
        
        // Manejar errores específicos
        if (error.message.includes('Ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Actualiza un item
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
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
        } = req.body;

        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        // Verificar que el item existe
        const existingItem = await ItemModel.findById(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        // Validaciones
        if (!Item_Nombre || Item_Nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre del item es requerido'
            });
        }

        if (Item_Nombre.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del item no puede exceder 50 caracteres'
            });
        }

        if (Item_Descripcion && Item_Descripcion.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La descripción no puede exceder 500 caracteres'
            });
        }

        if (Item_Tipo && !['B', 'S'].includes(Item_Tipo)) {
            return res.status(400).json({
                success: false,
                message: 'El tipo debe ser "B" (Bien) o "S" (Servicio)'
            });
        }

        if (!Item_Costo_Unitario || Item_Costo_Unitario < 0) {
            return res.status(400).json({
                success: false,
                message: 'El costo unitario es requerido y debe ser mayor o igual a 0'
            });
        }

        if (Item_Precio_Sugerido !== undefined && Item_Precio_Sugerido !== null && Item_Precio_Sugerido < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio sugerido debe ser mayor o igual a 0'
            });
        }

        if (!CategoriaItem_Id || isNaN(CategoriaItem_Id)) {
            return res.status(400).json({
                success: false,
                message: 'La categoría es requerida'
            });
        }

        if (!UnidadMedidaBase_Id || isNaN(UnidadMedidaBase_Id)) {
            return res.status(400).json({
                success: false,
                message: 'La unidad de medida base es requerida'
            });
        }

        if (Item_Codigo_SKU && Item_Codigo_SKU.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código SKU no puede exceder 20 caracteres'
            });
        }

        if (Item_Codigo_Barra && Item_Codigo_Barra.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código de barras no puede exceder 20 caracteres'
            });
        }

        if (Item_Imagen_URL && Item_Imagen_URL.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'La URL de la imagen no puede exceder 500 caracteres'
            });
        }

        const itemData = {
            Item_Codigo_SKU: Item_Codigo_SKU ? Item_Codigo_SKU.trim() : null,
            Item_Codigo_Barra: Item_Codigo_Barra ? Item_Codigo_Barra.trim() : null,
            Item_Nombre: Item_Nombre.trim(),
            Item_Descripcion: Item_Descripcion ? Item_Descripcion.trim() : null,
            Item_Tipo: Item_Tipo || 'B',
            Item_Costo_Unitario: parseFloat(Item_Costo_Unitario),
            Item_Precio_Sugerido: Item_Precio_Sugerido ? parseFloat(Item_Precio_Sugerido) : null,
            Item_Imagen_URL: Item_Imagen_URL ? Item_Imagen_URL.trim() : null,
            Item_Estado: Item_Estado !== undefined ? (Item_Estado === true || Item_Estado === 1 ? 1 : 0) : 1,
            CategoriaItem_Id: parseInt(CategoriaItem_Id),
            UnidadMedidaBase_Id: parseInt(UnidadMedidaBase_Id)
        };

        const updated = await ItemModel.update(parseInt(id), itemData);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo actualizar el item'
            });
        }
        
        res.json({
            success: true,
            message: 'Item actualizado exitosamente',
            data: {
                Item_Id: parseInt(id),
                ...itemData
            }
        });
    } catch (error) {
        console.error('Error al actualizar item:', error);
        
        // Manejar errores específicos
        if (error.message.includes('Ya existe')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Elimina un item (cambio de estado)
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        // Verificar que el item existe
        const existingItem = await ItemModel.findById(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        const deleted = await ItemModel.delete(parseInt(id));
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo desactivar el item'
            });
        }
        
        res.json({
            success: true,
            message: 'Item desactivado exitosamente'
        });
    } catch (error) {
        console.error('Error al desactivar item:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Restaura un item (activar)
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.restoreItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        // Verificar que el item existe
        const existingItem = await ItemModel.findById(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        const restored = await ItemModel.restore(parseInt(id));
        
        if (!restored) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo activar el item'
            });
        }
        
        res.json({
            success: true,
            message: 'Item activado exitosamente'
        });
    } catch (error) {
        console.error('Error al activar item:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Toggle del estado de un item
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.toggleItemStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        // Verificar que el item existe
        const existingItem = await ItemModel.findById(parseInt(id));
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        const toggled = await ItemModel.toggleStatus(parseInt(id));
        
        if (!toggled) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo cambiar el estado del item'
            });
        }
        
        const newStatus = !existingItem.Item_Estado;
        
        res.json({
            success: true,
            message: `Item ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                Item_Id: parseInt(id),
                Item_Estado: newStatus
            }
        });
    } catch (error) {
        console.error('Error al cambiar estado del item:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtiene items por categoría
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getItemsByCategory = async (req, res) => {
    try {
        const { categoriaId } = req.params;
        
        // Validar que el ID sea un número
        if (!categoriaId || isNaN(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de categoría inválido'
            });
        }

        const items = await ItemModel.findByCategory(parseInt(categoriaId));
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error al obtener items por categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtiene estadísticas de items
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.getItemStats = async (req, res) => {
    try {
        const totalItems = await ItemModel.count();
        
        res.json({
            success: true,
            data: {
                totalItems
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de items:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Busca items
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.searchItems = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || !q.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Término de búsqueda requerido'
            });
        }

        const items = await ItemModel.search(q.trim());
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error al buscar items:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Verifica si un item existe
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
exports.checkItemExists = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea un número
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de item inválido'
            });
        }

        const exists = await ItemModel.exists(parseInt(id));
        
        res.json({
            success: true,
            data: { exists }
        });
    } catch (error) {
        console.error('Error al verificar existencia de item:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};
