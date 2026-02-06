// Global toast state manager
import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastState {
    current: ToastMessage | null;
    queue: ToastMessage[];
    show: (message: string, type?: ToastType, duration?: number) => void;
    hide: () => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
    current: null,
    queue: [],

    show: (message, type = "info", duration = 3000) => {
        const id = `toast-${++toastId}`;
        const toast: ToastMessage = { id, message, type, duration };

        set((state) => {
            if (state.current) {
                // Queue the toast
                return { queue: [...state.queue, toast] };
            }
            // Show immediately
            return { current: toast };
        });
    },

    hide: () => {
        set((state) => {
            const [next, ...rest] = state.queue;
            return {
                current: next || null,
                queue: rest,
            };
        });
    },

    success: (message, duration = 3000) => {
        get().show(message, "success", duration);
    },

    error: (message, duration = 4000) => {
        get().show(message, "error", duration);
    },

    info: (message, duration = 3000) => {
        get().show(message, "info", duration);
    },
}));

// Convenience functions for direct usage without hooks
export const toast = {
    success: (message: string, duration?: number) => {
        useToastStore.getState().success(message, duration);
    },
    error: (message: string, duration?: number) => {
        useToastStore.getState().error(message, duration);
    },
    info: (message: string, duration?: number) => {
        useToastStore.getState().info(message, duration);
    },
    show: (message: string, type?: ToastType, duration?: number) => {
        useToastStore.getState().show(message, type, duration);
    },
};
