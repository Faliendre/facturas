import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const success = (message) => addNotification(message, 'success');
    const error = (message) => addNotification(message, 'error');
    const warning = (message) => addNotification(message, 'warning');
    const info = (message) => addNotification(message, 'info');

    return (
        <NotificationContext.Provider value={{ success, error, warning, info }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-md w-full sm:w-auto">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onClose }) => {
    const { message, type } = notification;

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-rose-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const styles = {
        success: 'border-emerald-100 bg-emerald-50/90 text-emerald-900',
        error: 'border-rose-100 bg-rose-50/90 text-rose-900',
        warning: 'border-amber-100 bg-amber-50/90 text-amber-900',
        info: 'border-blue-100 bg-blue-50/90 text-blue-900',
    };

    const progressStyles = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
    };

    return (
        <div className={`
            pointer-events-auto relative overflow-hidden
            flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md
            animate-in fade-in slide-in-from-right-8 duration-500 ease-out
            ${styles[type]}
        `}>
            {/* Progress Bar */}
            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-[5000ms] ease-linear w-full ${progressStyles[type]} origin-left animate-[shrink_5s_linear_forwards]`} />
            
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-semibold tracking-tight">
                {message}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
