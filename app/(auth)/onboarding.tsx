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

import { useTranslation } from "@/lib/i18n";

const { width: W } = Dimensions.get("window");

// Matches Figma: layout.builder 0/1/2 — green, purple, orange


const BG = "#0b0b0f";
const SURFACE = "#151518";

export default function OnboardingScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Matches Figma: layout.builder 0/1/2 — green, purple, orange
    const slides = [
        {
            id: "1",
            headline: t("onboarding.slide1Title"),
            subtext: t("onboarding.slide1Sub"),
            buttonText: t("onboarding.slide1Btn"),
            gradientColors: ["#84cc16", "#65a30d", "#4d7c0f"] as const,
            accentColor: "#a3ff3f",
        },
        {
            id: "2",
            headline: t("onboarding.slide2Title"),
            subtext: t("onboarding.slide2Sub"),
            buttonText: t("onboarding.slide2Btn"),
            gradientColors: ["#a855f7", "#9333ea", "#7e22ce"] as const,
            accentColor: "#c084fc",
        },
        {
            id: "3",
            headline: t("onboarding.slide3Title"),
            subtext: t("onboarding.slide3Sub"),
            buttonText: t("onboarding.slide3Btn"),
            gradientColors: ["#f97316", "#ea580c", "#c2410c"] as const,
            accentColor: "#fb923c",
        },
    ];

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
            {/* Top colored section - fills 65% of screen */}
            <View style={{ flex: 0.65, width: "100%" }}>
                <LinearGradient
                    colors={item.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, width: "100%" }}
                />
            </View>

            {/* Bottom black section - fills remaining space with overlap look */}
            <View style={[styles.bottomSheet, { backgroundColor: SURFACE }]}>
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
            <View style={{ flex: 1 }}>
                {activeIndex < slides.length - 1 && (
                    <Pressable onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
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
                    initialNumToRender={1}
                />
            </View>

            {/* Dots + sign in - positioned absolute or within bottom sheet area? 
               Actually the design has the button inside the black area. 
               The dots usually sit below the button or are part of the bottom sheet.
               I'll put the dots inside the bottom sheet logic or overlay them.
               The previous code had a separate absolute bottom bar.
               Let's keep the dots overlaying the black section at the very bottom.
            */}
            <View style={styles.paginationContainer}>
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: SURFACE },
    skipButton: {
        position: "absolute", top: 60, right: 20, zIndex: 20,
        paddingVertical: 10, paddingHorizontal: 16,
    },
    skipText: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "600" },

    bottomSheet: {
        flex: 0.35,
        backgroundColor: SURFACE,
        paddingHorizontal: 32,
        paddingTop: 40,
        alignItems: "flex-start", // Left align text
    },
    headline: {
        color: "#FFFFFF", fontSize: 32, fontWeight: "800",
        marginBottom: 16, lineHeight: 40, textAlign: "left",
    },
    subtext: {
        color: "rgba(255,255,255,0.6)", fontSize: 16,
        lineHeight: 24, marginBottom: 32, textAlign: "left",
    },
    ctaButton: {
        width: "100%",
        paddingVertical: 18, borderRadius: 16, alignItems: "center",
        justifyContent: "center",
    },
    ctaText: { color: "#0b0b0f", fontSize: 16, fontWeight: "700" },

    paginationContainer: {
        position: "absolute", bottom: 40, left: 0, right: 0,
        alignItems: "center", justifyContent: "center",
    },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { height: 6, borderRadius: 3 },
});
