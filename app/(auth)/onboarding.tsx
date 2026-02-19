import { useState, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Dimensions,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width: W } = Dimensions.get("window");

// Matches Figma: layout.builder 0/1/2 — green, purple, orange
const slides = [
    {
        id: "1",
        headline: "Hire Top Talent",
        subtext: "Connect with elite freelancers and creative professionals worldwide. Build your dream team today.",
        buttonText: "Continue",
        gradientColors: ["#84cc16", "#65a30d", "#4d7c0f"] as const,
        accentColor: "#a3ff3f",
    },
    {
        id: "2",
        headline: "Trusted Platform",
        subtext: "Secure payments, verified reviews, and professional escrow protection. Your peace of mind guaranteed.",
        buttonText: "Continue",
        gradientColors: ["#a855f7", "#9333ea", "#7e22ce"] as const,
        accentColor: "#c084fc",
    },
    {
        id: "3",
        headline: "Build Your Empire",
        subtext: "Scale your business with premium services. Join thousands of successful companies on Baysis.",
        buttonText: "Get Started",
        gradientColors: ["#f97316", "#ea580c", "#c2410c"] as const,
        accentColor: "#fb923c",
    },
];

const BG = "#0b0b0f";
const SURFACE = "#151518";

export default function OnboardingScreen() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        } else {
            router.replace("/(auth)/login");
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace("/(auth)/login");
    };

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / W);
        if (index !== activeIndex && index >= 0 && index < slides.length) {
            setActiveIndex(index);
        }
    };

    const renderSlide = ({ item }: { item: typeof slides[0] }) => (
        <View style={{ width: W, flex: 1 }}>
            {/* Large gradient card fills top 60% */}
            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={item.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCard}
                >
                    <View style={styles.glowTop} />
                    <View style={styles.glowBottom} />
                    <View style={styles.shapeOuter}>
                        <View style={styles.shapeInner} />
                    </View>
                </LinearGradient>
            </View>

            {/* Bottom content panel */}
            <View style={[styles.textCard, { backgroundColor: SURFACE }]}>
                <Text style={styles.headline}>{item.headline}</Text>
                <Text style={styles.subtext}>{item.subtext}</Text>
                <Pressable
                    onPress={handleNext}
                    style={[styles.ctaButton, { backgroundColor: item.accentColor }]}
                >
                    <Text style={styles.ctaText}>{item.buttonText}</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                {activeIndex < slides.length - 1 && (
                    <Pressable onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip</Text>
                    </Pressable>
                )}
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    bounces={false}
                    style={{ flex: 1 }}
                />
            </SafeAreaView>

            {/* Dots + sign in */}
            <View style={[styles.bottomBar, { backgroundColor: SURFACE }]}>
                <View style={styles.dotsRow}>
                    {slides.map((s, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === activeIndex
                                        ? slides[activeIndex].accentColor
                                        : "rgba(255,255,255,0.15)",
                                    width: i === activeIndex ? 24 : 7,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Pressable onPress={() => router.push("/(auth)/login")} style={styles.signinRow}>
                    <Text style={styles.signinPrompt}>Already have an account? </Text>
                    <Text style={[styles.signinLink, { color: slides[activeIndex].accentColor }]}>
                        Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    skipButton: {
        position: "absolute", top: 0, right: 20, zIndex: 20,
        paddingVertical: 10, paddingHorizontal: 16,
    },
    skipText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" },
    cardWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 0 },
    gradientCard: {
        flex: 1, borderRadius: 40, overflow: "hidden",
        justifyContent: "center", alignItems: "center",
    },
    glowTop: {
        position: "absolute", top: -50, left: -50,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    glowBottom: {
        position: "absolute", bottom: -60, right: -50,
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: "rgba(0,0,0,0.15)",
    },
    shapeOuter: {
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center", alignItems: "center",
    },
    shapeInner: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    textCard: {
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 28, paddingTop: 28, paddingBottom: 16,
        marginTop: -28,
    },
    headline: {
        color: "#FFFFFF", fontSize: 36, fontWeight: "900",
        letterSpacing: -0.8, marginBottom: 12, lineHeight: 42,
    },
    subtext: {
        color: "rgba(255,255,255,0.6)", fontSize: 16,
        lineHeight: 24, marginBottom: 28,
    },
    ctaButton: {
        paddingVertical: 18, borderRadius: 18, alignItems: "center",
        shadowColor: "#a3ff3f", shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
    },
    ctaText: { color: "#0b0b0f", fontSize: 17, fontWeight: "800" },
    bottomBar: {
        paddingHorizontal: 28, paddingBottom: 40, paddingTop: 16,
        alignItems: "center", gap: 16,
    },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { height: 7, borderRadius: 4 },
    signinRow: { flexDirection: "row", alignItems: "center" },
    signinPrompt: { color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: "500" },
    signinLink: { fontSize: 15, fontWeight: "700" },
});
