-- ============================================================================
-- Script: Fix UNIQUE constraints para Items_Presentaciones
-- Descripción: Elimina las restricciones UNIQUE que no permiten múltiples NULL
--              y las reemplaza con índices únicos filtrados
-- Fecha: 25 de octubre de 2025
-- Base de datos: DevSolutions
-- ============================================================================

USE DevSolutions;
GO

PRINT '=================================================================';
PRINT 'INICIO: Fix UNIQUE constraints para Items_Presentaciones';
PRINT '=================================================================';
GO

-- ============================================================================
-- PASO 1: Eliminar las restricciones UNIQUE existentes
-- ============================================================================

PRINT '';
PRINT 'PASO 1: Eliminando restricciones UNIQUE existentes...';
GO

-- Eliminar constraint UNIQUE para Item_Presentacion_CodigoSKU
IF EXISTS (
    SELECT * FROM sys.key_constraints 
    WHERE name = 'UQ_Items_Presentaciones_SKU' 
    AND parent_object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    ALTER TABLE Items.Items_Presentaciones 
    DROP CONSTRAINT UQ_Items_Presentaciones_SKU;
    PRINT '✓ Eliminada restricción UQ_Items_Presentaciones_SKU';
END
ELSE
BEGIN
    PRINT '⚠ Restricción UQ_Items_Presentaciones_SKU no existe';
END
GO

-- Eliminar constraint UNIQUE para Item_Presentaciones_CodigoBarras
IF EXISTS (
    SELECT * FROM sys.key_constraints 
    WHERE name = 'UQ_Items_Presentaciones_Barras' 
    AND parent_object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    ALTER TABLE Items.Items_Presentaciones 
    DROP CONSTRAINT UQ_Items_Presentaciones_Barras;
    PRINT '✓ Eliminada restricción UQ_Items_Presentaciones_Barras';
END
ELSE
BEGIN
    PRINT '⚠ Restricción UQ_Items_Presentaciones_Barras no existe';
END
GO

-- ============================================================================
-- PASO 2: Crear índices únicos filtrados (permiten múltiples NULL)
-- ============================================================================

PRINT '';
PRINT 'PASO 2: Creando índices únicos filtrados...';
GO

-- Crear índice único filtrado para Item_Presentacion_CodigoSKU
-- Solo aplica la unicidad cuando el valor NO ES NULL
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UQ_Items_Presentaciones_SKU_Filtered' 
    AND object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Items_Presentaciones_SKU_Filtered
    ON Items.Items_Presentaciones(Item_Presentacion_CodigoSKU)
    WHERE Item_Presentacion_CodigoSKU IS NOT NULL;
    PRINT '✓ Creado índice único filtrado para Item_Presentacion_CodigoSKU';
END
ELSE
BEGIN
    PRINT '⚠ Índice UQ_Items_Presentaciones_SKU_Filtered ya existe';
END
GO

-- Crear índice único filtrado para Item_Presentaciones_CodigoBarras
-- Solo aplica la unicidad cuando el valor NO ES NULL
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UQ_Items_Presentaciones_Barras_Filtered' 
    AND object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Items_Presentaciones_Barras_Filtered
    ON Items.Items_Presentaciones(Item_Presentaciones_CodigoBarras)
    WHERE Item_Presentaciones_CodigoBarras IS NOT NULL;
    PRINT '✓ Creado índice único filtrado para Item_Presentaciones_CodigoBarras';
END
ELSE
BEGIN
    PRINT '⚠ Índice UQ_Items_Presentaciones_Barras_Filtered ya existe';
END
GO

-- ============================================================================
-- PASO 3: Verificar los cambios
-- ============================================================================

PRINT '';
PRINT 'PASO 3: Verificando cambios realizados...';
GO

-- Verificar que no existan las restricciones UNIQUE antiguas
IF NOT EXISTS (
    SELECT * FROM sys.key_constraints 
    WHERE name IN ('UQ_Items_Presentaciones_SKU', 'UQ_Items_Presentaciones_Barras')
    AND parent_object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    PRINT '✓ Restricciones UNIQUE antiguas eliminadas correctamente';
END
ELSE
BEGIN
    PRINT '✗ ERROR: Aún existen restricciones UNIQUE antiguas';
END
GO

-- Verificar que existan los nuevos índices filtrados
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name IN ('UQ_Items_Presentaciones_SKU_Filtered', 'UQ_Items_Presentaciones_Barras_Filtered')
    AND object_id = OBJECT_ID('Items.Items_Presentaciones')
)
BEGIN
    PRINT '✓ Índices únicos filtrados creados correctamente';
END
ELSE
BEGIN
    PRINT '✗ ERROR: No se crearon los índices únicos filtrados';
END
GO

-- Mostrar información de los índices creados
PRINT '';
PRINT 'Información de índices únicos filtrados:';
SELECT 
    i.name AS NombreIndice,
    i.type_desc AS TipoIndice,
    i.is_unique AS EsUnico,
    i.has_filter AS TieneFiltro,
    i.filter_definition AS DefinicionFiltro,
    OBJECT_NAME(i.object_id) AS NombreTabla
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('Items.Items_Presentaciones')
    AND i.name IN ('UQ_Items_Presentaciones_SKU_Filtered', 'UQ_Items_Presentaciones_Barras_Filtered');
GO

-- ============================================================================
-- PASO 4: Pruebas de validación
-- ============================================================================

PRINT '';
PRINT 'PASO 4: Ejecutando pruebas de validación...';
GO

-- Limpiar datos de prueba si existen
DELETE FROM Items.Items_Presentaciones WHERE Item_Id = 999999;
GO

-- Nota: Las pruebas reales deben hacerse manualmente desde la aplicación
PRINT '✓ Listo para pruebas desde la aplicación';
PRINT '';
PRINT 'PRUEBAS MANUALES RECOMENDADAS:';
PRINT '1. Crear múltiples presentaciones SIN código SKU (todos NULL) - Debe permitir';
PRINT '2. Crear múltiples presentaciones SIN código de barras (todos NULL) - Debe permitir';
PRINT '3. Crear presentaciones con códigos SKU únicos - Debe permitir';
PRINT '4. Intentar crear presentación con SKU duplicado - Debe rechazar';
PRINT '5. Intentar crear presentación con código de barras duplicado - Debe rechazar';
GO

-- ============================================================================
-- RESUMEN
-- ============================================================================

PRINT '';
PRINT '=================================================================';
PRINT 'RESUMEN DE CAMBIOS:';
PRINT '=================================================================';
PRINT 'Tabla afectada: Items.Items_Presentaciones';
PRINT '';
PRINT 'Restricciones ELIMINADAS:';
PRINT '  - UQ_Items_Presentaciones_SKU (permitía solo 1 NULL)';
PRINT '  - UQ_Items_Presentaciones_Barras (permitía solo 1 NULL)';
PRINT '';
PRINT 'Índices únicos filtrados CREADOS:';
PRINT '  - UQ_Items_Presentaciones_SKU_Filtered';
PRINT '    WHERE Item_Presentacion_CodigoSKU IS NOT NULL';
PRINT '  - UQ_Items_Presentaciones_Barras_Filtered';
PRINT '    WHERE Item_Presentaciones_CodigoBarras IS NOT NULL';
PRINT '';
PRINT 'BENEFICIOS:';
PRINT '  ✓ Permite múltiples valores NULL en SKU';
PRINT '  ✓ Permite múltiples valores NULL en Código de Barras';
PRINT '  ✓ Mantiene la unicidad cuando hay valores no-NULL';
PRINT '  ✓ Mejora el rendimiento de búsquedas por estos campos';
PRINT '';
PRINT 'NOTA: La restricción UQ_Items_Presentaciones (Item_Id + Presentacion_Nombre)';
PRINT '      se mantiene sin cambios porque ambos campos son NOT NULL.';
PRINT '=================================================================';
PRINT 'FIN: Fix UNIQUE constraints para Items_Presentaciones';
PRINT '=================================================================';
GO
