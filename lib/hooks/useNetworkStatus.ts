import { useState, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
}

/**
 * Hook to monitor network connectivity status.
 * Returns { isConnected, isInternetReachable }
 */
export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: true,
    });

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setStatus({
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
            });
        });

        // Get initial state
        NetInfo.fetch().then((state) => {
            setStatus({
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
            });
        });

        return () => unsubscribe();
    }, []);

    return status;
}
