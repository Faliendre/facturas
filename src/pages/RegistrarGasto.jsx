import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

export default function RegistrarGasto() {
    const navigate = useNavigate();
    const [loadingStatus, setLoadingStatus] = useState(''); // '', 'procesando', 'subiendo', 'registrando'
    const [formData, setFormData] = useState({
        fecha: '',
        tipo: 'Factura',
        concepto: '',
        monto: '',
        notas: ''
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validar tipos permitidos
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(selectedFile.type)) {
            alert('Fallo de validación: Solo se permiten imágenes (JPG, PNG, WEBP) o documentos PDF.');
            e.target.value = '';
            return;
        }

        // Limitar el tamaño a 10MB
        if (selectedFile.size > 10 * 1024 * 1024) {
            alert('El archivo pesa más de 10 MB. Por favor elige un archivo más pequeño.');
            e.target.value = '';
            return;
        }

        setFile(selectedFile);

        // Crear vista previa si es imagen
        if (selectedFile.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert('Por favor, sube un documento (imagen o PDF).');
            return;
        }

        let fileToUpload = file;

        try {
            // 1. Compresión de imagen (si aplica)
            if (file.type.startsWith('image/')) {
                setLoadingStatus('procesando');
                const options = {
                    maxSizeMB: 0.4,
                    maxWidthOrHeight: 1600,
                    useWebWorker: true,
                };
                fileToUpload = await imageCompression(file, options);
            }

            // 2. Subida a Supabase
            setLoadingStatus('subiendo');
            let documento_url = null;

            const fileExt = fileToUpload.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(fileName, fileToUpload);

            if (uploadError) throw uploadError;

            // 3. Obtener URL de Supabase Storage
            const { data: { publicUrl } } = supabase.storage
                .from('documentos')
                .getPublicUrl(fileName);

            documento_url = publicUrl;

            // 4. Registro en base de datos
            setLoadingStatus('registrando');
            const { error: insertError } = await supabase
                .from('registros')
                .insert([{
                    fecha: formData.fecha,
                    tipo: formData.tipo,
                    concepto: formData.concepto,
                    monto: parseFloat(formData.monto),
                    documento_url,
                    notas: formData.notas || null
                }]);

            if (insertError) throw insertError;
            alert('Gasto registrado exitosamente');
            navigate('/historial');
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al registrar el gasto: ' + error.message);
        } finally {
            setLoadingStatus('');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getLoadingMessage = () => {
        if (loadingStatus === 'procesando') return 'Procesando y comprimiendo imagen...';
        if (loadingStatus === 'subiendo') return 'Subiendo documento a la nube...';
        if (loadingStatus === 'registrando') return 'Guardando en la base de datos...';
        return 'Registrar gasto';
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-primary tracking-tight mb-2">Registrar Nuevo Gasto</h1>
                <p className="text-on-surface-variant font-body italic">Mantén la calma, nosotros nos encargamos de los números.</p>
            </div>

            {/* Form Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <form className="p-8 space-y-8" onSubmit={handleSubmit}>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Fecha de Transacción</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/60 text-lg">calendar_today</span>
                                <input
                                    type="date"
                                    name="fecha"
                                    required
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-body"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Tipo de Registro</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/60 text-lg">description</span>
                                <select
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none appearance-none font-body"
                                >
                                    <option value="Factura">Factura</option>
                                    <option value="Extracto bancario">Extracto Bancario</option>
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Concepto o Descripción</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/60 text-lg">edit_note</span>
                                <input
                                    type="text"
                                    name="concepto"
                                    required
                                    value={formData.concepto}
                                    onChange={handleChange}
                                    placeholder="Ej: Compra mensual supermercado"
                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-body"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Monto Total</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary/60 text-sm">Bs</span>
                                <input
                                    type="number"
                                    name="monto"
                                    step="0.01"
                                    required
                                    value={formData.monto}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-body"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Subir Documento (Imagen o PDF)</label>
                        <div className="group relative flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 w-full min-h-[160px] p-6 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low hover:bg-white hover:border-primary transition-all cursor-pointer overflow-hidden">

                            {previewUrl ? (
                                <div className="h-28 w-28 rounded-lg overflow-hidden border border-outline-variant/30 flex-shrink-0">
                                    <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                </div>
                            ) : null}

                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                {file ? (
                                    <>
                                        <span className="material-symbols-outlined text-3xl text-primary mb-1">{file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}</span>
                                        <p className="text-sm font-bold text-primary break-all">{file.name}</p>
                                        <p className="text-xs text-outline mt-1 text-center sm:text-left">Añadido exitosamente. Haz clic o arrastra para cambiar.</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                                        <p className="text-sm text-on-surface-variant"><span className="font-bold text-primary">Haz clic para subir</span> o arrastra y suelta</p>
                                        <p className="text-xs text-outline mt-1">Imágenes (serán comprimidas) o PDF. Máx 10MB.</p>
                                    </>
                                )}
                            </div>

                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={loadingStatus !== ''}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Notas Opcionales</label>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Detalles adicionales sobre el gasto..."
                            className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none font-body resize-none"
                        ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-outline-variant/10">
                        <button
                            type="submit"
                            disabled={loadingStatus !== ''}
                            className="flex-1 bg-primary text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingStatus === '' ? (
                                <span className="material-symbols-outlined">check_circle</span>
                            ) : (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            )}
                            {getLoadingMessage()}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/historial')}
                            className="sm:w-1/3 bg-transparent text-primary font-semibold py-4 px-8 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>

            {/* Contextual Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-surface-container rounded-xl flex items-start gap-4">
                    <div className="bg-primary-fixed p-3 rounded-lg text-primary">
                        <span className="material-symbols-outlined">network_ping</span>
                    </div>
                    <div>
                        <h4 className="font-headline font-bold text-on-surface">Carga Optimizada</h4>
                        <p className="text-sm text-on-surface-variant mt-1">Nuestra nueva tecnología comprime automáticamente tus fotografías y capturas desde tu celular para ahorrar datos y almacenamiento sin perder nitidez.</p>
                    </div>
                </div>
                <div className="p-6 rounded-xl flex items-start gap-4" style={{ backgroundColor: 'rgba(0,84,56,0.1)', border: '1px solid rgba(0,84,56,0.05)' }}>
                    <div className="bg-tertiary text-on-tertiary p-3 rounded-lg">
                        <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div>
                        <h4 className="font-headline font-bold text-tertiary">Documentación Segura</h4>
                        <p className="text-sm mt-1" style={{ color: '#005236' }}>Tus archivos se guardan en la nube protegida y solo tú tienes acceso a los detalles financieros.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
