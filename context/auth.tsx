import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [uid, setUID] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

    // Load session from localStorage
    useEffect(() => {
        const storedSessionId = localStorage.getItem('sessionId');
        const storedUid = localStorage.getItem('uid');
        const storedName = localStorage.getItem('name');
        
        if (storedSessionId && storedUid) {
            setSessionId(storedSessionId);
            setUID(storedUid);
            setName(storedName || '');
            setIsAuthenticated(true);
            // Validate session with the backend
            validateSession(storedSessionId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const getOdooHeaders = () => {
        const rawBase = (localStorage.getItem('odoo_base_url') || '').replace(/\/$/, '');
        const db = localStorage.getItem('odoo_db') || '';
        const headers: Record<string, string> = {};
        if (rawBase) headers['x-odoo-base'] = rawBase;
        if (db) headers['x-odoo-db'] = db;
        return headers;
    };

    const signIn = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getOdooHeaders(),
                },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.isAuthenticated) {
                console.log('Login successful:', data);
                setUID(data.uid?.toString() || '');
                setName(data.name || '');
                setSessionId(data.sessionId || '');
                setIsAuthenticated(true);
                setIsLoading(false);
                // Store session in localStorage
                localStorage.setItem('sessionId', data.sessionId || '');
                localStorage.setItem('uid', data.uid?.toString() || '');
                localStorage.setItem('name', data.name || '');
                
                return true;
            } else {
                setIsAuthenticated(false);
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setIsAuthenticated(false);
            setIsLoading(false);
            return false;
        }
    };

    const validateSession = async (sessionIdToValidate: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getOdooHeaders(),
                },
                body: JSON.stringify({ sessionId: sessionIdToValidate }),
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.isValid) {
                // If session is invalid -> sign out
                signOut();
            } else {
                // Session is valid, keep the authenticated state
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // On error, keep the user logged in (optimistic approach)
            // The session might still be valid, just a network issue
            setIsLoading(false);
        }
    };

    const signOut = () => {
        setUID('');
        setName('');
        setSessionId('');
        setIsAuthenticated(false);
        localStorage.removeItem('sessionId');
        localStorage.removeItem('uid');
        localStorage.removeItem('name');
    };

    return (
        <AuthContext.Provider value={{ uid, name, sessionId, isAuthenticated, isLoading, signIn, signOut, validateSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};