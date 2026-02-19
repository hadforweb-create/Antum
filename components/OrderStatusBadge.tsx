import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { OrderStatus } from "@/lib/api/orders";

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; bg: string; color: string }
> = {
    PENDING: { label: "Pending", bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
    IN_PROGRESS: { label: "In Progress", bg: "rgba(59,130,246,0.15)", color: "#3B82F6" },
    DELIVERED: { label: "Delivered", bg: "rgba(163,255,63,0.15)", color: "#a3ff3f" },
    REVISION_REQUESTED: { label: "Revision", bg: "rgba(249,115,22,0.15)", color: "#F97316" },
    COMPLETED: { label: "Completed", bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
    CANCELLED: { label: "Cancelled", bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
    DISPUTED: { label: "Disputed", bg: "rgba(168,85,247,0.15)", color: "#A855F7" },
};

interface Props {
    status: OrderStatus;
    size?: "sm" | "md";
}

export default function OrderStatusBadge({ status, size = "md" }: Props) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    const isSmall = size === "sm";

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: config.bg,
                    paddingHorizontal: isSmall ? 8 : 12,
                    paddingVertical: isSmall ? 3 : 5,
                },
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: config.color,
                        fontSize: isSmall ? 11 : 13,
                    },
                ]}
            >
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 99,
        alignSelf: "flex-start",
    },
    text: {
        fontWeight: "600",
        letterSpacing: 0.2,
    },
});
