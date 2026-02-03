import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import {
    Settings,
    Sun,
    Moon,
    LogOut,
    Film,
    Briefcase,
    Bookmark,
    MessageCircle,
    Plus,
    Edit2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemeStore, useAuthStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/useAuth";
import { colors } from "@/lib/theme";
import { getCurrentUser, User } from "@/lib/api/users";
import { getMyServices, Service } from "@/lib/api/services";

export default function ProfileScreen() {
    const router = useRouter();
    const { isDark, toggleTheme } = useThemeStore();
    const { user: authUser } = useAuthStore();
    const { logout } = useAuth();

    const [profile, setProfile] = useState<User | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ANTUM Design System
    const bgColor = isDark ? "#121214" : "#FAFAFC";
    const textColor = isDark ? "#FFF" : "#000";
    const mutedColor = "#8E8E93";
    const cardBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(255,255,255,0.85)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const accentColor = colors.primary;

    const isFreelancer = profile?.role === "FREELANCER";

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const [userResponse, servicesResponse] = await Promise.all([
                getCurrentUser(),
                getMyServices(),
            ]);

            setProfile(userResponse);
            setServices(servicesResponse.services.filter((s) => s.isActive));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load profile";
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleEditProfile = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/profile/edit");
    };

    const handleCreateService = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/service/create");
    };

    const handleServicePress = (serviceId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/service/${serviceId}`);
    };

    // Get display values
    const displayName = profile?.name || profile?.email?.split("@")[0] || "User";
    const username = profile?.email ? `@${profile.email.split("@")[0]}` : "";

    // Loading state
    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <SafeAreaView edges={["top"]} style={{ zIndex: 10 }}>
                    <View style={[styles.header, { borderBottomColor: borderColor }]}>
                        <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
                    </View>
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={accentColor} />
                </View>
            </View>
        );
    }

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
                        <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
                        <View style={styles.headerButtons}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push("/conversations");
                                }}
                                style={styles.themeButton}
                            >
                                <MessageCircle size={22} color={textColor} strokeWidth={2} />
                            </Pressable>
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
                        onRefresh={() => fetchData(true)}
                        tintColor={accentColor}
                    />
                }
            >
                {/* Error State */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable onPress={() => fetchData()} style={styles.retryLink}>
                            <Text style={styles.retryLinkText}>Tap to retry</Text>
                        </Pressable>
                    </View>
                )}

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.springify()}>
                    <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.profileCardBlur}>
                        <View
                            style={[
                                styles.profileCard,
                                { backgroundColor: cardBg, borderColor },
                            ]}
                        >
                            {/* Header Row */}
                            <View style={styles.profileHeader}>
                                <View style={styles.avatarContainer}>
                                    {profile?.avatarUrl ? (
                                        <Image
                                            source={{ uri: profile.avatarUrl }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarText}>
                                                {displayName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={[styles.displayName, { color: textColor }]}>
                                        {displayName}
                                    </Text>
                                    <Text style={[styles.username, { color: mutedColor }]}>
                                        {username}
                                    </Text>
                                    <View style={styles.roleRow}>
                                        <Text style={[styles.roleText, { color: accentColor }]}>
                                            {isFreelancer ? "Freelancer" : "Client"}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={handleEditProfile}
                                    style={[styles.settingsButton, { backgroundColor: inputBg }]}
                                >
                                    <Edit2 size={18} color={textColor} strokeWidth={2} />
                                </Pressable>
                            </View>

                            {/* Bio */}
                            {profile?.bio ? (
                                <Text style={[styles.bio, { color: textColor }]}>
                                    {profile.bio}
                                </Text>
                            ) : (
                                <Text style={[styles.bio, { color: mutedColor, fontStyle: "italic" }]}>
                                    No bio yet. Tap Edit to add one.
                                </Text>
                            )}

                            {/* Location */}
                            {profile?.location && (
                                <Text style={[styles.location, { color: mutedColor }]}>
                                    📍 {profile.location}
                                </Text>
                            )}

                            {/* Stats */}
                            <View style={styles.statsRow}>
                                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                                    <Film size={18} color={accentColor} strokeWidth={2} />
                                    <Text style={[styles.statValue, { color: textColor }]}>
                                        {profile?.reelsCount ?? 0}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: mutedColor }]}>
                                        Reels
                                    </Text>
                                </View>
                                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                                    <Briefcase size={18} color={accentColor} strokeWidth={2} />
                                    <Text style={[styles.statValue, { color: textColor }]}>
                                        {profile?.servicesCount ?? 0}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: mutedColor }]}>
                                        Services
                                    </Text>
                                </View>
                                <View style={[styles.statItem, { backgroundColor: inputBg }]}>
                                    <Bookmark size={18} color={accentColor} strokeWidth={2} />
                                    <Text style={[styles.statValue, { color: textColor }]}>
                                        {profile?.shortlistCount ?? 0}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: mutedColor }]}>
                                        Saved
                                    </Text>
                                </View>
                            </View>

                            {/* Edit Button */}
                            <Pressable
                                onPress={handleEditProfile}
                                style={[
                                    styles.editButton,
                                    {
                                        backgroundColor: inputBg,
                                        borderColor,
                                    },
                                ]}
                            >
                                <Text style={[styles.editButtonText, { color: textColor }]}>
                                    Edit Profile
                                </Text>
                            </Pressable>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* My Services Section - Only for Freelancers */}
                {isFreelancer && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Briefcase size={18} color={textColor} strokeWidth={2} />
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                My Services
                            </Text>
                            <Text style={[styles.sectionCount, { color: accentColor }]}>
                                {services.length}
                            </Text>
                        </View>

                        {services.length > 0 ? (
                            <View style={styles.servicesGrid}>
                                {services.map((service) => (
                                    <Pressable
                                        key={service.id}
                                        onPress={() => handleServicePress(service.id)}
                                        style={[styles.serviceCard, { backgroundColor: cardBg, borderColor }]}
                                    >
                                        {service.imageUrl ? (
                                            <Image
                                                source={{ uri: service.imageUrl }}
                                                style={styles.serviceImage}
                                            />
                                        ) : (
                                            <View
                                                style={[
                                                    styles.serviceImage,
                                                    styles.servicePlaceholder,
                                                    { backgroundColor: accentColor },
                                                ]}
                                            >
                                                <Text style={styles.servicePlaceholderText}>
                                                    {service.category.charAt(0)}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.serviceInfo}>
                                            <Text
                                                style={[styles.serviceTitle, { color: textColor }]}
                                                numberOfLines={2}
                                            >
                                                {service.title}
                                            </Text>
                                            <Text style={styles.servicePrice}>
                                                {service.priceFormatted}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.emptySection, { backgroundColor: cardBg, borderColor }]}>
                                <Briefcase size={32} color={mutedColor} strokeWidth={1.5} />
                                <Text style={[styles.emptyText, { color: mutedColor }]}>
                                    You haven't created any services yet
                                </Text>
                                <Pressable
                                    onPress={handleCreateService}
                                    style={[styles.createButton, { backgroundColor: accentColor }]}
                                >
                                    <Plus size={18} color="#FFF" strokeWidth={2.5} />
                                    <Text style={styles.createButtonText}>Create Service</Text>
                                </Pressable>
                            </View>
                        )}

                        {services.length > 0 && (
                            <Pressable
                                onPress={handleCreateService}
                                style={[styles.addServiceButton, { borderColor: accentColor }]}
                            >
                                <Plus size={18} color={accentColor} strokeWidth={2.5} />
                                <Text style={[styles.addServiceText, { color: accentColor }]}>
                                    Add New Service
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* Logout Button */}
                <Pressable
                    onPress={handleLogout}
                    style={[styles.logoutButton, { backgroundColor: "rgba(255,59,48,0.1)" }]}
                >
                    <LogOut size={18} color="#FF3B30" strokeWidth={2} />
                    <Text style={[styles.logoutText, { color: "#FF3B30" }]}>
                        Sign Out
                    </Text>
                </Pressable>

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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorBanner: {
        backgroundColor: "rgba(255,59,48,0.1)",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: "center",
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 14,
        textAlign: "center",
    },
    retryLink: {
        marginTop: 8,
    },
    retryLinkText: {
        color: "#FF3B30",
        fontSize: 14,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    profileCardBlur: {
        borderRadius: 20,
        overflow: "hidden",
    },
    profileCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
    },
    profileHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#5050F0",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        backgroundColor: "#5050F0",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#FFF",
        fontSize: 32,
        fontWeight: "700",
    },
    profileInfo: {
        flex: 1,
        marginLeft: 14,
        paddingTop: 4,
    },
    displayName: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 4,
    },
    username: {
        fontSize: 15,
        fontWeight: "500",
        marginBottom: 6,
    },
    roleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    roleText: {
        fontSize: 13,
        fontWeight: "600",
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    bio: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 12,
    },
    location: {
        fontSize: 14,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        gap: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    editButton: {
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: "600",
    },
    servicesGrid: {
        gap: 12,
    },
    serviceCard: {
        flexDirection: "row",
        borderRadius: 14,
        borderWidth: 1,
        overflow: "hidden",
    },
    serviceImage: {
        width: 100,
        height: 80,
    },
    servicePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    servicePlaceholderText: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "700",
    },
    serviceInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
    serviceTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 6,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: "700",
        color: "#5050F0",
    },
    emptySection: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 32,
        alignItems: "center",
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        textAlign: "center",
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    createButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
    },
    addServiceButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        marginTop: 12,
    },
    addServiceText: {
        fontSize: 15,
        fontWeight: "600",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 14,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
