import { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    TextInput,
    Dimensions,
    FlatList,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
    ArrowLeft,
    Search as SearchIcon,
    X,
    Star,
    TrendingUp,
    Clock,
    Sliders,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import { getServices, getCategories, Service } from "@/lib/api/services";
import { toast } from "@/lib/ui/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Design system constants
const BG = "#0b0b0f";
const SURFACE = "#131316";
const ELEVATED = "#1a1a1e";
const ACCENT = "#a3ff3f";
const ACCENT_DIM = "rgba(163,255,63,0.1)";
const TEXT = "#FFFFFF";
const TEXT_SEC = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_SUBTLE = "rgba(255,255,255,0.3)";
const BORDER = "rgba(255,255,255,0.06)";
const INPUT_BG = "rgba(255,255,255,0.06)";

const CATEGORY_ICONS: Record<string, string> = {
    "Brand Design": "\uD83C\uDFA8",
    "Web Dev": "\uD83D\uDCBB",
    "AI / ML": "\uD83E\uDDE0",
    "Video Edit": "\uD83C\uDFAC",
    "Marketing": "\uD83D\uDCE3",
    "Writing": "\u270D\uFE0F",
    "3D": "\uD83C\uDFAE",
    "Photography": "\uD83D\uDCF7",
};

const TRENDING_SEARCHES = [
    "Brand identity design",
    "Full stack developer",
    "Social media manager",
    "3D product rendering",
    "AI chatbot development",
    "Motion graphics",
];

const RECENT_SEARCHES = [
    "Logo design",
    "React Native developer",
    "Video editing",
];

export default function SearchScreen() {
    const router = useRouter();
    const searchInputRef = useRef<TextInput>(null);

    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                if (data.categories && Array.isArray(data.categories)) {
                    setCategories(data.categories.map((c: any) => typeof c === "string" ? c : c.name || c.category));
                }
            } catch {
                // Use fallback categories
                setCategories(["Brand Design", "Web Dev", "AI / ML", "Video Edit", "Marketing", "Writing", "3D", "Photography"]);
            }
        };
        fetchCategories();

        // Auto-focus search input
        setTimeout(() => searchInputRef.current?.focus(), 300);
    }, []);

    const performSearch = useCallback(async (searchQuery: string, category?: string | null) => {
        if (!searchQuery.trim() && !category) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const params: any = { limit: 20 };
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (category) params.category = category;

            const data = await getServices(params);
            setResults(data.services);
            setTotalResults(data.pagination?.total || data.services.length);
        } catch (err) {
            toast.error("Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleQueryChange = (text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            performSearch(text, selectedCategory);
        }, 400);
    };

    const handleCategoryPress = (category: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newCategory = selectedCategory === category ? null : category;
        setSelectedCategory(newCategory);
        performSearch(query, newCategory);
    };

    const handleTrendingPress = (term: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setQuery(term);
        performSearch(term, selectedCategory);
    };

    const handleServicePress = (serviceId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/service/${serviceId}`);
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleClearSearch = () => {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        searchInputRef.current?.focus();
    };

    const renderServiceCard = ({ item }: { item: Service }) => (
        <Pressable
            onPress={() => handleServicePress(item.id)}
            style={styles.resultCard}
        >
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.resultImage} contentFit="cover" />
            ) : (
                <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
                    <Text style={styles.resultImagePlaceholderText}>
                        {item.category?.charAt(0) || "S"}
                    </Text>
                </View>
            )}
            <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.resultMeta}>
                    <Text style={styles.resultCategory}>{item.category}</Text>
                    {item.user && (
                        <Text style={styles.resultCreator}>by {item.user.name || item.user.email?.split("@")[0]}</Text>
                    )}
                </View>
                <View style={styles.resultBottom}>
                    <Text style={styles.resultPrice}>{item.priceFormatted}</Text>
                    <View style={styles.deliveryBadge}>
                        <Clock size={12} color={TEXT_MUTED} strokeWidth={2} />
                        <Text style={styles.deliveryText}>{item.deliveryDays}d</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Search Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={22} color={TEXT} strokeWidth={2} />
                </Pressable>
                <View style={styles.searchInputWrap}>
                    <SearchIcon size={18} color={TEXT_MUTED} strokeWidth={2} />
                    <TextInput
                        ref={searchInputRef}
                        value={query}
                        onChangeText={handleQueryChange}
                        placeholder="Search services, creators..."
                        placeholderTextColor={TEXT_SUBTLE}
                        style={styles.searchInput}
                        returnKeyType="search"
                        onSubmitEditing={() => performSearch(query, selectedCategory)}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <Pressable onPress={handleClearSearch} style={styles.clearButton}>
                            <X size={16} color={TEXT_MUTED} strokeWidth={2} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
            >
                {(categories.length > 0 ? categories : Object.keys(CATEGORY_ICONS)).map((cat) => (
                    <Pressable
                        key={cat}
                        onPress={() => handleCategoryPress(cat)}
                        style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                    >
                        {CATEGORY_ICONS[cat] && (
                            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                        )}
                        <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                            {cat}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Content */}
            {!hasSearched ? (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Recent Searches */}
                    {RECENT_SEARCHES.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            {RECENT_SEARCHES.map((term, idx) => (
                                <Pressable
                                    key={idx}
                                    onPress={() => handleTrendingPress(term)}
                                    style={styles.recentItem}
                                >
                                    <Clock size={16} color={TEXT_SUBTLE} strokeWidth={2} />
                                    <Text style={styles.recentText}>{term}</Text>
                                </Pressable>
                            ))}
                        </Animated.View>
                    )}

                    {/* Trending Searches */}
                    <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                        <View style={styles.sectionHeader}>
                            <TrendingUp size={18} color={ACCENT} strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Trending Searches</Text>
                        </View>
                        <View style={styles.trendingGrid}>
                            {TRENDING_SEARCHES.map((term, idx) => (
                                <Pressable
                                    key={idx}
                                    onPress={() => handleTrendingPress(term)}
                                    style={styles.trendingPill}
                                >
                                    <Text style={styles.trendingText}>{term}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                </ScrollView>
            ) : loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={ACCENT} />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : results.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <SearchIcon size={48} color={TEXT_SUBTLE} strokeWidth={1.5} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptyText}>
                        Try adjusting your search or browse categories
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderServiceCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <Text style={styles.resultsCount}>
                            {totalResults} result{totalResults !== 1 ? "s" : ""} found
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ELEVATED,
        borderWidth: 1,
        borderColor: BORDER,
    },
    searchInputWrap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: INPUT_BG,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 44,
        borderWidth: 1,
        borderColor: BORDER,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
        color: TEXT,
        height: "100%",
    },
    clearButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryScroll: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
    },
    categoryPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    categoryPillActive: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
        color: TEXT_MUTED,
    },
    categoryTextActive: {
        color: BG,
        fontWeight: "800",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 0,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: TEXT,
        letterSpacing: -0.3,
        marginBottom: 14,
    },
    recentItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    recentText: {
        fontSize: 15,
        fontWeight: "500",
        color: TEXT_SEC,
    },
    trendingGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 2,
    },
    trendingPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
    },
    trendingText: {
        fontSize: 14,
        fontWeight: "600",
        color: TEXT_SEC,
    },
    // Loading
    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: TEXT_MUTED,
    },
    // Empty
    emptyWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: TEXT,
    },
    emptyText: {
        fontSize: 15,
        color: TEXT_MUTED,
        textAlign: "center",
    },
    // Results
    resultsList: {
        padding: 16,
        paddingBottom: 40,
    },
    resultsCount: {
        fontSize: 13,
        fontWeight: "600",
        color: TEXT_MUTED,
        marginBottom: 14,
    },
    resultCard: {
        flexDirection: "row",
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: "hidden",
        marginBottom: 12,
    },
    resultImage: {
        width: 110,
        height: 100,
    },
    resultImagePlaceholder: {
        backgroundColor: ELEVATED,
        alignItems: "center",
        justifyContent: "center",
    },
    resultImagePlaceholderText: {
        fontSize: 28,
        fontWeight: "800",
        color: TEXT_SUBTLE,
    },
    resultInfo: {
        flex: 1,
        padding: 14,
        justifyContent: "space-between",
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 4,
    },
    resultMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    resultCategory: {
        fontSize: 12,
        fontWeight: "600",
        color: ACCENT,
    },
    resultCreator: {
        fontSize: 12,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
    resultBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    resultPrice: {
        fontSize: 16,
        fontWeight: "800",
        color: TEXT,
    },
    deliveryBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    deliveryText: {
        fontSize: 12,
        fontWeight: "500",
        color: TEXT_MUTED,
    },
});
