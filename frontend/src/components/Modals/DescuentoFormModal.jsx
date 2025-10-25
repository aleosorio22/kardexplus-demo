import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { FiX, FiPercent, FiDollarSign, FiCalendar, FiHash, FiInfo, FiCheckCircle } from 'react-icons/fi';

export default function DescuentoFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEditing = false,
  selectedDescuento = null,
  isLoading = false,
  itemInfo = null  // Info del item o presentación
}) {

  useEffect(() => {
    if (isEditing && selectedDescuento) {
      // Formatear fechas para input type="datetime-local"
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        Item_Id: selectedDescuento.Item_Id || null,
        Item_Presentaciones_Id: selectedDescuento.Item_Presentaciones_Id || null,
        Descuento_Tipo: selectedDescuento.Descuento_Tipo || 'P',
        Descuento_Valor: selectedDescuento.Descuento_Valor || '',
        Cantidad_Minima: selectedDescuento.Cantidad_Minima || 1,
        Descuento_Fecha_Inicio: formatDateForInput(selectedDescuento.Descuento_Fecha_Inicio),
        Descuento_Fecha_Fin: formatDateForInput(selectedDescuento.Descuento_Fecha_Fin),
        Descuento_Prioridad: selectedDescuento.Descuento_Prioridad || 1,
        Es_Combinable: selectedDescuento.Es_Combinable || false,
        Descuento_Estado: selectedDescuento.Descuento_Estado !== undefined ? selectedDescuento.Descuento_Estado : true,
        Descuento_Descripcion: selectedDescuento.Descuento_Descripcion || ''
      });
    } else if (!isEditing) {
      // Valores por defecto para nuevo descuento
      const now = new Date();
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      setFormData({
        Item_Id: itemInfo?.Item_Id || null,
        Item_Presentaciones_Id: itemInfo?.Item_Presentaciones_Id || null,
        Descuento_Tipo: 'P',
        Descuento_Valor: '',
        Cantidad_Minima: 1,
        Descuento_Fecha_Inicio: now.toISOString().slice(0, 16),
        Descuento_Fecha_Fin: oneMonthLater.toISOString().slice(0, 16),
        Descuento_Prioridad: 1,
        Es_Combinable: false,
        Descuento_Estado: true,
        Descuento_Descripcion: ''
      });
    }
  }, [isEditing, selectedDescuento, setFormData, isOpen, itemInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.Descuento_Valor || formData.Descuento_Valor <= 0) {
      alert('El valor del descuento debe ser mayor a 0');
      return;
    }

    if (formData.Descuento_Tipo === 'P' && formData.Descuento_Valor > 100) {
      alert('El porcentaje no puede ser mayor a 100%');
      return;
    }

    if (!formData.Descuento_Fecha_Inicio) {
      alert('La fecha de inicio es requerida');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {isEditing ? 'Editar Descuento' : 'Crear Nuevo Descuento'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Info del Item/Presentación */}
                {itemInfo && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Aplicando descuento a:</strong>{' '}
                      {itemInfo.Item_Nombre}
                      {itemInfo.Presentacion_Nombre && ` - ${itemInfo.Presentacion_Nombre}`}
                    </p>
                  </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Tipo y Valor del Descuento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiPercent className="w-4 h-4" />
                          <span>Tipo de Descuento *</span>
                        </div>
                      </label>
                      <select
                        value={formData.Descuento_Tipo}
                        onChange={(e) => handleInputChange('Descuento_Tipo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="P">Porcentaje (%)</option>
                        <option value="M">Monto Fijo ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiDollarSign className="w-4 h-4" />
                          <span>
                            Valor del Descuento * {formData.Descuento_Tipo === 'P' ? '(%)' : '($)'}
                          </span>
                        </div>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.Descuento_Tipo === 'P' ? '100' : undefined}
                        value={formData.Descuento_Valor}
                        onChange={(e) => handleInputChange('Descuento_Valor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={formData.Descuento_Tipo === 'P' ? '0-100' : '0.00'}
                        required
                      />
                    </div>
                  </div>

                  {/* Cantidad Mínima y Prioridad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiHash className="w-4 h-4" />
                          <span>Cantidad Mínima *</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.Cantidad_Minima}
                        onChange={(e) => handleInputChange('Cantidad_Minima', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad mínima para aplicar el descuento
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiHash className="w-4 h-4" />
                          <span>Prioridad</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.Descuento_Prioridad}
                        onChange={(e) => handleInputChange('Descuento_Prioridad', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mayor número = mayor prioridad
                      </p>
                    </div>
                  </div>

                  {/* Vigencia */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="w-4 h-4" />
                          <span>Fecha de Inicio *</span>
                        </div>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.Descuento_Fecha_Inicio}
                        onChange={(e) => handleInputChange('Descuento_Fecha_Inicio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="w-4 h-4" />
                          <span>Fecha de Fin</span>
                        </div>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.Descuento_Fecha_Fin || ''}
                        onChange={(e) => handleInputChange('Descuento_Fecha_Fin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dejar vacío para sin límite
                      </p>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <FiInfo className="w-4 h-4" />
                        <span>Descripción</span>
                      </div>
                    </label>
                    <textarea
                      value={formData.Descuento_Descripcion}
                      onChange={(e) => handleInputChange('Descuento_Descripcion', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ej: Promoción de temporada, descuento por mayoreo, etc."
                    />
                  </div>

                  {/* Opciones adicionales */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="es_combinable"
                        checked={formData.Es_Combinable}
                        onChange={(e) => handleInputChange('Es_Combinable', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="es_combinable" className="ml-2 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Descuento combinable con otros</span>
                        </div>
                      </label>
                    </div>

                    {isEditing && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="estado"
                          checked={formData.Descuento_Estado}
                          onChange={(e) => handleInputChange('Descuento_Estado', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="estado" className="ml-2 text-sm text-gray-700">
                          Descuento activo
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Vista previa del descuento */}
                  {formData.Descuento_Valor && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Vista previa del descuento:
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {formData.Descuento_Tipo === 'P' 
                          ? `${formData.Descuento_Valor}% de descuento`
                          : `$${formData.Descuento_Valor} de descuento`
                        }
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Aplica desde {formData.Cantidad_Minima} unidad(es)
                        {formData.Descuento_Fecha_Fin && ` hasta ${new Date(formData.Descuento_Fecha_Fin).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Descuento' : 'Crear Descuento'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
