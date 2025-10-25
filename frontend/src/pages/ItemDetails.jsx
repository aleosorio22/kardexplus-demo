import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiBox, FiArrowLeft, FiEdit, FiTag, FiBarChart, FiDollarSign, FiPackage, FiPlus, FiLayers, FiTrash2, FiImage, FiPercent, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { ItemFormModal, DescuentoFormModal } from '../components/Modals';
import itemService from '../services/itemService';
import categoryService from '../services/categoryService';
import itemPresentacionService from '../services/itemPresentacionService';
import descuentoService from '../services/descuentoService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [itemPresentaciones, setItemPresentaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPresentacionesLoading, setIsPresentacionesLoading] = useState(false);

  // Estados para el modal de edición de item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Item_Codigo_SKU: '',
    Item_Codigo_Barra: '',
    Item_Nombre: '',
    Item_Descripcion: '',
    Item_Tipo: 'B',
    Item_Costo_Unitario: '',
    Item_Precio_Sugerido: '',
    Item_Imagen_URL: '',
    Item_Estado: true,
    CategoriaItem_Id: '',
    UnidadMedidaBase_Id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para el modal de presentaciones
  const [isPresentacionModalOpen, setIsPresentacionModalOpen] = useState(false);
  const [presentacionFormData, setPresentacionFormData] = useState({
    Presentacion_Nombre: '',
    Cantidad_Base: '',
    Codigo_SKU: '',
    Codigo_Barras: '',
    Costo: '',
    Precio_Sugerido: ''
  });
  const [editingPresentacion, setEditingPresentacion] = useState(null);
  const [isPresentacionSubmitting, setIsPresentacionSubmitting] = useState(false);

  // Estados para descuentos
  const [descuentos, setDescuentos] = useState([]);
  const [isDescuentosLoading, setIsDescuentosLoading] = useState(false);
  const [isDescuentoModalOpen, setIsDescuentoModalOpen] = useState(false);
  const [descuentoFormData, setDescuentoFormData] = useState({
    Item_Id: null,
    Item_Presentaciones_Id: null,
    Descuento_Tipo: 'P',
    Descuento_Valor: '',
    Cantidad_Minima: 1,
    Descuento_Fecha_Inicio: '',
    Descuento_Fecha_Fin: '',
    Descuento_Prioridad: 1,
    Es_Combinable: false,
    Descuento_Estado: true,
    Descuento_Descripcion: ''
  });
  const [editingDescuento, setEditingDescuento] = useState(null);
  const [descuentoItemInfo, setDescuentoItemInfo] = useState(null);
  const [isDescuentoSubmitting, setIsDescuentoSubmitting] = useState(false);

  // Cargar datos del item
  const loadItem = async () => {
    try {
      setIsLoading(true);
      const response = await itemService.getItemById(id);
      const itemData = response.data || response.item || response;
      setItem(itemData);
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Error al cargar los detalles del item');
      navigate('/inventario/items');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      const categoriesData = response.data || response.categories || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  // Cargar presentaciones disponibles - Ya no necesario
  const loadPresentaciones = async () => {
    // Ya no necesitamos cargar presentaciones reutilizables
    // porque ahora cada item tiene sus propias presentaciones
    setPresentaciones([]);
  };

  // Cargar presentaciones del item
  const loadItemPresentaciones = async () => {
    try {
      setIsPresentacionesLoading(true);
      const response = await itemPresentacionService.getItemPresentacionesByItemId(id);
      const itemPresentacionesData = response.data || response.itemPresentaciones || response || [];
      setItemPresentaciones(Array.isArray(itemPresentacionesData) ? itemPresentacionesData : []);
    } catch (error) {
      console.error('Error loading item presentaciones:', error);
      setItemPresentaciones([]);
    } finally {
      setIsPresentacionesLoading(false);
    }
  };

  // Navegar de vuelta a la lista
  const handleGoBack = () => {
    navigate('/inventario/items');
  };

  // Abrir modal para editar item
  const handleEditItem = () => {
    setFormData({
      Item_Codigo_SKU: item.Item_Codigo_SKU || '',
      Item_Codigo_Barra: item.Item_Codigo_Barra || '',
      Item_Nombre: item.Item_Nombre || '',
      Item_Descripcion: item.Item_Descripcion || '',
      Item_Tipo: item.Item_Tipo || 'B',
      Item_Costo_Unitario: item.Item_Costo_Unitario || '',
      Item_Precio_Sugerido: item.Item_Precio_Sugerido || '',
      Item_Imagen_URL: item.Item_Imagen_URL || '',
      Item_Estado: item.Item_Estado !== undefined ? item.Item_Estado : true,
      CategoriaItem_Id: item.CategoriaItem_Id || '',
      UnidadMedidaBase_Id: item.UnidadMedidaBase_Id || ''
    });
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      Item_Codigo_SKU: '',
      Item_Codigo_Barra: '',
      Item_Nombre: '',
      Item_Descripcion: '',
      Item_Tipo: 'B',
      Item_Costo_Unitario: '',
      Item_Precio_Sugerido: '',
      Item_Imagen_URL: '',
      Item_Estado: true,
      CategoriaItem_Id: '',
      UnidadMedidaBase_Id: ''
    });
  };

  // Manejar envío del formulario
  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      await itemService.updateItem(item.Item_Id, {
        Item_Codigo_SKU: data.Item_Codigo_SKU || null,
        Item_Codigo_Barra: data.Item_Codigo_Barra || null,
        Item_Nombre: data.Item_Nombre,
        Item_Descripcion: data.Item_Descripcion || null,
        Item_Tipo: data.Item_Tipo || 'B',
        Item_Costo_Unitario: parseFloat(data.Item_Costo_Unitario),
        Item_Precio_Sugerido: data.Item_Precio_Sugerido ? parseFloat(data.Item_Precio_Sugerido) : null,
        Item_Imagen_URL: data.Item_Imagen_URL || null,
        Item_Estado: Boolean(data.Item_Estado),
        CategoriaItem_Id: parseInt(data.CategoriaItem_Id),
        UnidadMedidaBase_Id: parseInt(data.UnidadMedidaBase_Id)
      });
      
      toast.success('Item actualizado exitosamente');
      handleCloseModal();
      loadItem(); // Recargar los datos del item
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Error al guardar el item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== FUNCIONES PARA PRESENTACIONES =====

  // Abrir modal para agregar presentación
  const handleAddPresentacion = () => {
    setPresentacionFormData({
      Presentacion_Nombre: '',
      Cantidad_Base: '',
      Codigo_SKU: '',
      Codigo_Barras: '',
      Costo: '',
      Precio_Sugerido: ''
    });
    setEditingPresentacion(null);
    setIsPresentacionModalOpen(true);
  };

  // Abrir modal para editar presentación
  const handleEditPresentacion = (presentacion) => {
    setPresentacionFormData({
      Presentacion_Nombre: presentacion.Presentacion_Nombre || '',
      Cantidad_Base: presentacion.Cantidad_Base || '',
      Codigo_SKU: presentacion.Item_Presentacion_CodigoSKU || '',
      Codigo_Barras: presentacion.Item_Presentaciones_CodigoBarras || '',
      Costo: presentacion.Item_Presentaciones_Costo || '',
      Precio_Sugerido: presentacion.Item_Presentaciones_Precio_Sugerido || ''
    });
    setEditingPresentacion(presentacion);
    setIsPresentacionModalOpen(true);
  };

  // Cerrar modal de presentaciones
  const handleClosePresentacionModal = () => {
    setIsPresentacionModalOpen(false);
    setPresentacionFormData({
      Presentacion_Nombre: '',
      Cantidad_Base: '',
      Codigo_SKU: '',
      Codigo_Barras: '',
      Costo: '',
      Precio_Sugerido: ''
    });
    setEditingPresentacion(null);
  };

  // Manejar envío del formulario de presentaciones
  const handlePresentacionFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsPresentacionSubmitting(true);
      
      const data = {
        Item_Id: parseInt(id),
        Presentacion_Nombre: presentacionFormData.Presentacion_Nombre.trim(),
        Cantidad_Base: parseFloat(presentacionFormData.Cantidad_Base),
        Item_Presentacion_CodigoSKU: presentacionFormData.Codigo_SKU.trim() || null,
        Item_Presentaciones_CodigoBarras: presentacionFormData.Codigo_Barras.trim() || null,
        Item_Presentaciones_Costo: presentacionFormData.Costo ? parseFloat(presentacionFormData.Costo) : null,
        Item_Presentaciones_Precio_Sugerido: presentacionFormData.Precio_Sugerido ? parseFloat(presentacionFormData.Precio_Sugerido) : null
      };

      if (editingPresentacion) {
        await itemPresentacionService.updateItemPresentacion(editingPresentacion.Item_Presentaciones_Id, data);
        toast.success('Presentación actualizada exitosamente');
      } else {
        await itemPresentacionService.createItemPresentacion(data);
        toast.success('Presentación agregada exitosamente');
      }
      
      handleClosePresentacionModal();
      loadItemPresentaciones();
    } catch (error) {
      console.error('Error saving presentacion:', error);
      toast.error(error.message || 'Error al guardar la presentación');
    } finally {
      setIsPresentacionSubmitting(false);
    }
  };

  // Eliminar presentación
  const handleDeletePresentacion = async (presentacionId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta presentación?')) {
      try {
        await itemPresentacionService.deleteItemPresentacion(presentacionId);
        toast.success('Presentación eliminada exitosamente');
        loadItemPresentaciones();
      } catch (error) {
        console.error('Error deleting presentacion:', error);
        toast.error('Error al eliminar la presentación');
      }
    }
  };

  // ===== FUNCIONES PARA DESCUENTOS =====

  // Cargar descuentos del item y sus presentaciones
  const loadDescuentos = async () => {
    try {
      setIsDescuentosLoading(true);
      const response = await descuentoService.getAllDescuentos({ item_id: id });
      const descuentosData = response.data || response.descuentos || response || [];
      setDescuentos(Array.isArray(descuentosData) ? descuentosData : []);
    } catch (error) {
      console.error('Error loading descuentos:', error);
      setDescuentos([]);
    } finally {
      setIsDescuentosLoading(false);
    }
  };

  // Abrir modal para agregar descuento al item base
  const handleAddDescuentoItem = () => {
    setEditingDescuento(null);
    setDescuentoItemInfo({
      Item_Id: parseInt(id),
      Item_Nombre: item?.Item_Nombre || 'Item'
    });
    setDescuentoFormData({
      Item_Id: parseInt(id),
      Item_Presentaciones_Id: null,
      Descuento_Tipo: 'P',
      Descuento_Valor: '',
      Cantidad_Minima: 1,
      Descuento_Fecha_Inicio: new Date().toISOString().slice(0, 16),
      Descuento_Fecha_Fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 16),
      Descuento_Prioridad: 1,
      Es_Combinable: false,
      Descuento_Estado: true,
      Descuento_Descripcion: ''
    });
    setIsDescuentoModalOpen(true);
  };

  // Abrir modal para agregar descuento a una presentación
  const handleAddDescuentoPresentacion = (presentacion) => {
    setEditingDescuento(null);
    setDescuentoItemInfo({
      Item_Presentaciones_Id: presentacion.Item_Presentaciones_Id,
      Item_Nombre: item?.Item_Nombre || 'Item',
      Presentacion_Nombre: presentacion.Presentacion_Nombre
    });
    setDescuentoFormData({
      Item_Id: null,
      Item_Presentaciones_Id: presentacion.Item_Presentaciones_Id,
      Descuento_Tipo: 'P',
      Descuento_Valor: '',
      Cantidad_Minima: 1,
      Descuento_Fecha_Inicio: new Date().toISOString().slice(0, 16),
      Descuento_Fecha_Fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 16),
      Descuento_Prioridad: 1,
      Es_Combinable: false,
      Descuento_Estado: true,
      Descuento_Descripcion: ''
    });
    setIsDescuentoModalOpen(true);
  };

  // Abrir modal para editar descuento
  const handleEditDescuento = (descuento) => {
    setEditingDescuento(descuento);
    setDescuentoItemInfo({
      Item_Id: descuento.Item_Id,
      Item_Presentaciones_Id: descuento.Item_Presentaciones_Id,
      Item_Nombre: descuento.Item_Nombre || item?.Item_Nombre,
      Presentacion_Nombre: descuento.Presentacion_Nombre
    });
    setIsDescuentoModalOpen(true);
  };

  // Cerrar modal de descuentos
  const handleCloseDescuentoModal = () => {
    setIsDescuentoModalOpen(false);
    setEditingDescuento(null);
    setDescuentoItemInfo(null);
    setDescuentoFormData({
      Item_Id: null,
      Item_Presentaciones_Id: null,
      Descuento_Tipo: 'P',
      Descuento_Valor: '',
      Cantidad_Minima: 1,
      Descuento_Fecha_Inicio: '',
      Descuento_Fecha_Fin: '',
      Descuento_Prioridad: 1,
      Es_Combinable: false,
      Descuento_Estado: true,
      Descuento_Descripcion: ''
    });
  };

  // Manejar envío del formulario de descuentos
  const handleDescuentoFormSubmit = async (data) => {
    try {
      setIsDescuentoSubmitting(true);
      
      if (editingDescuento) {
        await descuentoService.updateDescuento(editingDescuento.Descuento_Id, data);
        toast.success('Descuento actualizado exitosamente');
      } else {
        await descuentoService.createDescuento(data);
        toast.success('Descuento creado exitosamente');
      }
      
      handleCloseDescuentoModal();
      loadDescuentos();
    } catch (error) {
      console.error('Error saving descuento:', error);
      toast.error(error.message || 'Error al guardar el descuento');
    } finally {
      setIsDescuentoSubmitting(false);
    }
  };

  // Toggle estado del descuento
  const handleToggleDescuentoStatus = async (descuentoId) => {
    try {
      await descuentoService.toggleEstadoDescuento(descuentoId);
      toast.success('Estado del descuento actualizado');
      loadDescuentos();
    } catch (error) {
      console.error('Error toggling descuento status:', error);
      toast.error('Error al cambiar el estado del descuento');
    }
  };

  // Eliminar descuento
  const handleDeleteDescuento = async (descuentoId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este descuento?')) {
      try {
        await descuentoService.deleteDescuento(descuentoId);
        toast.success('Descuento eliminado exitosamente');
        loadDescuentos();
      } catch (error) {
        console.error('Error deleting descuento:', error);
        toast.error('Error al eliminar el descuento');
      }
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (id) {
      loadItem();
      loadCategories();
      loadItemPresentaciones();
      loadDescuentos();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <FiBox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Item no encontrado</p>
        <button
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver a Items
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              title="Volver a Items"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="bg-primary/10 rounded-full p-3">
              <FiBox className="w-6 h-6 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground">Detalles del Item</h1>
              <p className="text-muted-foreground">{item.Item_Nombre}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              item.Item_Estado 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {item.Item_Estado ? 'Activo' : 'Inactivo'}
            </span>
            
            <button
              onClick={handleEditItem}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              title="Editar item"
            >
              <FiEdit size={16} />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <FiPackage className="w-5 h-5" />
              <span>Información Básica</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre</label>
                <p className="text-foreground font-medium">{item.Item_Nombre}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Categoría</label>
                <div className="flex items-center space-x-2">
                  <FiTag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{item.CategoriaItem_Nombre || 'Sin categoría'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo</label>
                <p className="text-foreground">
                  {item.Item_Tipo === 'B' ? '📦 Bien (Producto físico)' : '🔧 Servicio'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Unidad de Medida</label>
                <p className="text-foreground">{item.UnidadMedida_Nombre || 'N/A'}</p>
              </div>
              
              {item.Item_Codigo_SKU && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Código SKU</label>
                  <p className="text-foreground font-mono">{item.Item_Codigo_SKU}</p>
                </div>
              )}
              
              {item.Item_Codigo_Barra && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Código de Barras</label>
                  <p className="text-foreground font-mono">{item.Item_Codigo_Barra}</p>
                </div>
              )}

              {item.Item_Descripcion && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Descripción</label>
                  <p className="text-foreground whitespace-pre-wrap">{item.Item_Descripcion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Presentaciones del Item */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <FiLayers className="w-5 h-5" />
                <span>Presentaciones</span>
              </h2>
              
              <button
                onClick={handleAddPresentacion}
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FiPlus size={16} />
                <span>Agregar Presentación</span>
              </button>
            </div>

            {isPresentacionesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : itemPresentaciones.length > 0 ? (
              <div className="space-y-4">
                {itemPresentaciones.map((presentacion, index) => (
                  <div 
                    key={`presentacion-${presentacion.Item_Presentaciones_Id || index}`} 
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Presentación
                            </label>
                            <p className="text-sm font-medium text-foreground">
                              {presentacion.Presentacion_Nombre || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {presentacion.UnidadMedida_Nombre || 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              SKU
                            </label>
                            <p className="text-sm font-mono text-foreground">
                              {presentacion.Item_Presentacion_CodigoSKU || 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Cantidad Base
                            </label>
                            <p className="text-sm text-foreground">
                              {formatNumber(presentacion.Cantidad_Base, 4, 0)}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Costo
                            </label>
                            <p className="text-sm font-semibold text-primary">
                              {presentacion.Item_Presentaciones_Costo ? 
                                `Q${formatCurrency(presentacion.Item_Presentaciones_Costo)}` : 
                                'N/A'
                              }
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Precio Sugerido
                            </label>
                            <p className="text-sm font-semibold text-green-600">
                              {presentacion.Item_Presentaciones_Precio_Sugerido ? 
                                `Q${formatCurrency(presentacion.Item_Presentaciones_Precio_Sugerido)}` : 
                                'N/A'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {presentacion.Item_Presentaciones_CodigoBarras && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Código de Barras
                            </label>
                            <p className="text-sm font-mono text-foreground">
                              {presentacion.Item_Presentaciones_CodigoBarras}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleAddDescuentoPresentacion(presentacion)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Agregar descuento a esta presentación"
                        >
                          <FiPercent className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEditPresentacion(presentacion)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          title="Editar presentación"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeletePresentacion(presentacion.Item_Presentaciones_Id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar presentación"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiLayers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No hay presentaciones configuradas para este item</p>
                <button
                  onClick={handleAddPresentacion}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Agregar Primera Presentación
                </button>
              </div>
            )}
          </div>

          {/* Descuentos Activos */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <FiPercent className="w-5 h-5" />
                <span>Descuentos</span>
              </h2>
              
              <button
                onClick={handleAddDescuentoItem}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiPlus size={16} />
                <span>Nuevo Descuento</span>
              </button>
            </div>

            {isDescuentosLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : descuentos.length > 0 ? (
              <div className="space-y-3">
                {descuentos.map((descuento) => {
                  const esVigente = new Date() >= new Date(descuento.Descuento_Fecha_Inicio) &&
                    (!descuento.Descuento_Fecha_Fin || new Date() <= new Date(descuento.Descuento_Fecha_Fin));
                  const esPorcentaje = descuento.Descuento_Tipo === 'P';
                  
                  return (
                    <div
                      key={descuento.Descuento_Id}
                      className={`border rounded-lg p-4 ${
                        descuento.Descuento_Estado && esVigente
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-xl font-bold ${
                              descuento.Descuento_Estado && esVigente ? 'text-green-700' : 'text-gray-500'
                            }`}>
                              {esPorcentaje ? `${descuento.Descuento_Valor}%` : `Q${formatCurrency(descuento.Descuento_Valor)}`}
                            </span>
                            <span className="text-sm text-gray-600">
                              {esPorcentaje ? 'de descuento' : 'descuento'}
                            </span>
                            {descuento.Es_Combinable && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Combinable
                              </span>
                            )}
                          </div>
                          
                          {descuento.Descuento_Descripcion && (
                            <p className="text-sm text-gray-700 mb-2">
                              {descuento.Descuento_Descripcion}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            {descuento.Item_Presentaciones_Id && (
                              <span className="flex items-center space-x-1">
                                <FiPackage className="w-3 h-3" />
                                <span>{descuento.Presentacion_Nombre}</span>
                              </span>
                            )}
                            <span>Desde {descuento.Cantidad_Minima} unidad(es)</span>
                            <span>Prioridad: {descuento.Descuento_Prioridad}</span>
                          </div>
                          
                          <div className="flex gap-2 text-xs text-gray-500 mt-2">
                            <span>Inicio: {new Date(descuento.Descuento_Fecha_Inicio).toLocaleDateString()}</span>
                            {descuento.Descuento_Fecha_Fin && (
                              <span>• Fin: {new Date(descuento.Descuento_Fecha_Fin).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleDescuentoStatus(descuento.Descuento_Id)}
                            className={`p-2 rounded-lg transition-colors ${
                              descuento.Descuento_Estado
                                ? 'text-green-600 hover:bg-green-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={descuento.Descuento_Estado ? 'Desactivar' : 'Activar'}
                          >
                            {descuento.Descuento_Estado ? (
                              <FiToggleRight className="w-5 h-5" />
                            ) : (
                              <FiToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleEditDescuento(descuento)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar descuento"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteDescuento(descuento.Descuento_Id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar descuento"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {!esVigente && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          ⏰ Este descuento no está vigente actualmente
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiPercent className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No hay descuentos configurados para este item</p>
                <button
                  onClick={handleAddDescuentoItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Crear Primer Descuento
                </button>
              </div>
            )}
          </div>

          {/* Aquí agregaremos más secciones en el futuro */}
          <div className="bg-muted/50 rounded-lg border p-6">
            <p className="text-muted-foreground text-center">
              <FiBarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Próximamente: Historial de movimientos, estadísticas y más información detallada
            </p>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Precios */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <FiDollarSign className="w-5 h-5" />
              <span>Precios</span>
            </h3>
            
            {/* Indicador de descuentos activos */}
            {descuentos.some(d => {
              const esVigente = new Date() >= new Date(d.Descuento_Fecha_Inicio) &&
                (!d.Descuento_Fecha_Fin || new Date() <= new Date(d.Descuento_Fecha_Fin));
              return d.Descuento_Estado && esVigente;
            }) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <FiPercent className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Tiene descuentos activos
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Costo Unitario</label>
                <p className="text-2xl font-bold text-primary">
                  Q{formatCurrency(item.Item_Costo_Unitario || 0)}
                </p>
              </div>

              {item.Item_Precio_Sugerido && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Precio Sugerido</label>
                  <p className="text-2xl font-bold text-green-600">
                    Q{formatCurrency(item.Item_Precio_Sugerido)}
                  </p>
                </div>
              )}
              
              {item.UnidadMedida_Nombre && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Unidad de Medida</label>
                  <p className="text-xl font-semibold text-blue-700">
                    {item.UnidadMedida_Nombre} ({item.UnidadMedida_Prefijo})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Imagen del Item */}
          {item.Item_Imagen_URL && (
            <div className="bg-card rounded-lg border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <FiImage className="w-5 h-5" />
                <span>Imagen del Item</span>
              </h3>
              
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                <img
                  src={item.Item_Imagen_URL}
                  alt={item.Item_Nombre}
                  className="w-full h-64 object-contain"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                    e.target.classList.add('opacity-50');
                  }}
                />
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <FiBarChart className="w-5 h-5" />
              <span>Gestión de Inventario</span>
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📋 Información importante:</strong><br/>
                El control de stock (mínimos, máximos, puntos de reorden) ahora se configura individualmente por bodega en la sección de <strong>Existencias</strong>.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Esto permite mayor flexibilidad para manejar diferentes niveles según cada ubicación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulario de item */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={true}
        selectedItem={item}
        isLoading={isSubmitting}
        categories={categories}
      />

      {/* Modal de formulario de presentaciones */}
      {isPresentacionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingPresentacion ? 'Editar Presentación' : 'Agregar Presentación'}
                </h2>
                <button
                  onClick={handleClosePresentacionModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePresentacionFormSubmit} className="space-y-4">
                {/* Nombre de Presentación */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre de Presentación *
                  </label>
                  <input
                    type="text"
                    value={presentacionFormData.Presentacion_Nombre}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Presentacion_Nombre: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: Caja x12, Paquete x6, Unidad"
                    maxLength={30}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 30 caracteres
                  </p>
                </div>

                {/* Cantidad Base */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cantidad Base *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={presentacionFormData.Cantidad_Base}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Cantidad_Base: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: 12.0000"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cantidad de unidades base que contiene esta presentación
                  </p>
                </div>

                {/* Código SKU */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    value={presentacionFormData.Codigo_SKU}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Codigo_SKU: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: ITEM001-CX12"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional - Máximo 20 caracteres
                  </p>
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={presentacionFormData.Codigo_Barras}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Codigo_Barras: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: 1234567890123"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional - Máximo 20 caracteres
                  </p>
                </div>

                {/* Costo */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Costo de la Presentación
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={presentacionFormData.Costo}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Costo: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: 150.2285"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional - Costo específico de esta presentación
                  </p>
                </div>

                {/* Precio Sugerido */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Precio Sugerido de la Presentación
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={presentacionFormData.Precio_Sugerido}
                    onChange={(e) => setPresentacionFormData({
                      ...presentacionFormData,
                      Precio_Sugerido: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Ej: 175.5000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Opcional - Precio sugerido de venta para esta presentación
                  </p>
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClosePresentacionModal}
                    className="flex-1 px-4 py-2 border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    disabled={isPresentacionSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isPresentacionSubmitting}
                  >
                    {isPresentacionSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Guardando...
                      </div>
                    ) : (
                      editingPresentacion ? 'Actualizar' : 'Agregar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario de descuentos */}
      <DescuentoFormModal
        isOpen={isDescuentoModalOpen}
        onClose={handleCloseDescuentoModal}
        onSubmit={handleDescuentoFormSubmit}
        formData={descuentoFormData}
        setFormData={setDescuentoFormData}
        isEditing={!!editingDescuento}
        selectedDescuento={editingDescuento}
        isLoading={isDescuentoSubmitting}
        itemInfo={descuentoItemInfo}
      />
    </div>
  );
};

export default ItemDetails;
