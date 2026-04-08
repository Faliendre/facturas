import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar({ userRole }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: 'dashboard' },
        { name: 'Gasto', path: '/registrar', icon: 'add_circle', role: 'admin' },
        { name: 'Historial', path: '/historial', icon: 'history' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-slate-100 border-r border-slate-200 z-50">
                <div className="text-xl font-bold text-blue-900 px-6 py-8 flex flex-col gap-1">
                    <span className="tracking-tight">Gestión Familiar</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Finanzas en calma</span>
                </div>

                <nav className="flex-1 flex flex-col mt-4">
                    {navItems.map((item) => {
                        if (item.role && item.role !== userRole && userRole !== 'admin') return null;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-6 py-3 transition-colors duration-200 ${isActive
                                        ? 'text-blue-800 font-semibold border-l-4 border-blue-800 bg-white/50'
                                        : 'text-slate-500 hover:text-blue-700 hover:bg-slate-200'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-['Manrope'] text-sm tracking-tight">{item.name === 'Gasto' ? 'Registrar Gasto' : item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <button
                        onClick={() => navigate('/registrar')}
                        className="w-full bg-primary text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-all text-sm"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nueva Transacción
                    </button>
                </div>

                <div className="mt-auto border-t border-slate-200/50 pb-6 pt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-blue-700 hover:bg-slate-200 transition-colors duration-200"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-['Manrope'] text-sm tracking-tight">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200/50 flex justify-around items-center py-3 z-50">
                {navItems.map((item) => {
                    if (item.role && item.role !== userRole && userRole !== 'admin') return null;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-500'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className={`text-[10px] ${true ? 'font-bold' : ''}`}>{item.name}</span>
                        </NavLink>
                    );
                })}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1 text-slate-500"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-[10px] font-bold">Salir</span>
                </button>
            </nav>
        </>
    );
}
