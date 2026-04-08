import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { getYear, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: registros, error } = await supabase
                .from('registros')
                .select('*')
                .order('fecha', { ascending: true });

            if (error) throw error;
            setData(registros || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Cargando dashboard...</div>;

    const totalRegistros = data.length;
    const totalFacturas = data.filter(d => d.tipo === 'Factura').reduce((acc, curr) => acc + Number(curr.monto), 0);
    const totalExtractos = data.filter(d => d.tipo === 'Extracto bancario').reduce((acc, curr) => acc + Number(curr.monto), 0);
    const totalGeneral = totalFacturas + totalExtractos;

    const pctFacturas = totalGeneral > 0 ? Math.round((totalFacturas / totalGeneral) * 100) : 0;
    const pctExtractos = totalGeneral > 0 ? Math.round((totalExtractos / totalGeneral) * 100) : 0;

    // Chart Data
    const gastosPorAno = data.reduce((acc, curr) => {
        const year = getYear(parseISO(curr.fecha));
        acc[year] = (acc[year] || 0) + Number(curr.monto);
        return acc;
    }, {});
    const barData = {
        labels: Object.keys(gastosPorAno),
        datasets: [{
            label: 'Gastos por año (Bs)',
            data: Object.values(gastosPorAno),
            backgroundColor: '#003fb1',
            borderRadius: 4
        }]
    };

    const evolucionGastos = data.reduce((acc, curr) => {
        const mesAno = format(parseISO(curr.fecha), 'MMM yyyy', { locale: es });
        acc[mesAno] = (acc[mesAno] || 0) + Number(curr.monto);
        return acc;
    }, {});
    const lineData = {
        labels: Object.keys(evolucionGastos),
        datasets: [{
            label: 'Evolución',
            data: Object.values(evolucionGastos),
            borderColor: '#003fb1',
            backgroundColor: 'rgba(0, 63, 177, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const pieData = {
        labels: ['Facturas', 'Extractos'],
        datasets: [{
            data: [totalFacturas, totalExtractos],
            backgroundColor: ['#003fb1', '#555f6d'],
            borderWidth: 0,
            cutout: '80%'
        }]
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-[28px] font-bold text-on-surface tracking-tight">Dashboard Principal</h1>
                <p className="text-on-surface-variant text-sm">Resumen financiero consolidado al día de hoy.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant font-medium">Total de gastos registrados</p>
                        <h3 className="text-2xl font-bold text-on-surface mt-1">Bs {totalGeneral.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <span className="material-symbols-outlined">receipt_long</span>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant font-medium">Total en facturas</p>
                        <h3 className="text-2xl font-bold text-on-surface mt-1">Bs {totalFacturas.toLocaleString()}</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{pctFacturas}% del volumen total</p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant font-medium">Total en extractos</p>
                        <h3 className="text-2xl font-bold text-on-surface mt-1">Bs {totalExtractos.toLocaleString()}</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{pctExtractos}% del volumen total</p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                        <span className="material-symbols-outlined">list_alt</span>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant font-medium">Número total de registros</p>
                        <h3 className="text-2xl font-bold text-on-surface mt-1">{totalRegistros}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">Evolución de gastos en el tiempo</h2>
                            <p className="text-sm text-on-surface-variant mt-1">Análisis mensual de flujos de caja.</p>
                        </div>
                    </div>
                    <div className="h-64 w-full relative block">
                        <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col">
                    <h2 className="text-xl font-bold text-on-surface mb-2">Distribución por tipo</h2>
                    <p className="text-sm text-on-surface-variant mb-8">Facturas vs Extractos bancarios.</p>
                    <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                        <div className="h-40 w-40 relative">
                            <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-2">
                            <span className="text-2xl font-bold text-on-surface">{totalRegistros}</span>
                            <span className="text-[10px] uppercase text-on-surface-variant tracking-widest font-semibold">Total</span>
                        </div>
                    </div>
                    <div className="mt-8 w-full space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#003fb1' }}></div>
                                <span className="text-on-surface-variant">Facturas</span>
                            </div>
                            <span className="font-bold">{pctFacturas}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#555f6d' }}></div>
                                <span className="text-on-surface-variant">Extractos</span>
                            </div>
                            <span className="font-bold">{pctExtractos}%</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-12 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">Gastos por año</h2>
                            <p className="text-sm text-on-surface-variant mt-1">Comparativa histórica anual.</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
