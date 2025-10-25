const express = require('express');
const router = express.Router();
const DescuentoController = require('./descuento.controller');
const { authMiddleware, hasPermission } = require('../../core/middlewares/auth.middleware');

// =======================================
// RUTAS DE CONSULTA DE DESCUENTOS
// =======================================

// GET /api/descuentos - Obtener todos los descuentos con filtros opcionales
router.get('/', 
    authMiddleware, 
    hasPermission('descuentos.ver'), 
    DescuentoController.getAllDescuentos
);

// GET /api/descuentos/vigentes - Obtener descuentos vigentes actualmente
router.get('/vigentes', 
    authMiddleware, 
    hasPermission('descuentos.ver'), 
    (req, res, next) => {
        req.query.vigentes = 'true';
        DescuentoController.getAllDescuentos(req, res, next);
    }
);

// GET /api/descuentos/:descuentoId - Obtener descuento por ID
router.get('/:descuentoId', 
    authMiddleware, 
    hasPermission('descuentos.ver'), 
    DescuentoController.getDescuentoById
);

// GET /api/descuentos/item/:itemId - Obtener descuentos aplicables a un item
router.get('/item/:itemId', 
    authMiddleware, 
    hasPermission('descuentos.ver'), 
    DescuentoController.getDescuentosByItem
);

// GET /api/descuentos/presentacion/:presentacionId - Obtener descuentos aplicables a una presentación
router.get('/presentacion/:presentacionId', 
    authMiddleware, 
    hasPermission('descuentos.ver'), 
    DescuentoController.getDescuentosByPresentacion
);

// =======================================
// RUTAS DE CÁLCULO DE DESCUENTOS
// =======================================

// POST /api/descuentos/calcular - Calcular descuento aplicable
router.post('/calcular', 
    authMiddleware, 
    hasPermission('descuentos.aplicar'), 
    DescuentoController.calcularDescuento
);

// =======================================
// RUTAS DE GESTIÓN DE DESCUENTOS
// =======================================

// POST /api/descuentos - Crear nuevo descuento
router.post('/', 
    authMiddleware, 
    hasPermission('descuentos.crear'), 
    DescuentoController.crearDescuento
);

// PUT /api/descuentos/:descuentoId - Actualizar descuento existente
router.put('/:descuentoId', 
    authMiddleware, 
    hasPermission('descuentos.editar'), 
    DescuentoController.actualizarDescuento
);

// PUT /api/descuentos/:descuentoId/toggle-estado - Activar/desactivar descuento
router.put('/:descuentoId/toggle-estado', 
    authMiddleware, 
    hasPermission('descuentos.activar_desactivar'), 
    DescuentoController.toggleEstadoDescuento
);

// DELETE /api/descuentos/:descuentoId - Eliminar descuento
router.delete('/:descuentoId', 
    authMiddleware, 
    hasPermission('descuentos.eliminar'), 
    DescuentoController.eliminarDescuento
);

module.exports = router;
