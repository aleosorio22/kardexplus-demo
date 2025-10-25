const express = require('express');
const router = express.Router();
const reporteController = require('./reporte.controller');
const { authMiddleware, hasPermission } = require('../../core/middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/reportes/inventario-actual
 * Reporte completo de inventario actual con SKU, nombre, cantidad, costo y precio
 * Query params: bodega_id, categoria_id, solo_con_stock
 */
router.get(
    '/inventario-actual',
    hasPermission('reportes.ver'),
    reporteController.getInventarioActual
);

/**
 * GET /api/reportes/inventario-por-bodega
 * Resumen de inventario agrupado por bodega
 * Query params: bodega_id (opcional)
 */
router.get(
    '/inventario-por-bodega',
    hasPermission('reportes.ver'),
    reporteController.getInventarioPorBodega
);

/**
 * GET /api/reportes/stock-bajo
 * Items con stock por debajo del mínimo configurado
 * Query params: bodega_id (opcional)
 */
router.get(
    '/stock-bajo',
    hasPermission('reportes.ver'),
    reporteController.getStockBajo
);

/**
 * GET /api/reportes/valorizacion
 * Valorización del inventario por categoría
 * Query params: bodega_id (opcional)
 */
router.get(
    '/valorizacion',
    hasPermission('reportes.ver'),
    reporteController.getValorizacion
);

/**
 * GET /api/reportes/info-empresa
 * Información de la empresa para encabezados de reportes
 */
router.get(
    '/info-empresa',
    reporteController.getInfoEmpresa
);

module.exports = router;
