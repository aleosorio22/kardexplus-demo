// =======================================
// SERVICIO DE REPORTES
// Maneja todas las operaciones relacionadas con reportes de inventario
// =======================================

import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const reporteService = {
    
    // =======================================
    // CONSULTAS DE REPORTES
    // =======================================

    /**
     * Obtener reporte de inventario actual
     * @param {Object} params - Parámetros de filtro
     * @param {number} params.bodega_id - ID de bodega específica
     * @param {number} params.categoria_id - ID de categoría
     * @param {boolean} params.solo_con_stock - Solo items con stock
     */
    async getInventarioActual(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Agregar parámetros si existen
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/reportes/inventario-actual${queryParams.toString() ? '?' + queryParams : ''}`;
            const response = await axios.get(url, getAuthHeaders());
            return response.data;
            
        } catch (error) {
            console.error('Error obteniendo reporte de inventario actual:', error);
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Obtener reporte de inventario por bodega
     * @param {number} bodegaId - ID de bodega (opcional)
     */
    async getInventarioPorBodega(bodegaId = null) {
        try {
            const params = bodegaId ? `?bodega_id=${bodegaId}` : '';
            const url = `${API_BASE_URL}/reportes/inventario-por-bodega${params}`;
            const response = await axios.get(url, getAuthHeaders());
            return response.data;
            
        } catch (error) {
            console.error('Error obteniendo reporte de inventario por bodega:', error);
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Obtener reporte de items con stock bajo
     * @param {number} bodegaId - ID de bodega (opcional)
     */
    async getStockBajo(bodegaId = null) {
        try {
            const params = bodegaId ? `?bodega_id=${bodegaId}` : '';
            const url = `${API_BASE_URL}/reportes/stock-bajo${params}`;
            const response = await axios.get(url, getAuthHeaders());
            return response.data;
            
        } catch (error) {
            console.error('Error obteniendo reporte de stock bajo:', error);
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Obtener reporte de valorización de inventario
     * @param {number} bodegaId - ID de bodega (opcional)
     */
    async getValorizacion(bodegaId = null) {
        try {
            const params = bodegaId ? `?bodega_id=${bodegaId}` : '';
            const url = `${API_BASE_URL}/reportes/valorizacion${params}`;
            const response = await axios.get(url, getAuthHeaders());
            return response.data;
            
        } catch (error) {
            console.error('Error obteniendo reporte de valorización:', error);
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Obtener información de la empresa para encabezados
     */
    async getInfoEmpresa() {
        try {
            const response = await axios.get(`${API_BASE_URL}/reportes/info-empresa`, getAuthHeaders());
            return response.data;
            
        } catch (error) {
            console.error('Error obteniendo información de empresa:', error);
            throw error.response ? error.response.data : error;
        }
    },

    // =======================================
    // EXPORTACIÓN DE REPORTES
    // =======================================

    /**
     * Exportar reporte a Excel
     * @param {Array} data - Datos del reporte
     * @param {string} filename - Nombre del archivo
     * @param {Object} infoEmpresa - Información de la empresa (opcional)
     */
    async exportarExcel(data, filename = 'reporte_inventario', infoEmpresa = null) {
        try {
            // Obtener información de empresa si no se proporcionó
            if (!infoEmpresa) {
                const response = await this.getInfoEmpresa();
                infoEmpresa = response.data || response; // response.data contiene { success, data }
            }

            // Crear workbook
            const wb = XLSX.utils.book_new();

            // Preparar datos para el sheet
            const worksheetData = [];

            // Agregar encabezado de empresa
            if (infoEmpresa) {
                worksheetData.push([infoEmpresa.nombre || 'KardexPlus']);
                worksheetData.push([infoEmpresa.direccion || '']);
                worksheetData.push([`Tel: ${infoEmpresa.telefono || ''} | Email: ${infoEmpresa.email || ''}`]);
                worksheetData.push([`NIT: ${infoEmpresa.nit || ''}`]);
                worksheetData.push([]); // Línea en blanco
                worksheetData.push([`Reporte generado: ${new Date().toLocaleString('es-ES')}`]);
                worksheetData.push([]); // Línea en blanco
            }

            // Convertir datos a formato de hoja
            if (data && data.length > 0) {
                // Agregar headers
                const headers = Object.keys(data[0]);
                worksheetData.push(headers);

                // Agregar datos
                data.forEach(row => {
                    worksheetData.push(Object.values(row));
                });
            }

            // Crear worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Ajustar ancho de columnas
            const colWidths = [];
            if (data && data.length > 0) {
                Object.keys(data[0]).forEach((key, index) => {
                    const maxLength = Math.max(
                        key.length,
                        ...data.map(row => String(row[key] || '').length)
                    );
                    colWidths.push({ wch: Math.min(maxLength + 2, 50) });
                });
                ws['!cols'] = colWidths;
            }

            // Agregar worksheet al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

            // Generar archivo
            const fecha = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `${filename}_${fecha}.xlsx`);

            return { success: true, message: 'Reporte exportado exitosamente' };
            
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            throw new Error('Error al exportar el reporte a Excel');
        }
    },

    /**
     * Exportar reporte a PDF
     * @param {Array} data - Datos del reporte
     * @param {string} filename - Nombre del archivo
     * @param {Object} infoEmpresa - Información de la empresa (opcional)
     * @param {Object} config - Configuración adicional
     */
    async exportarPDF(data, filename = 'reporte_inventario', infoEmpresa = null, config = {}) {
        try {
            console.log('📄 Iniciando exportación a PDF...');
            console.log('🔍 Verificando autoTable:', typeof autoTable);
            
            // Obtener información de empresa si no se proporcionó
            if (!infoEmpresa) {
                const response = await this.getInfoEmpresa();
                infoEmpresa = response.data || response; // response.data contiene { success, data }
            }

            // Crear documento PDF
            const doc = new jsPDF({
                orientation: config.orientation || 'landscape',
                unit: 'mm',
                format: 'letter'
            });
            
            console.log('✅ Documento PDF creado');

            // Agregar logo de DevSolutions dibujado directamente
            let yPosition = 15;
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // Posición del logo (esquina superior derecha)
            const logoX = pageWidth - 60;
            const logoY = 8;
            
            // Dibujar cuadrado del ícono (fondo azul oscuro)
            doc.setFillColor(10, 25, 41); // #0a1929
            doc.roundedRect(logoX, logoY, 15, 15, 2, 2, 'F');
            
            // Dibujar el texto "</>" en blanco dentro del cuadrado
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('courier', 'bold');
            doc.text('</>', logoX + 2.5, logoY + 10);
            
            // Dibujar texto "DevSolutions"
            doc.setTextColor(10, 25, 41);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DevSolutions', logoX + 17, logoY + 10);
            
            // Resetear colores para el resto del documento
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            // Agregar encabezado de empresa
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(infoEmpresa?.nombre || 'KardexPlus', 14, yPosition);
            
            yPosition += 6;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(infoEmpresa?.direccion || '', 14, yPosition);
            
            yPosition += 5;
            doc.text(`Tel: ${infoEmpresa?.telefono || ''} | Email: ${infoEmpresa?.email || ''}`, 14, yPosition);
            
            yPosition += 5;
            doc.text(`NIT: ${infoEmpresa?.nit || ''}`, 14, yPosition);

            yPosition += 8;
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Reporte generado: ${new Date().toLocaleString('es-ES')}`, 14, yPosition);

            yPosition += 8;

            // Preparar datos para la tabla
            if (data && data.length > 0) {
                const headers = Object.keys(data[0]);
                const rows = data.map(row => Object.values(row));

                // Configurar y agregar tabla usando autoTable como función
                autoTable(doc, {
                    startY: yPosition,
                    head: [headers],
                    body: rows,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        fontSize: 8
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245]
                    },
                    margin: { top: 10, left: 14, right: 14 },
                    styles: {
                        overflow: 'linebreak',
                        cellPadding: 2
                    }
                });
            }

            // Agregar número de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Página ${i} de ${pageCount}`,
                    doc.internal.pageSize.getWidth() - 30,
                    doc.internal.pageSize.getHeight() - 10
                );
            }

            // Guardar PDF
            const fecha = new Date().toISOString().split('T')[0];
            doc.save(`${filename}_${fecha}.pdf`);

            return { success: true, message: 'Reporte exportado exitosamente' };
            
        } catch (error) {
            console.error('Error exportando a PDF:', error);
            throw new Error('Error al exportar el reporte a PDF');
        }
    },

    // =======================================
    // UTILIDADES
    // =======================================

    /**
     * Formatear datos del reporte para exportación
     * @param {Array} items - Items del reporte
     * @param {string} tipo - Tipo de reporte
     */
    formatearDatosParaExportar(items, tipo = 'inventario_actual') {
        if (!items || items.length === 0) return [];

        switch (tipo) {
            case 'inventario_actual':
                return items.map(item => ({
                    'SKU': item.SKU || '',
                    'Nombre': item.Nombre || item.Item_Nombre || '',
                    'Categoría': item.Categoria || item.CategoriaItem_Nombre || '',
                    'Bodega': item.Bodega || item.Bodega_Nombre || '',
                    'Presentación': item.Presentacion || item.Presentacion_Nombre || '',
                    'Cantidad': item.Cantidad || 0,
                    'Unidad': item.Unidad_Medida || item.UnidadMedida_Nombre || '',
                    'Costo Unit.': this.formatMoneda(item.Costo_Unitario),
                    'Precio Venta': this.formatMoneda(item.Precio_Venta),
                    'Valor Total Costo': this.formatMoneda(item.Valor_Total_Costo),
                    'Valor Total Venta': this.formatMoneda(item.Valor_Total_Venta),
                    'Estado Stock': item.Estado_Stock || ''
                }));

            case 'stock_bajo':
                return items.map(item => ({
                    'SKU': item.SKU || '',
                    'Nombre': item.Nombre || '',
                    'Bodega': item.Bodega || '',
                    'Cantidad Actual': item.Cantidad_Actual || 0,
                    'Stock Mínimo': item.Stock_Minimo || 0,
                    'Diferencia': item.Diferencia || 0,
                    'Costo Unit.': this.formatMoneda(item.Costo_Unitario),
                    'Costo Reposición': this.formatMoneda(item.Costo_Reposicion_Sugerida)
                }));

            case 'valorizacion':
                return items.map(item => ({
                    'Categoría': item.Categoria || '',
                    'Total Items': item.Total_Items || 0,
                    'Total Cantidad': item.Total_Cantidad || 0,
                    'Valor Costo': this.formatMoneda(item.Valor_Costo),
                    'Valor Venta': this.formatMoneda(item.Valor_Venta),
                    'Margen Potencial': this.formatMoneda(item.Margen_Potencial),
                    '% Margen': `${(item.Porcentaje_Margen || 0).toFixed(2)}%`
                }));

            default:
                return items;
        }
    },

    /**
     * Formatear valor monetario para exportación
     * @param {number} valor - Valor a formatear
     */
    formatMoneda(valor) {
        if (valor === null || valor === undefined) return '0.00';
        return parseFloat(valor).toFixed(2);
    },

    /**
     * Formatear fecha para exportación
     * @param {string} fecha - Fecha a formatear
     */
    formatFecha(fecha) {
        if (!fecha) return '';
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

export default reporteService;
