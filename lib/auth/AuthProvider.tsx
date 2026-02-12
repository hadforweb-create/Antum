import React, { useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/lib/supabase";
import { setToken, clearToken } from "./token";
import { useAuthStore } from "@/lib/store";

interface AuthContextValue {
    user: ReturnType<typeof useAuth>["user"];
    isAuthenticated: boolean;
    isLoading: boolean;
    error: ReturnType<typeof useAuth>["error"];
    login: ReturnType<typeof useAuth>["login"];
    register: ReturnType<typeof useAuth>["register"];
    logout: ReturnType<typeof useAuth>["logout"];
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = useAuth();

    useEffect(() => {
        // Load initial session
        auth.loadUser();

        // Listen for auth state changes (token refresh, sign out, etc.)
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token) {
                await setToken(session.access_token);
            } else {
                await clearToken();
                useAuthStore.getState().setUser(null);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider");
    }
    return context;
}
