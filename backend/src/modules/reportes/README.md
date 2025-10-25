# Módulo de Reportes - KardexPlus

## Descripción

Este módulo proporciona endpoints para generar reportes de inventario en diferentes formatos. Los datos pueden ser exportados a Excel o PDF desde el frontend.

## Endpoints Disponibles

### 1. Reporte de Inventario Actual

**GET** `/api/reportes/inventario-actual`

Genera un reporte completo del inventario actual con toda la información de productos.

**Query Parameters:**
- `bodega_id` (opcional): Filtrar por bodega específica
- `categoria_id` (opcional): Filtrar por categoría
- `solo_con_stock` (opcional): `true` para mostrar solo items con existencias

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "SKU": "LAP-001",
        "Nombre": "Lapicero Azul BIC",
        "Categoria": "Papelería",
        "Unidad_Medida": "Unidad",
        "Bodega": "Bodega Principal",
        "Presentacion": "Unidad",
        "Cantidad": 150,
        "Costo_Unitario": 2.50,
        "Precio_Venta": 5.00,
        "Valor_Total_Costo": 375.00,
        "Valor_Total_Venta": 750.00,
        "Stock_Minimo": 50,
        "Stock_Maximo": 500,
        "Estado_Stock": "Normal",
        "Ultima_Actualizacion": "2024-10-25T10:30:00.000Z"
      }
    ],
    "totales": {
      "total_items": 150,
      "total_cantidad": 5420,
      "total_valor_costo": 125450.00,
      "total_valor_venta": 245680.00,
      "margen_potencial": 120230.00
    },
    "generado_en": "2024-10-25T14:30:00.000Z",
    "filtros_aplicados": {
      "bodega_id": null,
      "categoria_id": null,
      "solo_con_stock": "true"
    }
  },
  "message": "Reporte de inventario actual generado exitosamente"
}
```

**Uso para Excel:**
Los datos en `items` pueden ser directamente convertidos a Excel usando librerías como `xlsx` o `exceljs` en el frontend.

---

### 2. Reporte de Inventario por Bodega

**GET** `/api/reportes/inventario-por-bodega`

Genera un resumen del inventario agrupado por bodega.

**Query Parameters:**
- `bodega_id` (opcional): Filtrar por bodega específica

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "Bodega_Id": 1,
      "Bodega_Nombre": "Bodega Principal",
      "Bodega_Ubicacion": "Zona 10, Guatemala",
      "Bodega_Responsable": "Juan Pérez",
      "Total_Items_Diferentes": 45,
      "Total_Cantidad": 2340,
      "Valor_Total_Costo": 58450.00,
      "Valor_Total_Venta": 112350.00,
      "Items_Sin_Stock": 3,
      "Items_Stock_Bajo": 5
    }
  ],
  "message": "Reporte de inventario por bodega generado exitosamente"
}
```

---

### 3. Reporte de Stock Bajo

**GET** `/api/reportes/stock-bajo`

Lista de items que están por debajo del stock mínimo configurado.

**Query Parameters:**
- `bodega_id` (opcional): Filtrar por bodega específica

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "SKU": "FOL-001",
        "Nombre": "Folder Manila",
        "Bodega": "Bodega Principal",
        "Presentacion": "Unidad",
        "Cantidad_Actual": 8,
        "Stock_Minimo": 20,
        "Diferencia": 12,
        "Costo_Unitario": 0.75,
        "Costo_Reposicion_Sugerida": 9.00,
        "Ultima_Actualizacion": "2024-10-24T16:45:00.000Z"
      }
    ],
    "total_items_bajo_stock": 8,
    "total_costo_reposicion": 245.50,
    "generado_en": "2024-10-25T14:30:00.000Z"
  },
  "message": "Reporte de stock bajo generado exitosamente"
}
```

**Uso:** Este reporte es útil para generar órdenes de compra automáticas.

---

### 4. Reporte de Valorización

**GET** `/api/reportes/valorizacion`

Valorización del inventario agrupado por categoría, mostrando costos, precios de venta y márgenes.

**Query Parameters:**
- `bodega_id` (opcional): Filtrar por bodega específica

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "Categoria": "Papelería",
        "Total_Items": 25,
        "Total_Cantidad": 1250,
        "Valor_Costo": 3125.00,
        "Valor_Venta": 6250.00,
        "Margen_Potencial": 3125.00,
        "Porcentaje_Margen": 100.00
      }
    ],
    "totales": {
      "total_categorias": 5,
      "total_items": 150,
      "total_cantidad": 5420,
      "total_valor_costo": 125450.00,
      "total_valor_venta": 245680.00,
      "total_margen": 120230.00,
      "porcentaje_margen_global": 95.84
    },
    "generado_en": "2024-10-25T14:30:00.000Z"
  },
  "message": "Reporte de valorización generado exitosamente"
}
```

