const DescuentoModel = require('./descuento.model');

class DescuentoController {
    
    /**
     * Obtener todos los descuentos con filtros opcionales
     */
    static async getAllDescuentos(req, res) {
        try {
            const filters = {
                estado: req.query.estado,
                item_id: req.query.item_id,
                presentacion_id: req.query.presentacion_id,
                tipo: req.query.tipo,
                vigentes: req.query.vigentes
            };
            
            const descuentos = await DescuentoModel.findAll(filters);
            
            res.json({
                success: true,
                data: descuentos,
                total: descuentos.length,
                message: 'Descuentos obtenidos exitosamente'
            });
        } catch (error) {
            console.error('Error obteniendo descuentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener un descuento por ID
     */
    static async getDescuentoById(req, res) {
        try {
            const { descuentoId } = req.params;
            
            if (!descuentoId || isNaN(descuentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de descuento inválido'
                });
            }
            
            const descuento = await DescuentoModel.findById(parseInt(descuentoId));
            
            if (!descuento) {
                return res.status(404).json({
                    success: false,
                    message: 'Descuento no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: descuento,
                message: 'Descuento obtenido exitosamente'
            });
        } catch (error) {
            console.error('Error obteniendo descuento por ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener descuentos aplicables a un item
     */
    static async getDescuentosByItem(req, res) {
        try {
            const { itemId } = req.params;
            const { cantidad } = req.query;
            
            if (!itemId || isNaN(itemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de item inválido'
                });
            }
            
            const descuentos = await DescuentoModel.findByItem(
                parseInt(itemId), 
                cantidad ? parseInt(cantidad) : 1
            );
            
            res.json({
                success: true,
                data: descuentos,
                total: descuentos.length,
                message: 'Descuentos del item obtenidos exitosamente'
            });
        } catch (error) {
            console.error('Error obteniendo descuentos por item:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener descuentos aplicables a una presentación
     */
    static async getDescuentosByPresentacion(req, res) {
        try {
            const { presentacionId } = req.params;
            const { cantidad } = req.query;
            
            if (!presentacionId || isNaN(presentacionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de presentación inválido'
                });
            }
            
            const descuentos = await DescuentoModel.findByPresentacion(
                parseInt(presentacionId), 
                cantidad ? parseInt(cantidad) : 1
            );
            
            res.json({
                success: true,
                data: descuentos,
                total: descuentos.length,
                message: 'Descuentos de la presentación obtenidos exitosamente'
            });
        } catch (error) {
            console.error('Error obteniendo descuentos por presentación:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    /**
     * Calcular descuento aplicable
     */
    static async calcularDescuento(req, res) {
        try {
            const { item_id, presentacion_id, cantidad, precio_base } = req.body;
            
            if (!precio_base || precio_base <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Precio base inválido'
                });
            }
            
            if (!item_id && !presentacion_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar item_id o presentacion_id'
                });
            }
            
            const resultado = await DescuentoModel.calcularDescuento(
                item_id ? parseInt(item_id) : null,
                presentacion_id ? parseInt(presentacion_id) : null,
                cantidad ? parseInt(cantidad) : 1,
                parseFloat(precio_base)
            );
            
            res.json({
                success: true,
                data: resultado,
                message: 'Descuento calculado exitosamente'
            });
        } catch (error) {
            console.error('Error calculando descuento:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    /**
     * Crear un nuevo descuento
     */
    static async crearDescuento(req, res) {
        try {
            const usuarioId = req.user.id;
            const descuentoData = req.body;
            
            // Validaciones básicas
            if (!descuentoData.Descuento_Tipo || !descuentoData.Descuento_Valor) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo y valor de descuento son requeridos'
                });
            }
            
            if (!descuentoData.Descuento_Fecha_Inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha de inicio es requerida'
                });
            }
            
            if (!descuentoData.Item_Id && !descuentoData.Item_Presentaciones_Id) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar un Item o una Presentación'
                });
            }
            
            const descuentoId = await DescuentoModel.create(descuentoData, usuarioId);
            
            res.status(201).json({
                success: true,
                data: { Descuento_Id: descuentoId },
                message: 'Descuento creado exitosamente'
            });
        } catch (error) {
            console.error('Error creando descuento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    
    /**
     * Actualizar un descuento existente
     */
    static async actualizarDescuento(req, res) {
        try {
            const { descuentoId } = req.params;
            const usuarioId = req.user.id;
            const descuentoData = req.body;
            
            if (!descuentoId || isNaN(descuentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de descuento inválido'
                });
            }
            
            // Verificar que el descuento existe
            const descuentoExistente = await DescuentoModel.findById(parseInt(descuentoId));
            if (!descuentoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Descuento no encontrado'
                });
            }
            
            const actualizado = await DescuentoModel.update(
                parseInt(descuentoId), 
                descuentoData, 
                usuarioId
            );
            
            if (!actualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo actualizar el descuento'
                });
            }
            
            res.json({
                success: true,
                message: 'Descuento actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error actualizando descuento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    
    /**
     * Cambiar estado de un descuento (activar/desactivar)
     */
    static async toggleEstadoDescuento(req, res) {
        try {
            const { descuentoId } = req.params;
            const usuarioId = req.user.id;
            
            if (!descuentoId || isNaN(descuentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de descuento inválido'
                });
            }
            
            const actualizado = await DescuentoModel.toggleStatus(
                parseInt(descuentoId), 
                usuarioId
            );
            
            if (!actualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Descuento no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Estado del descuento cambiado exitosamente'
            });
        } catch (error) {
            console.error('Error cambiando estado del descuento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    
    /**
     * Eliminar un descuento
     */
    static async eliminarDescuento(req, res) {
        try {
            const { descuentoId } = req.params;
            
            if (!descuentoId || isNaN(descuentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de descuento inválido'
                });
            }
            
            const eliminado = await DescuentoModel.delete(parseInt(descuentoId));
            
            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Descuento no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Descuento eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando descuento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
}

module.exports = DescuentoController;
