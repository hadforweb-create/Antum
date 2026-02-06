import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    TextInput,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Search, Star, Sun, Moon, Plus, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { getServices, getCategories, Service, CategoriesResponse } from "@/lib/api/services";
import { colors } from "@/lib/theme";

const DEFAULT_CATEGORIES = ["All", "Design", "Development", "Marketing", "Writing", "3D", "Video"];

export default function ServicesScreen() {
    const router = useRouter();
    const { isDark, toggleTheme } = useThemeStore();
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFreelancer = user?.role === "FREELANCER";

    // ANTUM Design System Colors
    const bgColor = isDark ? "#121214" : "#FAFAFC";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E93";
    const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const inputBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const accentColor = colors.primary;

    const fetchServices = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const [servicesResponse, categoriesResponse] = await Promise.all([
                getServices({
                    category: selectedCategory !== "All" ? selectedCategory : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                }),
                getCategories(),
            ]);

            setServices(servicesResponse.services);

            // Build categories list with "All" first
            if (categoriesResponse.categories.length > 0) {
                const catNames = categoriesResponse.categories.map((c) => c.name);
                setCategories(["All", ...catNames]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load services";
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchServices();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleServicePress = (serviceId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/service/${serviceId}`);
    };

    const handleCreatorPress = (creatorId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/profile/${creatorId}`);
    };

    const handleCreateService = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/service/create");
    };

    const filteredServices = services.filter((service) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            service.title.toLowerCase().includes(query) ||
            service.description.toLowerCase().includes(query)
        );
    });

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <SafeAreaView edges={["top"]} style={{ zIndex: 10 }}>
                <BlurView intensity={80} tint={isDark ? "dark" : "light"}>
                    <View
                        style={[
                            styles.header,
                            {
                                backgroundColor: isDark
                                    ? "rgba(28,28,30,0.92)"
                                    : "rgba(255,255,255,0.92)",
                                borderBottomColor: borderColor,
                            },
                        ]}
                    >
                        <Text style={[styles.headerTitle, { color: textColor }]}>Services</Text>
                        <View style={styles.headerButtons}>
                            {isFreelancer && (
                                <Pressable onPress={handleCreateService} style={styles.themeButton}>
                                    <Plus size={22} color={accentColor} strokeWidth={2.5} />
                                </Pressable>
                            )}
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    toggleTheme();
                                }}
                                style={styles.themeButton}
                            >
                                {isDark ? (
                                    <Sun size={22} color={textColor} strokeWidth={2} />
                                ) : (
                                    <Moon size={22} color={textColor} strokeWidth={2} />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </BlurView>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchServices(true)}
                        tintColor={accentColor}
                    />
                }
            >
                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: inputBg }]}>
                    <Search size={20} color={mutedColor} strokeWidth={2} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Search services..."
                        placeholderTextColor={mutedColor}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedCategory(category);
                            }}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor:
                                        selectedCategory === category ? accentColor : inputBg,
                                    borderColor:
                                        selectedCategory === category ? accentColor : borderColor,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    {
                                        color: selectedCategory === category ? "#FFF" : textColor,
                                    },
                                ]}
                            >
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Loading State */}
                {loading && !refreshing && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={accentColor} />
                    </View>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
                        <Text style={[styles.errorTitle, { color: textColor }]}>
                            Something went wrong
                        </Text>
                        <Text style={[styles.errorText, { color: mutedColor }]}>{error}</Text>
                        <Pressable
                            onPress={() => fetchServices()}
                            style={[styles.retryButton, { backgroundColor: accentColor }]}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </Pressable>
                    </Animated.View>
                )}

                {/* Services List */}
                {!loading && !error && (
                    <View style={styles.servicesGrid}>
                        {filteredServices.map((service, index) => (
                            <Animated.View
                                key={service.id}
                                entering={FadeInDown.delay(index * 50).duration(300)}
                            >
                                <Pressable
                                    onPress={() => handleServicePress(service.id)}
                                    style={({ pressed }) => [
                                        styles.serviceCard,
                                        { backgroundColor: cardBg, borderColor },
                                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                                    ]}
                                >
                                    {/* Service Image */}
                                    {service.imageUrl ? (
                                        <Image
                                            source={{ uri: service.imageUrl }}
                                            style={styles.serviceImage}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.serviceImage,
                                                styles.servicePlaceholder,
                                                { backgroundColor: inputBg },
                                            ]}
                                        >
                                            <Text style={{ color: mutedColor, fontSize: 40 }}>
                                                {service.category.charAt(0)}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Price Badge */}
                                    <View style={styles.priceBadge}>
                                        <Text style={styles.priceText}>
                                            From {service.priceFormatted}
                                        </Text>
                                    </View>

                                    {/* Content */}
                                    <View style={styles.serviceContent}>
                                        <Text
                                            style={[styles.serviceTitle, { color: textColor }]}
                                            numberOfLines={2}
                                        >
                                            {service.title}
                                        </Text>

                                        <Text
                                            style={[styles.serviceDescription, { color: mutedColor }]}
                                            numberOfLines={2}
                                        >
                                            {service.description}
                                        </Text>

                                        {/* Creator Row */}
                                        {service.user && (
                                            <Pressable
                                                onPress={() => handleCreatorPress(service.user!.id)}
                                                style={styles.creatorRow}
                                            >
                                                {service.user.avatarUrl ? (
                                                    <Image
                                                        source={{ uri: service.user.avatarUrl }}
                                                        style={styles.creatorAvatar}
                                                    />
                                                ) : (
                                                    <View
                                                        style={[
                                                            styles.creatorAvatar,
                                                            {
                                                                backgroundColor: accentColor,
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            },
                                                        ]}
                                                    >
                                                        <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
                                                            {(service.user.name || service.user.email).charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                                <Text style={[styles.creatorName, { color: textColor }]}>
                                                    {service.user.name || service.user.email}
                                                </Text>
                                            </Pressable>
                                        )}

                                        {/* Delivery Time */}
                                        <View style={styles.metaRow}>
                                            <View style={styles.categoryBadge}>
                                                <Text style={[styles.categoryBadgeText, { color: accentColor }]}>
                                                    {service.category}
                                                </Text>
                                            </View>
                                            <View style={styles.deliveryContainer}>
                                                <Clock size={14} color={mutedColor} strokeWidth={2} />
                                                <Text style={[styles.deliveryText, { color: mutedColor }]}>
                                                    {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!loading && !error && filteredServices.length === 0 && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                        <Text style={[styles.emptyTitle, { color: textColor }]}>
                            No services found
                        </Text>
                        <Text style={[styles.emptyDescription, { color: mutedColor }]}>
                            {searchQuery || selectedCategory !== "All"
                                ? "Try adjusting your search or category filter"
                                : "Be the first to offer a service!"}
                        </Text>
                        {isFreelancer && !searchQuery && selectedCategory === "All" && (
                            <Pressable
                                onPress={handleCreateService}
                                style={[styles.createButton, { backgroundColor: accentColor }]}
                            >
                                <Plus size={20} color="#FFF" strokeWidth={2.5} />
                                <Text style={styles.createButtonText}>Create Service</Text>
                            </Pressable>
                        )}
                    </Animated.View>
                )}

                {/* Bottom spacing for tab bar */}
                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    themeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        gap: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    categoriesContainer: {
        marginBottom: 20,
        marginHorizontal: -20,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: "600",
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: "center",
    },
    errorContainer: {
        alignItems: "center",
        paddingVertical: 60,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    servicesGrid: {
        gap: 16,
    },
    serviceCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: "hidden",
    },
    serviceImage: {
        width: "100%",
        height: 180,
    },
    servicePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    priceBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    priceText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "700",
    },
    serviceContent: {
        padding: 16,
        gap: 10,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: "700",
        lineHeight: 24,
    },
    serviceDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    creatorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    creatorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    creatorName: {
        fontSize: 14,
        fontWeight: "600",
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: "rgba(80,80,240,0.1)",
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    deliveryContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    deliveryText: {
        fontSize: 13,
        fontWeight: "500",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 20,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    createButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
