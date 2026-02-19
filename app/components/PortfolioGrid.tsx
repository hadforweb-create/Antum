import { View, Pressable, StyleSheet, Text, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart, Eye } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors } from "@/lib/theme";

export interface PortfolioItem {
    id: string;
    title: string;
    thumbnail: string;
    category?: string;
    likes?: number;
    views?: number;
    price?: number;
    priceFormatted?: string;
}

interface PortfolioGridProps {
    items: PortfolioItem[];
    numColumns?: 2 | 3;
    onItemPress?: (item: PortfolioItem) => void;
    loading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function PortfolioGrid({
    items,
    numColumns = 2,
    onItemPress,
    loading = false,
}: PortfolioGridProps) {
    const router = useRouter();

    const handleItemPress = (item: PortfolioItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onItemPress) {
            onItemPress(item);
        } else {
            // Default navigation to service detail
            router.push(`/service/${item.id}`);
        }
    };

    const horizontalPadding = 20;
    const gap = 12;
    const availableWidth = SCREEN_WIDTH - horizontalPadding * 2 - gap * (numColumns - 1);
    const itemWidth = availableWidth / numColumns;

    const renderItem = ({ item, index }: { item: PortfolioItem; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).duration(300)}
            style={{ width: itemWidth }}
        >
            <Pressable
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => [
                    styles.portfolioItem,
                    pressed && styles.portfolioItemPressed,
                ]}
            >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.thumbnail}
                        contentFit="cover"
                    />

                    {/* Overlay with metrics on hover/tap */}
                    <View style={styles.overlay} />

                    {/* Category badge */}
                    {item.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    )}

                    {/* Engagement metrics */}
                    {(item.likes !== undefined || item.views !== undefined) && (
                        <View style={styles.metricsContainer}>
                            {item.likes !== undefined && (
                                <View style={styles.metric}>
                                    <Heart size={14} color="#FFF" fill="#EF4444" strokeWidth={2} />
                                    <Text style={styles.metricText}>
                                        {item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
                                    </Text>
                                </View>
                            )}
                            {item.views !== undefined && (
                                <View style={styles.metric}>
                                    <Eye size={14} color="#FFF" strokeWidth={2} />
                                    <Text style={styles.metricText}>
                                        {item.views > 999 ? `${(item.views / 1000).toFixed(1)}K` : item.views}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Title and price */}
                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {item.priceFormatted && (
                        <Text style={styles.itemPrice}>{item.priceFormatted}</Text>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading portfolio...</Text>
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No portfolio items yet</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            scrollEnabled={false}
            columnWrapperStyle={{
                gap: gap,
                marginHorizontal: horizontalPadding,
                marginBottom: gap,
            }}
            style={styles.grid}
        />
    );
}

const styles = StyleSheet.create({
    grid: {
        width: "100%",
    },
    portfolioItem: {
        backgroundColor: colors.surfaceDark,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    portfolioItemPressed: {
        opacity: 0.8,
    },
    thumbnailContainer: {
        position: "relative",
        width: "100%",
        aspectRatio: 1,
        backgroundColor: colors.surface,
        overflow: "hidden",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    categoryBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: "#000",
        fontSize: 10,
        fontWeight: "700",
    },
    metricsContainer: {
        position: "absolute",
        bottom: 8,
        right: 8,
        flexDirection: "column",
        gap: 4,
    },
    metric: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    metricText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "600",
    },
    itemContent: {
        padding: 12,
    },
    itemTitle: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    itemPrice: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "700",
    },
    loadingContainer: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
    },
    emptyContainer: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
    },
});
