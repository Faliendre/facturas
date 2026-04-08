import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ userRole }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [recentLogs, setRecentLogs] = useState([]);

    useEffect(() => {
        // Fetch latest 5 records for the notifications mockup
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('registros')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setRecentLogs(data);
        };
        fetchRecent();
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            navigate(`/historial?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(''); // clear after search
        }
    };

    const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

    return (
        <div className="bg-surface text-on-surface min-h-screen pb-20 lg:pb-0 relative">
            <Sidebar userRole={userRole} />

            {/* TopNavBar */}
            <header className="flex justify-between items-center w-full px-6 py-3 lg:pl-72 bg-white/80 backdrop-blur-md fixed top-0 z-40 border-b border-slate-200/20 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="lg:hidden material-symbols-outlined text-primary">menu</span>
                    <div className="text-lg font-black text-blue-900 hidden sm:block">Finanzas Familiares</div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <div className="relative flex items-center bg-[var(--color-surface-container)] rounded-full px-4 py-1.5 gap-2 w-full max-w-sm sm:w-auto">
                        <span className="material-symbols-outlined text-[var(--color-outline)] text-lg">search</span>
                        <input
                            className="bg-transparent border-none focus:ring-0 text-sm w-full sm:w-48 outline-none text-[var(--color-on-surface)]"
                            placeholder="Buscar (Ej: Supermercado)..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <div className="flex items-center gap-3 relative">
                        <button
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {recentLogs.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full"></span>}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden text-sm">
                                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                                    Historial Reciente
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {recentLogs.length === 0 ? (
                                        <div className="p-4 text-slate-500 text-center">No hay actividad reciente</div>
                                    ) : (
                                        recentLogs.map(log => (
                                            <div key={log.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <p className="font-semibold text-slate-800">Se agregó un/a {log.tipo.toLowerCase()}</p>
                                                <p className="text-slate-500 mt-1">"{log.concepto}" por la cantidad de Bs {Number(log.monto).toLocaleString()}</p>
                                                <p className="text-xs text-slate-400 mt-2">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[var(--color-primary-fixed)] bg-primary/20 flex flex-shrink-0 items-center justify-center font-bold text-primary" title={user?.email}>
                            {userInitial}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Canvas */}
            <main className="pt-24 lg:pl-72 px-4 sm:px-6 min-h-screen">
                <div className="max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
