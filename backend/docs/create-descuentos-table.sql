-- =====================================================
-- Tabla de Descuentos para Items y Presentaciones
-- Opción 1: Simple y Directa
-- =====================================================

CREATE TABLE Items.Descuentos (
    Descuento_Id INT IDENTITY(1,1) NOT NULL,
    
    -- Aplicabilidad: Item o Presentación (uno de los dos debe ser NULL)
    Item_Id INT NULL,
    Item_Presentaciones_Id INT NULL,
    
    -- Tipo y valor del descuento
    Descuento_Tipo CHAR(1) NOT NULL,  -- 'P' = Porcentaje, 'M' = Monto fijo
    Descuento_Valor DECIMAL(10,4) NOT NULL,
    
    -- Descuento por cantidad (opcional)
    Cantidad_Minima INT NULL DEFAULT 1,  -- Cantidad mínima para aplicar descuento
    
    -- Vigencia
    Descuento_Fecha_Inicio DATETIME2(0) NOT NULL,
    Descuento_Fecha_Fin DATETIME2(0) NULL,
    
    -- Prioridad (número más alto = mayor prioridad)
    Descuento_Prioridad INT DEFAULT 1,
    
    -- ¿Se puede combinar con otros descuentos?
    Es_Combinable BIT DEFAULT 0,
    
    -- Estado y descripción
    Descuento_Estado BIT DEFAULT 1,
    Descuento_Descripcion NVARCHAR(200) NULL,
    
    -- Auditoría
    Usuario_Creacion_Id INT NULL,
    Fecha_Creacion DATETIME2(0) DEFAULT GETDATE(),
    Usuario_Modificacion_Id INT NULL,
    Fecha_Modificacion DATETIME2(0) NULL,
    
    CONSTRAINT PK_Descuentos PRIMARY KEY (Descuento_Id),
    
    -- FKs: Cambiamos CASCADE en presentaciones a NO ACTION para evitar rutas múltiples
    CONSTRAINT FK_Descuentos_Item FOREIGN KEY (Item_Id) 
        REFERENCES Items.Items(Item_Id) ON DELETE CASCADE,
    CONSTRAINT FK_Descuentos_Presentacion FOREIGN KEY (Item_Presentaciones_Id) 
        REFERENCES Items.Items_Presentaciones(Item_Presentaciones_Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Descuentos_Usuario_Creacion FOREIGN KEY (Usuario_Creacion_Id) 
        REFERENCES Security.Usuarios(Usuario_Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Descuentos_Usuario_Modificacion FOREIGN KEY (Usuario_Modificacion_Id) 
        REFERENCES Security.Usuarios(Usuario_Id) ON DELETE NO ACTION,
    
    -- Validaciones
    CONSTRAINT CHK_Descuento_Tipo CHECK (Descuento_Tipo IN ('P', 'M')),
    CONSTRAINT CHK_Descuento_Valor_Positivo CHECK (Descuento_Valor > 0),
    CONSTRAINT CHK_Descuento_Porcentaje CHECK (
        Descuento_Tipo != 'P' OR (Descuento_Valor > 0 AND Descuento_Valor <= 100)
    ),
    CONSTRAINT CHK_Descuento_Fechas CHECK (
        Descuento_Fecha_Fin IS NULL OR Descuento_Fecha_Fin >= Descuento_Fecha_Inicio
    ),
    CONSTRAINT CHK_Descuento_Item_O_Presentacion CHECK (
        (Item_Id IS NOT NULL AND Item_Presentaciones_Id IS NULL) OR
        (Item_Id IS NULL AND Item_Presentaciones_Id IS NOT NULL)
    ),
    CONSTRAINT CHK_Cantidad_Minima CHECK (Cantidad_Minima >= 1)
);
GO

-- Índices para mejorar el rendimiento
CREATE INDEX IX_Descuentos_Item ON Items.Descuentos(Item_Id) WHERE Item_Id IS NOT NULL;
CREATE INDEX IX_Descuentos_Presentacion ON Items.Descuentos(Item_Presentaciones_Id) WHERE Item_Presentaciones_Id IS NOT NULL;
CREATE INDEX IX_Descuentos_Fechas ON Items.Descuentos(Descuento_Fecha_Inicio, Descuento_Fecha_Fin);
CREATE INDEX IX_Descuentos_Estado ON Items.Descuentos(Descuento_Estado);
GO

-- =====================================================
-- Trigger para mantener integridad referencial en Presentaciones
-- Compensa el ON DELETE NO ACTION
-- =====================================================
CREATE TRIGGER TR_Items_Presentaciones_Delete_Descuentos
ON Items.Items_Presentaciones
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Eliminar descuentos asociados a las presentaciones que se van a borrar
    DELETE FROM Items.Descuentos
    WHERE Item_Presentaciones_Id IN (SELECT Item_Presentaciones_Id FROM deleted);
    
    -- Eliminar las presentaciones
    DELETE FROM Items.Items_Presentaciones
    WHERE Item_Presentaciones_Id IN (SELECT Item_Presentaciones_Id FROM deleted);
END;
GO

PRINT 'Tabla Items.Descuentos creada exitosamente';
PRINT 'Trigger TR_Items_Presentaciones_Delete_Descuentos creado exitosamente';
GO
