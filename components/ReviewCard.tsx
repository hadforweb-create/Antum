import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import StarRating from "./StarRating";
import type { Review } from "@/lib/api/reviews";

const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.06)";

interface Props {
    review: Review;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export default function ReviewCard({ review }: Props) {
    const reviewer = review.reviewer;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarWrap}>
                    {reviewer?.avatarUrl ? (
                        <Image
                            source={{ uri: reviewer.avatarUrl }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>
                                {(reviewer?.displayName ?? "?")[0]?.toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerMeta}>
                    <Text style={styles.reviewerName}>
                        {reviewer?.displayName ?? "Anonymous"}
                    </Text>
                    <Text style={styles.date}>{timeAgo(review.createdAt)}</Text>
                </View>
                <StarRating value={review.rating} readonly size={16} />
            </View>

            {/* Body */}
            {review.body ? (
                <Text style={styles.body}>{review.body}</Text>
            ) : null}

            {/* Freelancer reply */}
            {review.reply ? (
                <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>Freelancer Reply</Text>
                    <Text style={styles.replyText}>{review.reply}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    avatarWrap: {
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarFallback: {
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        color: ACCENT,
        fontSize: 16,
        fontWeight: "700",
    },
    headerMeta: {
        flex: 1,
    },
    reviewerName: {
        color: TEXT,
        fontSize: 14,
        fontWeight: "600",
    },
    date: {
        color: TEXT_MUTED,
        fontSize: 12,
        marginTop: 1,
    },
    body: {
        color: TEXT_SEC,
        fontSize: 14,
        lineHeight: 21,
    },
    replyBox: {
        marginTop: 12,
        backgroundColor: ELEVATED,
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 2,
        borderLeftColor: ACCENT,
    },
    replyLabel: {
        color: ACCENT,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    replyText: {
        color: TEXT_MUTED,
        fontSize: 13,
        lineHeight: 19,
    },
});
