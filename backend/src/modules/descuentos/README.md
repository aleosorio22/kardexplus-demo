# Módulo de Descuentos - KardexPlus

## 📋 Descripción
Módulo para gestionar descuentos en items y presentaciones del inventario. Permite crear descuentos por porcentaje o monto fijo, con vigencia temporal, prioridades y capacidad de combinación.

## 🗂️ Estructura de la Base de Datos

### Tabla: `Items.Descuentos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Descuento_Id` | INT IDENTITY | ID único del descuento |
| `Item_Id` | INT NULL | ID del item (si aplica a item completo) |
| `Item_Presentaciones_Id` | INT NULL | ID de presentación (si aplica a presentación específica) |
| `Descuento_Tipo` | CHAR(1) | 'P' = Porcentaje, 'M' = Monto fijo |
| `Descuento_Valor` | DECIMAL(10,4) | Valor del descuento (porcentaje o monto) |
| `Cantidad_Minima` | INT | Cantidad mínima para aplicar el descuento |
| `Descuento_Fecha_Inicio` | DATETIME2(0) | Fecha de inicio de vigencia |
| `Descuento_Fecha_Fin` | DATETIME2(0) NULL | Fecha de fin (NULL = sin límite) |
| `Descuento_Prioridad` | INT | Prioridad (mayor número = mayor prioridad) |
| `Es_Combinable` | BIT | Si se puede combinar con otros descuentos |
| `Descuento_Estado` | BIT | 1 = Activo, 0 = Inactivo |
| `Descuento_Descripcion` | NVARCHAR(200) | Descripción del descuento |
| `Usuario_Creacion_Id` | INT | Usuario que creó el descuento |
| `Fecha_Creacion` | DATETIME2(0) | Fecha de creación |
| `Usuario_Modificacion_Id` | INT | Usuario que modificó |
| `Fecha_Modificacion` | DATETIME2(0) | Fecha de última modificación |

### Restricciones

- Un descuento solo puede aplicarse a **un Item** O **una Presentación**, no a ambos
- El porcentaje debe estar entre 0 y 100
- El valor debe ser mayor a 0
- La fecha de fin debe ser posterior o igual a la fecha de inicio
- Cantidad mínima debe ser >= 1

## 🔐 Permisos

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `descuentos.ver` | Ver Descuentos | Visualizar lista de descuentos |
| `descuentos.crear` | Crear Descuentos | Crear nuevos descuentos |
| `descuentos.editar` | Editar Descuentos | Modificar descuentos existentes |
| `descuentos.eliminar` | Eliminar Descuentos | Eliminar descuentos |
| `descuentos.activar_desactivar` | Activar/Desactivar | Cambiar estado de descuentos |
| `descuentos.ver_todos` | Ver Todos | Ver todos incluyendo inactivos |
| `descuentos.aplicar` | Aplicar Descuentos | Aplicar descuentos en operaciones |

## 🚀 API Endpoints

### Consulta de Descuentos

#### GET `/api/descuentos`
Obtener todos los descuentos con filtros opcionales.

