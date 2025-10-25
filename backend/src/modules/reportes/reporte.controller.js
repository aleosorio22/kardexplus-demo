const ReporteModel = require('./reporte.model');

/**
 * Obtener Reporte de Inventario Actual
 * GET /api/reportes/inventario-actual
 */
exports.getInventarioActual = async (req, res) => {
    try {
        const filters = {
            bodega_id: req.query.bodega_id,
            categoria_id: req.query.categoria_id,
            solo_con_stock: req.query.solo_con_stock
        };

        const reporte = await ReporteModel.getInventarioActual(filters);

        res.json({
            success: true,
            data: reporte,
            message: 'Reporte de inventario actual generado exitosamente'
        });
    } catch (error) {
        console.error('Error en getInventarioActual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de inventario',
            error: error.message
        });
    }
};

/**
 * Obtener Reporte de Inventario por Bodega
 * GET /api/reportes/inventario-por-bodega
 */
exports.getInventarioPorBodega = async (req, res) => {
    try {
        const bodegaId = req.query.bodega_id || null;
        const reporte = await ReporteModel.getInventarioPorBodega(bodegaId);

        res.json({
            success: true,
            data: reporte,
            message: 'Reporte de inventario por bodega generado exitosamente'
        });
    } catch (error) {
        console.error('Error en getInventarioPorBodega:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte por bodega',
            error: error.message
        });
    }
};

/**
 * Obtener Reporte de Items con Stock Bajo
 * GET /api/reportes/stock-bajo
 */
exports.getStockBajo = async (req, res) => {
    try {
        const bodegaId = req.query.bodega_id || null;
        const reporte = await ReporteModel.getItemsStockBajo(bodegaId);

        res.json({
            success: true,
            data: reporte,
            message: 'Reporte de stock bajo generado exitosamente'
        });
    } catch (error) {
        console.error('Error en getStockBajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de stock bajo',
            error: error.message
        });
    }
};

/**
 * Obtener Reporte de Valorización de Inventario
 * GET /api/reportes/valorizacion
 */
exports.getValorizacion = async (req, res) => {
    try {
        const bodegaId = req.query.bodega_id || null;
        const reporte = await ReporteModel.getValorizacionInventario(bodegaId);

        res.json({
            success: true,
            data: reporte,
            message: 'Reporte de valorización generado exitosamente'
        });
    } catch (error) {
        console.error('Error en getValorizacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de valorización',
            error: error.message
        });
    }
};

/**
 * Obtener información de empresa para encabezado de reportes
 * GET /api/reportes/info-empresa
 */
exports.getInfoEmpresa = async (req, res) => {
    try {
        // Información de la empresa para el encabezado del reporte
        const infoEmpresa = {
            nombre: process.env.EMPRESA_NOMBRE || 'KardexPlus',
            direccion: process.env.EMPRESA_DIRECCION || '',
            telefono: process.env.EMPRESA_TELEFONO || '+502 4689 0147',
            email: process.env.EMPRESA_EMAIL || 'devsolutions@dev.com',
            nit: process.env.EMPRESA_NIT || '118204319',
            logo_url: process.env.EMPRESA_LOGO_URL || ''
        };

        res.json({
            success: true,
            data: infoEmpresa
        });
    } catch (error) {
        console.error('Error en getInfoEmpresa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información de empresa',
            error: error.message
        });
    }
};
