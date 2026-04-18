import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../components/Notification';


export default function Historial({ userRole }) {
    const { info } = useNotification();
    const [data, setData] = useState([]);

    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterType, setFilterType] = useState('');

    // Modal View
    const [selectedRecord, setSelectedRecord] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('search');
        if (q) setSearch(q);
    }, [location.search]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: registros, error } = await supabase
                .from('registros')
                .select('*')
                .order('fecha', { ascending: false });

            if (error) throw error;
            setData(registros || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        let result = [...data];

        if (search) {
            result = result.filter(d => d.concepto.toLowerCase().includes(search.toLowerCase()));
        }
        if (filterYear) {
            result = result.filter(d => d.fecha.startsWith(filterYear));
        }
        if (filterMonth) {
            const monthStr = filterMonth.padStart(2, '0');
            result = result.filter(d => {
                const [, m] = d.fecha.split('-');
                return m === monthStr;
            });
        }
        if (filterType) {
            result = result.filter(d => d.tipo === filterType);
        }
        return result;
    }, [data, search, filterYear, filterMonth, filterType]);

    const exportToExcel = () => {
        const wsData = filteredData.map(r => ({
            Fecha: r.fecha,
            Tipo: r.tipo,
            Concepto: r.concepto,
            Monto: r.monto,
            Notas: r.notas || ''
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        XLSX.writeFile(wb, "historial_gastos.xlsx");
    };

    const years = [...new Set(data.map(d => d.fecha.substring(0, 4)))].sort().reverse();
    const months = Array.from({ length: 12 }, (_, i) => ({ val: String(i + 1), label: new Date(2000, i).toLocaleString('es', { month: 'long' }) }));

    const isImage = (url) => url && url.match(/\.(jpeg|jpg|gif|png)$/i);

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Historial de registros</h1>
                    <p className="text-on-surface-variant">Consulta y gestiona todos los movimientos financieros de tu hogar.</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-tertiary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-tertiary/10"
                >
                    <span className="material-symbols-outlined">download</span>
                    Exportar a Excel
                </button>
            </div>

            {/* Bento Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
                    <label className="block text-[11px] font-bold text-outline uppercase mb-2">Filtrar por año</label>
                    <div className="relative">
                        <select
                            className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 appearance-none py-2 px-3 outline-none"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="">Todos los años</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-outline">expand_more</span>
                    </div>
                </div>

                <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
                    <label className="block text-[11px] font-bold text-outline uppercase mb-2">Filtrar por mes</label>
                    <div className="relative">
                        <select
                            className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 appearance-none py-2 px-3 outline-none"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">Todos los meses</option>
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-outline">expand_more</span>
                    </div>
                </div>

                <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
                    <label className="block text-[11px] font-bold text-outline uppercase mb-2">Filtrar por tipo</label>
                    <div className="relative">
                        <select
                            className="w-full bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 appearance-none py-2 px-3 outline-none"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="Factura">Factura</option>
                            <option value="Extracto bancario">Extracto bancario</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 pointer-events-none text-outline">expand_more</span>
                    </div>
                </div>

                <div className="md:col-span-1 bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-primary uppercase">Registros Vistos</p>
                        <p className="text-2xl font-black text-primary">{filteredData.length}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-3xl opacity-40">receipt_long</span>
                </div>
            </div>

            {/* Professional Administrative Table */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Concepto</th>
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-center">Documento</th>
                                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-outline">Cargando registros...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-outline">No hay registros para mostrar.</td></tr>
                            ) : (
                                filteredData.map(record => (
                                    <tr key={record.id} className="hover:bg-surface-container-high/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-on-surface">{record.fecha}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {record.tipo === 'Factura' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">Gasto Fto.</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary/10 text-tertiary">Bancario</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-on-surface">{record.concepto}</span>
                                                <span className="text-xs text-outline">{record.notas || 'Sin notas adicionales'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${record.tipo === 'Factura' ? 'text-error' : 'text-on-surface'}`}>
                                                Bs {Number(record.monto).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className={`transition-colors ${record.documento_url ? 'text-primary' : 'text-outline-variant/40 hover:text-outline'}`}
                                                disabled={!record.documento_url}
                                            >
                                                <span className="material-symbols-outlined text-xl">
                                                    {record.documento_url ? 'attach_file' : 'link_off'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                    title="Ver detalle"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                {userRole === 'admin' && (
                                                    <button
                                                        className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="Editar"
                                                        onClick={() => info('Edición disponible solo en ambiente full Admin.')}
                                                    >

                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dynamic Floating Tip (Bento element) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex gap-4 items-start shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-2xl">info</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-on-surface mb-1">Análisis Inteligente</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">Mostrando un resumen personalizado de los registros financieros filtrados de este mes.</p>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 flex gap-4 items-start shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-tertiary text-2xl">verified</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-on-surface mb-1">Sistema Conectado</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">Los documentos y enlaces se encuentran protegidos y respaldados en la base de datos.</p>
                    </div>
                </div>
            </div>

            {/* Modal Viewer */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                            <h2 className="text-xl font-extrabold text-on-surface">Detalle de {selectedRecord.concepto}</h2>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 text-outline hover:text-on-surface hover:bg-surface rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-8">
                            <div className="lg:w-1/3 space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase text-outline block mb-1">Concepto</label>
                                    <p className="font-bold text-on-surface text-lg">{selectedRecord.concepto}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-outline block mb-1">Fecha</label>
                                        <p className="font-medium text-on-surface">{selectedRecord.fecha}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-outline block mb-1">Monto</label>
                                        <p className="font-bold text-primary">Bs {Number(selectedRecord.monto).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-outline block mb-1">Tipo</label>
                                        <p className="font-medium text-on-surface">{selectedRecord.tipo}</p>
                                    </div>
                                </div>
                                {selectedRecord.notas && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-outline block mb-1">Notas</label>
                                        <p className="text-on-surface-variant bg-surface p-4 rounded-xl border border-outline-variant/10 text-sm">
                                            {selectedRecord.notas}
                                        </p>
                                    </div>
                                )}
                                {selectedRecord.documento_url && (
                                    <div>
                                        <a
                                            href={selectedRecord.documento_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 mt-4 text-primary font-bold hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                                            Abrir archivo original
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="lg:w-2/3 bg-surface rounded-2xl flex items-center justify-center border border-outline-variant/20 overflow-hidden min-h-[400px]">
                                {!selectedRecord.documento_url ? (
                                    <p className="text-outline">Sin documento adjunto</p>
                                ) : isImage(selectedRecord.documento_url) ? (
                                    <img src={selectedRecord.documento_url} alt="Documento" className="max-w-full max-h-full object-contain p-2" />
                                ) : (
                                    <iframe
                                        src={selectedRecord.documento_url}
                                        className="w-full h-full min-h-[400px]"
                                        title="Visor PDF"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
