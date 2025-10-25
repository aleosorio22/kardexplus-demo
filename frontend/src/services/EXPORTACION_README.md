# Guía de Uso - Exportación de Reportes

## 📊 Módulo de Exportación de Inventario

### Ubicación
La funcionalidad de exportación está disponible en:
- **Página:** `ExistenciasBodegas.jsx`
- **Servicio:** `reporteService.js`

### Funcionalidades Implementadas

#### 1. Exportación a Excel (.xlsx)
- Genera archivos Excel con formato profesional
- Incluye encabezado con información de la empresa
- Columnas auto-ajustables
- Datos formateados según tipo (moneda, números, texto)

**Campos exportados:**
- SKU
- Nombre del producto
- Categoría
- Bodega
- Presentación
- Cantidad
- Unidad de medida
- Costo unitario
- Precio de venta
- Valor total costo
- Valor total venta
- Estado de stock

#### 2. Exportación a PDF
- Formato apaisado (landscape) para mejor visualización de columnas
- Encabezado con logo y datos de empresa
- Tabla con formato profesional y filas alternadas
- Paginación automática
- Número de página en pie de página

### Cómo Usar

#### Desde la Interfaz de Usuario

1. **Acceder a Existencias:**
   - Ir a la página de "Existencias" desde el menú principal

2. **Aplicar Filtros (Opcional):**
   - Seleccionar bodega específica
   - Seleccionar categoría
   - Filtrar por estado de stock (stock bajo, sin stock)
   - Buscar por nombre o SKU

3. **Exportar:**
   - **Excel:** Click en botón verde "Excel" 📗
   - **PDF:** Click en botón rojo "PDF" 📄

4. **Resultado:**
   - El archivo se descarga automáticamente
   - Nombre del archivo: `inventario_existencias_YYYY-MM-DD.xlsx/pdf`
   - Notificación de éxito/error en pantalla

#### Requisitos

**Dependencias instaladas:**
```json
{
  "xlsx": "^0.18.5",          // Para Excel
  "jspdf": "^2.5.2",          // Para PDF
  "jspdf-autotable": "^3.8.4" // Para tablas en PDF
}
```

**Permisos necesarios:**
- `reportes.ver` - Para ver reportes
- `reportes.exportar` - Para exportar (opcional, según configuración)

### Configuración de Empresa

Para personalizar el encabezado de los reportes, configurar en el backend:

**Archivo:** `backend/.env`

```env
EMPRESA_NOMBRE=KardexPlus
EMPRESA_DIRECCION=Zona 10, Ciudad de Guatemala
EMPRESA_TELEFONO=+502 1234-5678
EMPRESA_EMAIL=info@kardexplus.com
EMPRESA_NIT=12345678-9
EMPRESA_LOGO_URL=https://ejemplo.com/logo.png
```

### API Endpoints Utilizados

```javascript
// Obtener datos del reporte
GET /api/reportes/inventario-actual?bodega_id=1&categoria_id=2&solo_con_stock=true

// Obtener información de empresa
GET /api/reportes/info-empresa
```

### Características Técnicas

#### Formato Excel
- Librería: `xlsx` (SheetJS)
- Formato de salida: `.xlsx` (Excel 2007+)
- Características:
  - Encabezado de empresa en primeras filas
  - Headers en negrita
  - Auto-ajuste de columnas
  - Fecha de generación incluida

#### Formato PDF
- Librería: `jsPDF` + `jspdf-autotable`
- Formato: Letter (Landscape)
- Características:
  - Encabezado corporativo
  - Tabla con zebra striping
  - Headers con fondo azul
  - Paginación automática
  - Número de página en footer

### Manejo de Errores

Los errores se manejan con notificaciones visuales:

```javascript
// Error al exportar
{
  title: 'Error en Exportación',
  message: 'No se pudo exportar el reporte a Excel.',
  type: 'error'
}

// Éxito
{
  title: 'Exportación Exitosa',
  message: 'El reporte se ha exportado correctamente.',
  type: 'success'
}
```

### Estados de UI

**Durante exportación:**
- Botones deshabilitados
- Icono con animación de "bounce"
- Cursor "not-allowed"

**Condiciones para deshabilitar:**
- `loading === true` - Cargando datos
- `exportando === true` - Exportación en proceso
- `existencias.length === 0` - No hay datos para exportar

### Personalización

#### Cambiar orientación de PDF
```javascript
await reporteService.exportarPDF(
    datos,
    'nombre_archivo',
    null,
    { orientation: 'portrait' } // 'landscape' o 'portrait'
);
```

#### Cambiar nombre de archivo
```javascript
await reporteService.exportarExcel(
    datos,
    'mi_reporte_personalizado' // Sin extensión
);
```

#### Formatear datos personalizados
```javascript
const datosPersonalizados = reporteService.formatearDatosParaExportar(
    items,
    'inventario_actual' // 'stock_bajo', 'valorizacion'
);
```

### Solución de Problemas

#### El archivo no se descarga
1. Verificar que hay datos en la tabla
2. Revisar consola del navegador para errores
3. Verificar permisos de descarga del navegador

#### Datos incorrectos en el reporte
1. Verificar filtros aplicados
2. Revisar conexión con API backend
3. Verificar formato de datos en `formatearDatosParaExportar()`

#### Error de dependencias
```bash
# Reinstalar dependencias
cd frontend
npm install xlsx jspdf jspdf-autotable
```

### Ejemplos de Uso Programático

```javascript
import { reporteService } from '../services/reporteService';

// Exportar reporte completo
const exportarTodo = async () => {
    const response = await reporteService.getInventarioActual({});
    const datos = reporteService.formatearDatosParaExportar(
        response.data.items,
        'inventario_actual'
    );
    await reporteService.exportarExcel(datos, 'inventario_completo');
};

// Exportar solo de una bodega
const exportarBodega = async (bodegaId) => {
    const response = await reporteService.getInventarioActual({
        bodega_id: bodegaId,
        solo_con_stock: true
    });
    const datos = reporteService.formatearDatosParaExportar(
        response.data.items,
        'inventario_actual'
    );
    await reporteService.exportarPDF(datos, `bodega_${bodegaId}`);
};
```

### Mejoras Futuras

- [ ] Exportación a CSV
- [ ] Gráficos en PDF
- [ ] Envío por email
- [ ] Programación de reportes automáticos
- [ ] Plantillas personalizadas
- [ ] Comparación de períodos
- [ ] Exportación con imágenes de productos

---

**Última actualización:** 25 de octubre de 2025
**Versión:** 1.0.0
