import React, { useState } from 'react';
import { Installation } from '../types';
import { Building2, Plus, Search, MapPin, Edit, Trash2, CheckCircle2, XCircle, CheckSquare, Square, LocateFixed, Map as MapIcon, Globe, Info, QrCode, Nfc } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isValidUUID } from '../services/utils';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../constants';

interface InstallationsManagerProps {
  installations: Installation[];
  setInstallations: React.Dispatch<React.SetStateAction<Installation[]>>;
  googleMapsKey: string;
  theme: 'dark' | 'light';
}

const InstallationsManager: React.FC<InstallationsManagerProps> = ({ installations, setInstallations, googleMapsKey, theme }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Installation>>({
    lat: -33.4489, // Default Santiago
    lng: -70.6693
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-v2',
    googleMapsApiKey: googleMapsKey || 'dummy-key',
    libraries: GOOGLE_MAPS_LIBRARIES
  });
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredInstallations = installations.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInstallations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInstallations.map(inst => inst.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(`¿Estás seguro que deseas eliminar ${selectedIds.length} instalaciones?`)) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('installations')
          .delete()
          .in('id', selectedIds);

        if (error) {
          alert('Error al eliminar instalaciones: ' + error.message);
        } else {
          setInstallations(prev => prev.filter(inst => !selectedIds.includes(inst.id)));
          setSelectedIds([]);
        }
      } catch (err) {
        console.error('Error in bulk delete:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro que deseas eliminar esta instalación?')) {
      if (isValidUUID(id)) {
        const { error } = await supabase.from('installations').delete().eq('id', id);
        if (error) {
          alert('Error al eliminar: ' + error.message);
          return;
        }
      }
      setInstallations(prev => prev.filter(inst => inst.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleEdit = (inst: Installation, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(inst);
    setIsModalOpen(true);
  };

  const toggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from('installations')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedInst = {
        ...data,
        isActive: data.is_active,
        markingsCount: installations.find(i => i.id === id)?.markingsCount || 0
      };

      setInstallations(prev => prev.map(inst => inst.id === id ? updatedInst : inst));
    } catch (err: any) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbData = {
        name: formData.name,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        checkpoint_type: formData.checkpointType || 'QR',
        is_active: formData.isActive !== undefined ? formData.isActive : true
      };

      if (formData.id && isValidUUID(formData.id)) {
        const { data, error } = await supabase
          .from('installations')
          .update(dbData)
          .eq('id', formData.id)
          .select()
          .single();
        if (error) throw error;
        
        const updated = {
          ...data,
          isActive: data.is_active,
          markingsCount: installations.find(i => i.id === formData.id)?.markingsCount || 0
        };
        setInstallations(prev => prev.map(inst => inst.id === formData.id ? updated : inst));
      } else {
        const { data, error } = await supabase
          .from('installations')
          .insert([dbData])
          .select()
          .single();
        if (error) throw error;
        
        const newData = {
          ...data,
          isActive: data.is_active,
          markingsCount: 0
        };
        setInstallations(prev => [...prev, newData]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setFormData(prev => ({ ...prev, lat, lng }));
      updateAddressFromCoords(lat, lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setFormData(prev => ({ ...prev, lat, lng }));
      updateAddressFromCoords(lat, lng);
    }
  };

  const updateAddressFromCoords = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
      }
    });
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address,
          lat,
          lng
        }));
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(17);
        }
      }
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Building2 className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Instalaciones
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Puntos de Control Estratégicos</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nombre de instalación o dirección..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex-1 md:flex-none bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border border-red-200 dark:border-red-800 font-bold active:scale-95"
              >
                <Trash2 size={20} />
                <span className="hidden sm:inline">{isDeleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}</span>
              </button>
            )}

            <button
              onClick={() => { 
                setFormData({ lat: -33.4489, lng: -70.6693, isActive: true }); 
                setIsModalOpen(true); 
              }}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg font-bold active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} /> Nueva Instalación
            </button>
          </div>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredInstallations.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-2 no-print">
          <button 
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {selectedIds.length === filteredInstallations.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
            {selectedIds.length === filteredInstallations.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredInstallations.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No se encontraron instalaciones</p>
          </div>
        ) : (
          filteredInstallations.map(inst => (
            <div 
              key={inst.id} 
              className={`glass-panel p-5 rounded-2xl relative group transition-all cursor-pointer ${
                selectedIds.includes(inst.id) ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-900/10' : 'hover:shadow-xl'
              }`}
              onClick={() => setSelectedIds(prev => prev.includes(inst.id) ? prev.filter(id => id !== inst.id) : [...prev, inst.id])}
            >
              {/* Checkbox Overlay */}
              <div 
                className="absolute top-4 right-4 z-20"
                onClick={(e) => handleToggleSelect(inst.id, e)}
              >
                {selectedIds.includes(inst.id) ? 
                  <CheckSquare size={20} className="text-blue-600" /> : 
                  <Square size={20} className="text-gray-200 dark:text-gray-700 group-hover:text-gray-400" />
                }
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{inst.name}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                    <MapPin size={12} />
                    <span className="truncate max-w-[150px]">{inst.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Estado Operativo</span>
                  <button
                    onClick={(e) => toggleStatus(inst.id, !!inst.isActive, e)}
                    className="focus:outline-none active:scale-95 transition-transform"
                  >
                    {inst.isActive ? 
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full font-black flex items-center gap-1 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50">
                        <CheckCircle2 size={12} /> ACTIVA
                      </span> :
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-black flex items-center gap-1 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50">
                        <XCircle size={12} /> INACTIVA
                      </span>
                    }
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Total Marcaciones</span>
                  <span className="text-gray-900 dark:text-white font-black bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                    {(inst as any).markingsCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button 
                  onClick={(e) => handleEdit(inst, e)}
                  className="flex-1 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white py-2 rounded-xl text-xs font-bold transition-all border border-gray-100 dark:border-white/5 flex items-center justify-center gap-2"
                >
                  <Edit size={14} /> Editar
                </button>
                <button 
                  onClick={(e) => handleDelete(inst.id, e)}
                  className="flex-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {formData.id ? 'Actualizar Instalación' : 'Registrar Nueva Instalación'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Define la ubicación táctica del punto de control</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                {/* Form Side */}
                <form onSubmit={handleSave} className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 tracking-widest">Nombre del Cliente</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            placeholder="Ej: Condominio Alto Las Rejas"
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none dark:text-white"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 tracking-widest">Dirección Técnica</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        {isLoaded ? (
                            <Autocomplete
                                onLoad={setAutocomplete}
                                onPlaceChanged={onPlaceChanged}
                            >
                                <input
                                    type="text"
                                    required
                                    placeholder="Buscar dirección o arrastrar pin..."
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none dark:text-white"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </Autocomplete>
                        ) : (
                            <input
                                type="text"
                                required
                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-tighter">Latitud</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="number"
                                step="any"
                                required
                                className="w-full bg-gray-100 dark:bg-slate-950 border-none rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-blue-400"
                                value={formData.lat || ''}
                                onChange={e => {
                                    const lat = parseFloat(e.target.value);
                                    setFormData({ ...formData, lat });
                                    if (!isNaN(lat) && formData.lng) updateAddressFromCoords(lat, formData.lng);
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 tracking-tighter">Longitud</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="number"
                                step="any"
                                required
                                className="w-full bg-gray-100 dark:bg-slate-950 border-none rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-blue-400"
                                value={formData.lng || ''}
                                onChange={e => {
                                    const lng = parseFloat(e.target.value);
                                    setFormData({ ...formData, lng });
                                    if (!isNaN(lng) && formData.lat) updateAddressFromCoords(formData.lat, lng);
                                }}
                            />
                        </div>
                    </div>
                  </div>
                  
                  {/* --- Selector de Tecnología (QR vs NFC) --- */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Tecnología de Marcación Autorizada</label>
                    <div className="flex bg-gray-100 dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, checkpointType: 'QR' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${
                          (!formData.checkpointType || formData.checkpointType === 'QR')
                            ? 'bg-white dark:bg-blue-600 shadow-sm text-blue-600 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <QrCode size={16} /> Código QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, checkpointType: 'NFC' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${
                          formData.checkpointType === 'NFC'
                            ? 'bg-white dark:bg-indigo-600 shadow-sm text-indigo-600 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Nfc size={16} /> Etiqueta NFC
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <Info className="text-blue-600 shrink-0" size={20} />
                        <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold leading-tight">
                            CONSEJO: Puedes buscar una dirección o arrastrar el marcador en el mapa para ajustar la ubicación precisa.
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-white dark:bg-gray-800 py-3 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 dark:border-white/5 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      Guardar Instalación
                    </button>
                  </div>
                </form>

                {/* Map Side */}
                <div className="flex-1 min-h-[300px] lg:min-h-full rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner bg-gray-100 dark:bg-gray-900 flex flex-col">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                        <MapIcon size={14} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ubicación Precisa (Pin Interactivo)</span>
                    </div>
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%', flex: 1 }}
                            center={{ lat: formData.lat || -33.4489, lng: formData.lng || -70.6693 }}
                            zoom={15}
                            onLoad={setMap}
                            onClick={handleMapClick}
                            options={{
                                disableDefaultUI: false,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                                styles: theme === 'dark' ? [
                                    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                                    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                                    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                                    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                                    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
                                    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
                                    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
                                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
                                ] : []
                            }}
                        >
                            <Marker
                                position={{ lat: formData.lat || -33.4489, lng: formData.lng || -70.6693 }}
                                draggable={true}
                                onDragEnd={handleMarkerDragEnd}
                                animation={google.maps.Animation.DROP}
                            />
                        </GoogleMap>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <p className="text-sm font-bold text-gray-400 animate-pulse">Cargando Mapa...</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationsManager;