-- ============================================
-- Fix UNIQUE constraint for NULL values
-- SQL Server trata múltiples NULL como duplicados en UNIQUE constraints
-- Solución: Usar índices únicos filtrados
-- ============================================

USE DevSolutions;
GO

-- Verificar restricciones existentes
SELECT 
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ConstraintName,
    type_desc AS ConstraintType
FROM sys.objects
WHERE parent_object_id = OBJECT_ID('Items.Items')
AND type IN ('UQ', 'PK')
ORDER BY name;
GO

-- ============================================
-- PASO 1: Eliminar restricciones UNIQUE actuales
-- ============================================

-- Eliminar UNIQUE constraint de Item_Codigo_SKU
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_Items_Codigo_SKU' AND type = 'UQ')
BEGIN
    ALTER TABLE Items.Items DROP CONSTRAINT UQ_Items_Codigo_SKU;
    PRINT 'Constraint UQ_Items_Codigo_SKU eliminada';
END
ELSE
BEGIN
    PRINT 'Constraint UQ_Items_Codigo_SKU no existe';
END
GO

-- Eliminar UNIQUE constraint de Item_Codigo_Barra
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_Items_Codigo_Barra' AND type = 'UQ')
BEGIN
    ALTER TABLE Items.Items DROP CONSTRAINT UQ_Items_Codigo_Barra;
    PRINT 'Constraint UQ_Items_Codigo_Barra eliminada';
END
ELSE
BEGIN
    PRINT 'Constraint UQ_Items_Codigo_Barra no existe';
END
GO

-- ============================================
-- PASO 2: Crear índices únicos filtrados
-- Los índices filtrados ignoran valores NULL,
-- permitiendo múltiples registros con NULL
-- pero manteniendo unicidad para valores no-NULL
-- ============================================

-- Índice único para Item_Codigo_SKU (solo valores no-NULL)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Items_Codigo_SKU' AND object_id = OBJECT_ID('Items.Items'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Items_Codigo_SKU 
    ON Items.Items(Item_Codigo_SKU) 
    WHERE Item_Codigo_SKU IS NOT NULL;
    
    PRINT 'Índice único filtrado UQ_Items_Codigo_SKU creado';
END
ELSE
BEGIN
    PRINT 'Índice UQ_Items_Codigo_SKU ya existe';
END
GO

-- Índice único para Item_Codigo_Barra (solo valores no-NULL)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Items_Codigo_Barra' AND object_id = OBJECT_ID('Items.Items'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Items_Codigo_Barra 
    ON Items.Items(Item_Codigo_Barra) 
    WHERE Item_Codigo_Barra IS NOT NULL;
    
    PRINT 'Índice único filtrado UQ_Items_Codigo_Barra creado';
END
ELSE
BEGIN
    PRINT 'Índice UQ_Items_Codigo_Barra ya existe';
END
GO

-- ============================================
-- PASO 3: Verificar los nuevos índices
-- ============================================

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDefinition,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('Items.Items')
AND i.name IN ('UQ_Items_Codigo_SKU', 'UQ_Items_Codigo_Barra')
ORDER BY i.name;
GO

-- ============================================
-- PRUEBAS
-- ============================================

PRINT '============================================';
PRINT 'Ejecutando pruebas de validación';
PRINT '============================================';

-- Test 1: Insertar items sin SKU ni Código de Barra (debe permitir múltiples NULL)
BEGIN TRY
    INSERT INTO Items.Items (Item_Nombre, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test 1 Sin Códigos', 10.00, 1, 1, 'B');
    
    INSERT INTO Items.Items (Item_Nombre, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test 2 Sin Códigos', 15.00, 1, 1, 'B');
    
    PRINT '✅ Test 1 PASADO: Se permiten múltiples items sin SKU/Código de Barra';
    
    -- Limpiar datos de prueba
    DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test%Sin Códigos';
END TRY
BEGIN CATCH
    PRINT '❌ Test 1 FALLIDO: ' + ERROR_MESSAGE();
    -- Intentar limpiar si hubo error parcial
    IF EXISTS (SELECT 1 FROM Items.Items WHERE Item_Nombre LIKE 'Item Test%Sin Códigos')
        DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test%Sin Códigos';
END CATCH
GO

-- Test 2: Intentar insertar SKU duplicado (debe fallar)
BEGIN TRY
    INSERT INTO Items.Items (Item_Nombre, Item_Codigo_SKU, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test Con SKU 1', 'TEST-SKU-001', 10.00, 1, 1, 'B');
    
    INSERT INTO Items.Items (Item_Nombre, Item_Codigo_SKU, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test Con SKU 2', 'TEST-SKU-001', 15.00, 1, 1, 'B');
    
    PRINT '❌ Test 2 FALLIDO: Se permitió SKU duplicado (no debería)';
    DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con SKU%';
END TRY
BEGIN CATCH
    PRINT '✅ Test 2 PASADO: SKU duplicado fue rechazado correctamente';
    PRINT '   Mensaje: ' + ERROR_MESSAGE();
    -- Limpiar
    IF EXISTS (SELECT 1 FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con SKU%')
        DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con SKU%';
END CATCH
GO

-- Test 3: Intentar insertar Código de Barra duplicado (debe fallar)
BEGIN TRY
    INSERT INTO Items.Items (Item_Nombre, Item_Codigo_Barra, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test Con Barra 1', '1234567890123', 10.00, 1, 1, 'B');
    
    INSERT INTO Items.Items (Item_Nombre, Item_Codigo_Barra, Item_Costo_Unitario, CategoriaItem_Id, UnidadMedidaBase_Id, Item_Tipo)
    VALUES ('Item Test Con Barra 2', '1234567890123', 15.00, 1, 1, 'B');
    
    PRINT '❌ Test 3 FALLIDO: Se permitió Código de Barra duplicado (no debería)';
    DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con Barra%';
END TRY
BEGIN CATCH
    PRINT '✅ Test 3 PASADO: Código de Barra duplicado fue rechazado correctamente';
    PRINT '   Mensaje: ' + ERROR_MESSAGE();
    -- Limpiar
    IF EXISTS (SELECT 1 FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con Barra%')
        DELETE FROM Items.Items WHERE Item_Nombre LIKE 'Item Test Con Barra%';
END CATCH
GO

PRINT '============================================';
PRINT 'Pruebas completadas';
PRINT '============================================';
GO
