import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function RegistrarGasto() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fecha: '',
        tipo: 'Factura',
        concepto: '',
        monto: '',
        notas: ''
    });
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert('Por favor, sube un documento.');
            return;
        }

        setLoading(true);
        let documento_url = null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos')
                .getPublicUrl(fileName);

            documento_url = publicUrl;

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
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                        <div className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low hover:bg-white hover:border-primary transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                            {file ? (
                                <p className="text-sm font-bold text-primary">{file.name}</p>
                            ) : (
                                <>
                                    <p className="text-sm text-on-surface-variant"><span className="font-bold text-primary">Haz clic para subir</span> o arrastra y suelta</p>
                                    <p className="text-xs text-outline mt-1">Soporta JPG, PNG y PDF</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
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
                            disabled={loading}
                            className="flex-1 bg-primary text-on-primary font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            {loading ? 'Subiendo...' : 'Registrar gasto'}
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
                        <span className="material-symbols-outlined">lightbulb</span>
                    </div>
                    <div>
                        <h4 className="font-headline font-bold text-on-surface">Consejo de Ahorro</h4>
                        <p className="text-sm text-on-surface-variant mt-1">Clasificar correctamente tus gastos nos ayuda a predecir tus ahorros mensuales con mayor precisión.</p>
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
