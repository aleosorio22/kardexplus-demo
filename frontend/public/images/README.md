# Logo de DevSolutions

## Instrucciones

Para que el logo aparezca en los reportes PDF:

1. **Guarda el logo de DevSolutions** como `logo-devsolutions.png` en esta carpeta
2. **Formato recomendado:** PNG con fondo transparente
3. **Dimensiones recomendadas:** 400x150 px (proporción 8:3)
4. **Tamaño de archivo:** Menos de 100 KB para carga rápida

## Ubicación del archivo

```
frontend/
  public/
    images/
      logo-devsolutions.png  ← Guarda tu logo aquí
      README.md              ← Este archivo
```

## Cómo se usa

El logo aparecerá automáticamente en:
- **Reportes PDF** (esquina superior derecha)
- **Dimensiones en PDF:** 40mm x 15mm

Si el logo no existe, el reporte se generará normalmente sin logo (sin errores).

## Nota

Si cambias el nombre del archivo, actualiza la ruta en:
`frontend/src/services/reporteService.js` línea ~215:
```javascript
const logoPath = '/images/logo-devsolutions.png';
```
