import React, { useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";

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
        auth.loadUser();
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
