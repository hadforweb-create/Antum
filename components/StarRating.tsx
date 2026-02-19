import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";

const ACCENT = "#a3ff3f";
const MUTED = "rgba(255,255,255,0.15)";

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
    readonly?: boolean;
}

export default function StarRating({
    value,
    onChange,
    size = 24,
    readonly = false,
}: StarRatingProps) {
    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                return (
                    <Pressable
                        key={star}
                        onPress={() => !readonly && onChange?.(star)}
                        style={[styles.star, { padding: size * 0.1 }]}
                        disabled={readonly}
                    >
                        <Star
                            size={size}
                            color={filled ? ACCENT : MUTED}
                            fill={filled ? ACCENT : "transparent"}
                            strokeWidth={1.5}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    star: {
        // padding applied dynamically
    },
});
