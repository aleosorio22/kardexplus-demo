// Test rápido para verificar que jspdf-autotable funciona
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function testPDFGeneration() {
    console.log('🧪 Testing jsPDF and autoTable...');
    
    try {
        const doc = new jsPDF();
        
        // Verificar que doc existe
        console.log('✅ jsPDF instance created:', doc);
        
        // Verificar que autoTable está disponible
        console.log('✅ autoTable method exists:', typeof doc.autoTable);
        
        if (typeof doc.autoTable !== 'function') {
            throw new Error('❌ autoTable is not a function! Plugin not loaded correctly.');
        }
        
        // Intentar crear una tabla simple
        doc.autoTable({
            head: [['Name', 'Age']],
            body: [
                ['John', '30'],
                ['Jane', '25']
            ]
        });
        
        console.log('✅ autoTable executed successfully!');
        
        // No guardamos el PDF, solo verificamos que funciona
        return { success: true, message: 'PDF test passed!' };
        
    } catch (error) {
        console.error('❌ PDF Test Failed:', error);
        return { success: false, error: error.message };
    }
}
