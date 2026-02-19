import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.06)";
const ACCENT_BORDER = "rgba(163,255,63,0.3)";

export interface Tier {
    id: string;
    name: string;
    description: string;
    price: number;
    priceFormatted: string;
    deliveryDays: number;
    revisions: number;
    features: string[];
    isActive: boolean;
}

interface Props {
    tier: Tier;
    selected?: boolean;
    onPress?: () => void;
}

export default function TierCard({ tier, selected = false, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                selected && styles.cardSelected,
            ]}
        >
            {/* Tier name badge */}
            <View style={styles.header}>
                <View style={[styles.nameBadge, selected && styles.nameBadgeSelected]}>
                    <Text style={[styles.nameText, selected && { color: "#0b0b0f" }]}>
                        {tier.name}
                    </Text>
                </View>
                <Text style={styles.price}>{tier.priceFormatted}</Text>
            </View>

            <Text style={styles.description}>{tier.description}</Text>

            {/* Meta row */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{tier.deliveryDays}</Text>
                    <Text style={styles.metaLabel}>Days</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{tier.revisions}</Text>
                    <Text style={styles.metaLabel}>Revisions</Text>
                </View>
            </View>

            {/* Features */}
            {tier.features.length > 0 && (
                <View style={styles.features}>
                    {tier.features.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Check size={13} color={ACCENT} strokeWidth={2.5} />
                            <Text style={styles.featureText}>{f}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        marginBottom: 12,
    },
    cardSelected: {
        borderColor: ACCENT_BORDER,
        backgroundColor: "rgba(163,255,63,0.04)",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    nameBadge: {
        backgroundColor: ELEVATED,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: BORDER,
    },
    nameBadgeSelected: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    nameText: {
        color: TEXT,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    price: {
        color: ACCENT,
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    description: {
        color: TEXT_SEC,
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    metaItem: {
        alignItems: "center",
        flex: 1,
    },
    metaValue: {
        color: TEXT,
        fontSize: 18,
        fontWeight: "700",
    },
    metaLabel: {
        color: TEXT_MUTED,
        fontSize: 11,
        marginTop: 2,
    },
    metaDivider: {
        width: 1,
        height: 28,
        backgroundColor: BORDER,
    },
    features: {
        gap: 6,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    featureText: {
        color: TEXT_SEC,
        fontSize: 13,
        flex: 1,
    },
});
