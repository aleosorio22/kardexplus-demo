-- ============================================================================
-- Script: Insertar existencia de prueba
-- Descripción: Crea una existencia de 30 unidades del Item 1 en Bodega 1
-- ============================================================================

USE DevSolutions;
GO

-- Verificar que existe la bodega
IF NOT EXISTS (SELECT 1 FROM Warehouses.Bodegas WHERE Bodega_Id = 1)
BEGIN
    PRINT '❌ ERROR: No existe la bodega con ID 1';
    RETURN;
END

-- Verificar que existe el item
IF NOT EXISTS (SELECT 1 FROM Items.Items WHERE Item_Id = 1)
BEGIN
    PRINT '❌ ERROR: No existe el item con ID 1';
    RETURN;
END

-- Eliminar existencia previa si existe
IF EXISTS (SELECT 1 FROM Warehouses.Existencias WHERE Bodega_Id = 1 AND Item_Id = 1)
BEGIN
    DELETE FROM Warehouses.Existencias WHERE Bodega_Id = 1 AND Item_Id = 1;
    PRINT '✓ Existencia previa eliminada';
END

-- Insertar la nueva existencia
INSERT INTO Warehouses.Existencias (Bodega_Id, Item_Id, Cantidad, Fecha_Ultima_Actualizacion)
VALUES (1, 1, 30.0000, GETDATE());

PRINT '✓ Existencia creada exitosamente';
GO

-- Verificar el registro insertado
SELECT 
    e.Existencia_Id,
    e.Bodega_Id,
    b.Bodega_Nombre,
    e.Item_Id,
    i.Item_Nombre,
    i.Item_Codigo_SKU,
    e.Cantidad,
    e.Fecha_Ultima_Actualizacion
FROM Warehouses.Existencias e
INNER JOIN Warehouses.Bodegas b ON e.Bodega_Id = b.Bodega_Id
INNER JOIN Items.Items i ON e.Item_Id = i.Item_Id
WHERE e.Bodega_Id = 1 AND e.Item_Id = 1;
GO

PRINT '';
PRINT '=================================================================';
PRINT 'Ahora puedes probar el endpoint:';
PRINT 'GET http://localhost:3499/api/existencias/bodega/1/item/1';
PRINT '=================================================================';
GO