---

### 5. Información de Empresa

**GET** `/api/reportes/info-empresa`

Obtiene información de la empresa para incluir en encabezados de reportes.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "nombre": "KardexPlus",
    "direccion": "Zona 10, Ciudad de Guatemala",
    "telefono": "+502 1234-5678",
    "email": "info@kardexplus.com",
    "nit": "12345678-9",
    "logo_url": "https://ejemplo.com/logo.png"
  }
}
```

**Nota:** Esta información se configura en variables de entorno del backend.

---

## Permisos Requeridos

Todos los endpoints requieren el permiso `reportes.ver` excepto:
- `/api/reportes/info-empresa` - No requiere permisos especiales (solo autenticación)

**Permisos adicionales:**
- `reportes.exportar` - Para funcionalidades de exportación
- `reportes.inventario` - Acceso específico a reportes de inventario
- `reportes.valorizacion` - Acceso a reportes financieros
- `reportes.stock_bajo` - Acceso a alertas de stock

---

## Configuración de Variables de Entorno

Agregar al archivo `.env` del backend:

```env
# Información de la Empresa (para encabezados de reportes)
EMPRESA_NOMBRE=KardexPlus
EMPRESA_DIRECCION=Zona 10, Ciudad de Guatemala
EMPRESA_TELEFONO=+502 1234-5678
EMPRESA_EMAIL=info@kardexplus.com
EMPRESA_NIT=12345678-9
EMPRESA_LOGO_URL=https://ejemplo.com/logo.png
```

---

## Instalación de Permisos

Ejecutar el script SQL para crear los permisos:

```bash
sqlcmd -S localhost -U SA -P 'TuContraseña' -d DevSolutions -i backend/docs/permisos-reportes.sql
```

O desde SQL Server Management Studio, ejecutar el archivo:
`backend/docs/permisos-reportes.sql`

---

## Ejemplos de Uso

### JavaScript/Frontend

```javascript
// Obtener reporte de inventario actual
const reporteInventario = await fetch('/api/reportes/inventario-actual?solo_con_stock=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await reporteInventario.json();
console.log(data.data.items); // Array de items para exportar
```

### Exportar a Excel (Frontend con xlsx)

```javascript
import * as XLSX from 'xlsx';

async function exportarInventarioExcel() {
  const response = await fetch('/api/reportes/inventario-actual?solo_con_stock=true');
  const { data } = await response.json();
  
  // Crear workbook
  const wb = XLSX.utils.book_new();
  
  // Convertir datos a worksheet
  const ws = XLSX.utils.json_to_sheet(data.items);
  
  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  
  // Generar archivo
  XLSX.writeFile(wb, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
}
```

---

## Estructura de Datos del Reporte Principal

El reporte de inventario actual incluye:

| Campo | Descripción | Tipo |
|-------|-------------|------|
| SKU | Código único del producto | String |
| Nombre | Nombre del item | String |
| Categoria | Categoría del producto | String |
| Unidad_Medida | Unidad de medida base | String |
| Bodega | Nombre de la bodega | String |
| Presentacion | Tipo de presentación | String |
| Cantidad | Cantidad en stock | Number |
| Costo_Unitario | Costo por unidad | Decimal |
| Precio_Venta | Precio de venta sugerido | Decimal |
| Valor_Total_Costo | Cantidad × Costo | Decimal |
| Valor_Total_Venta | Cantidad × Precio | Decimal |
| Stock_Minimo | Stock mínimo configurado | Number |
| Stock_Maximo | Stock máximo configurado | Number |
| Estado_Stock | Normal/Stock Bajo/Sin Stock/Sobre Stock | String |
| Ultima_Actualizacion | Fecha última modificación | DateTime |

---

## Notas Técnicas

1. **Performance**: Los reportes usan JOINs optimizados con índices en las tablas principales
2. **Filtros**: Todos los filtros son opcionales y se pueden combinar
3. **Formato**: Los datos se devuelven en formato JSON listo para exportar
4. **Paginación**: No hay paginación, se devuelven todos los registros (usar filtros para limitar)
5. **Caché**: No hay caché implementado, los datos son siempre actuales

---

## Próximas Mejoras

- [ ] Generación de PDF en backend
- [ ] Reportes de movimientos por período
- [ ] Reporte de rotación de inventario
- [ ] Gráficos y estadísticas
- [ ] Programación de reportes automáticos
- [ ] Envío de reportes por email

---

## Soporte

Para problemas o consultas sobre el módulo de reportes:
- Email: soporte@devsolutions.com
- Documentación completa: [Manual Técnico](../MANUAL_TECNICO.md)
