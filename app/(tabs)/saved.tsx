import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const BG = "#0b0b0f";

/**
 * Stats Tab — redirects to the full Analytics screen.
 * This file exists to satisfy the tab route; the actual UI lives in app/analytics.tsx.
 */
export default function StatsTab() {
    const router = useRouter();

    useEffect(() => {
        // Small timeout to avoid navigation-before-mount warnings
        const t = setTimeout(() => {
            router.push("/analytics" as any);
        }, 50);
        return () => clearTimeout(t);
    }, []);

    return <View style={styles.bg} />;
}

const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: BG },
});
