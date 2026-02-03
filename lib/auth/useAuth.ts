import { useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import * as authClient from "@/lib/api/authClient";
import { getToken, clearToken } from "@/lib/auth/token";

export function useAuth() {
    const { user, isAuthenticated, isLoading, error, setUser, setLoading, setError, logout: storeLogout } = useAuthStore();

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log("[useAuth] Starting login for:", email);
            const response = await authClient.login({ email, password });
            console.log("[useAuth] Login successful:", response.user.email);
            setUser({
                id: response.user.id,
                email: response.user.email,
                role: response.user.role,
                name: response.user.name || null,
            });
            return response;
        } catch (err: any) {
            console.error("[useAuth] Login error:", err);
            const message = err?.message || "Login failed";
            setError({ message });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading, setError]);

    const register = useCallback(async (email: string, password: string, name: string, role: "FREELANCER" | "EMPLOYER" = "FREELANCER") => {
        setLoading(true);
        setError(null);
        try {
            console.log("[useAuth] Starting registration for:", email);
            const response = await authClient.register({ email, password, name, role });
            console.log("[useAuth] Registration successful:", response.user.email);
            setUser({
                id: response.user.id,
                email: response.user.email,
                role: response.user.role,
                name: response.user.name || null,
            });
            return response;
        } catch (err: any) {
            console.error("[useAuth] Registration error:", err);
            const message = err?.message || "Registration failed";
            setError({ message });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading, setError]);

    const logout = useCallback(async () => {
        await authClient.logout();
        storeLogout();
    }, [storeLogout]);

    const loadUser = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                setUser(null);
                return null;
            }
            const userData = await authClient.getMe();
            setUser({
                id: userData.id,
                email: userData.email,
                role: userData.role,
                name: userData.name || null,
            });
            return userData;
        } catch {
            await clearToken();
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading]);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        loadUser,
    };
}