**Query Parameters:**
- `estado` (0/1): Filtrar por estado
- `item_id` (int): Filtrar por item
- `presentacion_id` (int): Filtrar por presentación
- `tipo` (P/M): Filtrar por tipo
- `vigentes` (true/false): Solo descuentos vigentes

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "Descuento_Id": 1,
      "Item_Id": 5,
      "Item_Nombre": "Café Arábica Premium",
      "Descuento_Tipo": "P",
      "Descuento_Valor": 10.00,
      "Cantidad_Minima": 1,
      "Descuento_Fecha_Inicio": "2025-01-01T00:00:00",
      "Descuento_Fecha_Fin": "2025-12-31T23:59:59",
      "Descuento_Prioridad": 1,
      "Es_Combinable": false,
      "Descuento_Estado": true,
      "Descuento_Descripcion": "Promoción anual"
    }
  ],
  "total": 1
}
```

#### GET `/api/descuentos/vigentes`
Obtener solo descuentos vigentes actualmente.

#### GET `/api/descuentos/:descuentoId`
Obtener un descuento específico por ID.

#### GET `/api/descuentos/item/:itemId?cantidad=X`
Obtener descuentos aplicables a un item.

#### GET `/api/descuentos/presentacion/:presentacionId?cantidad=X`
Obtener descuentos aplicables a una presentación.

### Cálculo de Descuentos

#### POST `/api/descuentos/calcular`
Calcular el descuento aplicable.

**Body:**
```json
{
  "item_id": 5,
  "cantidad": 10,
  "precio_base": 100.00
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "descuento_aplicado": 10.00,
    "precio_final": 90.00,
    "descuentos_disponibles": [...],
    "descuento_principal": {...}
  }
}
```

### Gestión de Descuentos

#### POST `/api/descuentos`
Crear un nuevo descuento.

**Body:**
```json
{
  "Item_Id": 5,
  "Descuento_Tipo": "P",
  "Descuento_Valor": 15.00,
  "Cantidad_Minima": 5,
  "Descuento_Fecha_Inicio": "2025-01-01",
  "Descuento_Fecha_Fin": "2025-12-31",
  "Descuento_Prioridad": 2,
  "Es_Combinable": false,
  "Descuento_Descripcion": "Descuento por volumen"
}
```

#### PUT `/api/descuentos/:descuentoId`
Actualizar un descuento existente.

#### PUT `/api/descuentos/:descuentoId/toggle-estado`
Activar/desactivar un descuento.

#### DELETE `/api/descuentos/:descuentoId`
Eliminar un descuento permanentemente.

## 💡 Ejemplos de Uso

### 1. Descuento por Porcentaje Simple
```javascript
// 10% de descuento en un producto
{
  "Item_Id": 1,
  "Descuento_Tipo": "P",
  "Descuento_Valor": 10.00,
  "Cantidad_Minima": 1,
  "Descuento_Fecha_Inicio": "2025-01-01",
  "Descuento_Descripcion": "Descuento del 10%"
}
```

### 2. Descuento por Volumen
```javascript
// $5 de descuento al comprar 10 o más
{
  "Item_Id": 2,
  "Descuento_Tipo": "M",
  "Descuento_Valor": 5.00,
  "Cantidad_Minima": 10,
  "Descuento_Fecha_Inicio": "2025-01-01",
  "Descuento_Descripcion": "Descuento por mayoreo"
}
```

### 3. Promoción Temporal
```javascript
// 25% Black Friday (vigencia limitada)
{
  "Item_Id": 3,
  "Descuento_Tipo": "P",
  "Descuento_Valor": 25.00,
  "Cantidad_Minima": 1,
  "Descuento_Fecha_Inicio": "2025-11-25",
  "Descuento_Fecha_Fin": "2025-11-30",
  "Descuento_Prioridad": 5,
  "Descuento_Descripcion": "BLACK FRIDAY"
}
```

### 4. Descuento en Presentación Específica
```javascript
// 15% en cajas completas
{
  "Item_Presentaciones_Id": 5,
  "Descuento_Tipo": "P",
  "Descuento_Valor": 15.00,
  "Cantidad_Minima": 1,
  "Descuento_Fecha_Inicio": "2025-01-01",
  "Descuento_Descripcion": "Descuento en cajas"
}
```

### 5. Descuento Combinable
```javascript
// 5% adicional acumulable
{
  "Item_Id": 4,
  "Descuento_Tipo": "P",
  "Descuento_Valor": 5.00,
  "Cantidad_Minima": 1,
  "Descuento_Fecha_Inicio": "2025-01-01",
  "Es_Combinable": true,
  "Descuento_Descripcion": "Descuento adicional"
}
```

## 🔄 Lógica de Aplicación de Descuentos

1. **Filtrado por vigencia**: Solo se consideran descuentos activos y dentro del rango de fechas
2. **Filtrado por cantidad**: Solo descuentos cuya cantidad mínima sea <= cantidad comprada
3. **Ordenamiento**: Por prioridad (DESC) y valor (DESC)
4. **Descuento principal**: Se toma el primero de la lista ordenada
5. **Descuentos combinables**: Si el principal es combinable, se suman los demás que también lo sean
6. **Límite**: El descuento total nunca puede ser mayor al precio base

## 📝 Instalación

### 1. Ejecutar scripts SQL
```bash
# 1. Crear tabla
psql -f docs/create-descuentos-table.sql

# 2. Insertar permisos
psql -f docs/permisos-descuentos.sql

# 3. Datos de prueba (opcional)
psql -f docs/insert-test-descuentos.sql
```

### 2. El backend ya está integrado
Las rutas ya están registradas en `src/index.js`

### 3. Probar endpoints
```bash
# Obtener todos los descuentos
curl -H "Authorization: Bearer TOKEN" http://localhost:3499/api/descuentos

# Crear descuento
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"Item_Id":1,"Descuento_Tipo":"P","Descuento_Valor":10}' \
  http://localhost:3499/api/descuentos
```

## 🎯 Casos de Uso

1. **Promociones estacionales**: Black Friday, Navidad, etc.
2. **Descuentos por volumen**: Incentivos para compras al por mayor
3. **Ofertas de lanzamiento**: Descuentos temporales en nuevos productos
4. **Liquidación de stock**: Descuentos para productos próximos a vencer
5. **Descuentos por presentación**: Incentivos para comprar en formatos específicos
6. **Programas de fidelidad**: Descuentos acumulables para clientes frecuentes

## ⚠️ Consideraciones

- **Integridad referencial**: Los descuentos se eliminan en cascada si se elimina el item
- **No usar trigger**: Por el momento no se usa trigger para presentaciones (ON DELETE NO ACTION)
- **Auditoría**: Todos los cambios quedan registrados con usuario y fecha
- **Validaciones**: El backend valida todas las reglas de negocio antes de guardar

## 🔧 Mantenimiento

### Limpieza de descuentos vencidos
```sql
-- Desactivar descuentos vencidos
UPDATE Items.Descuentos
SET Descuento_Estado = 0
WHERE Descuento_Fecha_Fin < GETDATE()
  AND Descuento_Estado = 1;
```

### Consulta de descuentos activos por item
```sql
SELECT * FROM Items.Descuentos
WHERE Item_Id = @ItemId
  AND Descuento_Estado = 1
  AND Descuento_Fecha_Inicio <= GETDATE()
  AND (Descuento_Fecha_Fin IS NULL OR Descuento_Fecha_Fin >= GETDATE())
ORDER BY Descuento_Prioridad DESC;
```

---

**Desarrollado para KardexPlus** 🚀
