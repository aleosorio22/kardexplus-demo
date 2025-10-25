-- =====================================================
-- DATOS DE PRUEBA PARA DESCUENTOS
-- =====================================================

-- Nota: Reemplaza los IDs según los items y presentaciones que tengas en tu BD

-- =====================================================
-- 1. Descuento de porcentaje en un Item completo
-- =====================================================
-- 10% de descuento en Café Arábica (reemplaza Item_Id con el ID real)
INSERT INTO Items.Descuentos (
    Item_Id,
    Item_Presentaciones_Id,
    Descuento_Tipo,
    Descuento_Valor,
    Cantidad_Minima,
    Descuento_Fecha_Inicio,
    Descuento_Fecha_Fin,
    Descuento_Prioridad,
    Es_Combinable,
    Descuento_Estado,
    Descuento_Descripcion,
    Usuario_Creacion_Id
)
VALUES (
    1,  -- Item_Id: Reemplazar con ID real
    NULL,
    'P',  -- Porcentaje
    10.00,
    1,  -- Cantidad mínima: 1 unidad
    '2025-01-01',
    '2025-12-31',
    1,
    0,  -- No combinable
    1,  -- Activo
    'Descuento del 10% en café arábica - Promoción anual',
    1  -- Usuario admin
);
GO

-- =====================================================
-- 2. Descuento de monto fijo por cantidad
-- =====================================================
-- $5 de descuento al comprar 10 o más unidades
INSERT INTO Items.Descuentos (
    Item_Id,
    Item_Presentaciones_Id,
    Descuento_Tipo,
    Descuento_Valor,
    Cantidad_Minima,
    Descuento_Fecha_Inicio,
    Descuento_Fecha_Fin,
    Descuento_Prioridad,
    Es_Combinable,
    Descuento_Estado,
    Descuento_Descripcion,
    Usuario_Creacion_Id
)
VALUES (
    2,  -- Item_Id: Reemplazar con ID real
    NULL,
    'M',  -- Monto fijo
    5.00,
    10,  -- Cantidad mínima: 10 unidades
    GETDATE(),
    DATEADD(MONTH, 3, GETDATE()),
    2,  -- Prioridad alta
    0,
    1,
    'Descuento de $5 por compra al por mayor (10+ unidades)',
    1
);
GO

-- =====================================================
-- 3. Descuento en una presentación específica
-- =====================================================
-- 15% de descuento en presentación "Caja x 12"
INSERT INTO Items.Descuentos (
    Item_Id,
    Item_Presentaciones_Id,
    Descuento_Tipo,
    Descuento_Valor,
    Cantidad_Minima,
    Descuento_Fecha_Inicio,
    Descuento_Fecha_Fin,
    Descuento_Prioridad,
    Es_Combinable,
    Descuento_Estado,
    Descuento_Descripcion,
    Usuario_Creacion_Id
)
VALUES (
    NULL,
    1,  -- Item_Presentaciones_Id: Reemplazar con ID real
    'P',
    15.00,
    1,
    GETDATE(),
    DATEADD(MONTH, 6, GETDATE()),
    1,
    0,
    1,
    'Promoción 15% en cajas completas',
    1
);
GO

-- =====================================================
-- 4. Descuento combinable
-- =====================================================
-- 5% adicional combinable con otros descuentos
INSERT INTO Items.Descuentos (
    Item_Id,
    Item_Presentaciones_Id,
    Descuento_Tipo,
    Descuento_Valor,
    Cantidad_Minima,
    Descuento_Fecha_Inicio,
    Descuento_Fecha_Fin,
    Descuento_Prioridad,
    Es_Combinable,
    Descuento_Estado,
    Descuento_Descripcion,
    Usuario_Creacion_Id
)
VALUES (
    3,  -- Item_Id: Reemplazar con ID real
    NULL,
    'P',
    5.00,
    1,
    GETDATE(),
    NULL,  -- Sin fecha de fin (permanente)
    1,
    1,  -- Es combinable
    1,
    'Descuento adicional del 5% - Acumulable',
    1
);
GO

-- =====================================================
-- 5. Descuento temporal (Black Friday / Cyber Monday)
-- =====================================================
INSERT INTO Items.Descuentos (
    Item_Id,
    Item_Presentaciones_Id,
    Descuento_Tipo,
    Descuento_Valor,
    Cantidad_Minima,
    Descuento_Fecha_Inicio,
    Descuento_Fecha_Fin,
    Descuento_Prioridad,
    Es_Combinable,
    Descuento_Estado,
    Descuento_Descripcion,
    Usuario_Creacion_Id
)
VALUES (
    4,  -- Item_Id: Reemplazar con ID real
    NULL,
    'P',
    25.00,
    1,
    '2025-11-25',
    '2025-11-30',
    5,  -- Prioridad muy alta
    0,
    1,
    'BLACK FRIDAY - 25% de descuento',
    1
);
GO

-- =====================================================
-- Verificar descuentos creados
-- =====================================================
SELECT 
    d.Descuento_Id,
    CASE 
        WHEN d.Item_Id IS NOT NULL THEN CONCAT('Item: ', i.Item_Nombre)
        ELSE CONCAT('Presentación: ', p.Presentacion_Nombre)
    END AS Aplica_A,
    CASE d.Descuento_Tipo
        WHEN 'P' THEN CONCAT(d.Descuento_Valor, '%')
        WHEN 'M' THEN CONCAT('$', d.Descuento_Valor)
    END AS Descuento,
    d.Cantidad_Minima,
    d.Descuento_Fecha_Inicio,
    d.Descuento_Fecha_Fin,
    d.Descuento_Prioridad,
    CASE d.Es_Combinable WHEN 1 THEN 'Sí' ELSE 'No' END AS Combinable,
    CASE d.Descuento_Estado WHEN 1 THEN 'Activo' ELSE 'Inactivo' END AS Estado,
    d.Descuento_Descripcion
FROM Items.Descuentos d
LEFT JOIN Items.Items i ON d.Item_Id = i.Item_Id
LEFT JOIN Items.Items_Presentaciones ip ON d.Item_Presentaciones_Id = ip.Item_Presentaciones_Id
LEFT JOIN Items.Presentaciones p ON ip.Presentacion_Id = p.Presentacion_Id
ORDER BY d.Descuento_Prioridad DESC, d.Descuento_Fecha_Inicio DESC;
GO

PRINT 'Datos de prueba para Descuentos insertados exitosamente';
PRINT 'NOTA: Recuerda ajustar los IDs de Items y Presentaciones según tu base de datos';
GO
