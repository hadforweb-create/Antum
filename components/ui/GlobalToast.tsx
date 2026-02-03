// Global Toast Provider - place in root layout
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { Check, X, AlertCircle, Info } from "lucide-react-native";
import { useToastStore, ToastType } from "@/lib/ui/toast";

export function GlobalToast() {
    const { current, hide } = useToastStore();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (current) {
            // Show toast
            translateY.value = withTiming(0, { duration: 300 });
            opacity.value = withTiming(1, { duration: 300 });

            // Auto-hide after duration
            const timer = setTimeout(() => {
                translateY.value = withTiming(-100, { duration: 300 });
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(hide)();
                });
            }, current.duration);

            return () => clearTimeout(timer);
        } else {
            // Reset position
            translateY.value = -100;
            opacity.value = 0;
        }
    }, [current]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const getColors = (type: ToastType) => {
        switch (type) {
            case "success":
                return { bg: "rgba(52, 199, 89, 0.95)", icon: Check };
            case "error":
                return { bg: "rgba(255, 59, 48, 0.95)", icon: X };
            case "info":
            default:
                return { bg: "rgba(80, 80, 240, 0.95)", icon: Info };
        }
    };

    if (!current) return null;

    const { bg, icon: Icon } = getColors(current.type);

    const handleDismiss = () => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(hide)();
        });
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
            <Pressable onPress={handleDismiss}>
                <View style={[styles.toast, { backgroundColor: bg }]}>
                    <Icon size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.message} numberOfLines={2}>
                        {current.message}
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 99999,
        alignItems: "center",
        pointerEvents: "box-none",
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        maxWidth: 340,
    },
    message: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
        flex: 1,
    },
});
