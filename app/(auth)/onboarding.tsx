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
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { ArrowRight, Sparkles, Users, Shield } from "lucide-react-native";

import { useThemeStore } from "@/lib/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
    id: string;
    renderIcon: (color: string) => React.ReactNode;
    iconBg: string;
    headline: string;
    headlineBold: string;
    subtext: string;
}

const slides: OnboardingSlide[] = [
    {
        id: "1",
        renderIcon: (color: string) => <Sparkles size={40} color={color} strokeWidth={1.5} />,
        iconBg: "rgba(17,17,17,0.06)",
        headline: "Welcome to",
        headlineBold: "BAYSIS",
        subtext: "Connect. Offer. Earn.\nThe premium marketplace for modern freelancers.",
    },
    {
        id: "2",
        renderIcon: (color: string) => <Users size={40} color={color} strokeWidth={1.5} />,
        iconBg: "rgba(17,17,17,0.06)",
        headline: "Offer Your",
        headlineBold: "Skills",
        subtext: "Showcase your talent through services and short-form reels that bring your work to life.",
    },
    {
        id: "3",
        renderIcon: (color: string) => <Shield size={40} color={color} strokeWidth={1.5} />,
        iconBg: "rgba(17,17,17,0.06)",
        headline: "Find Trusted",
        headlineBold: "Talent",
        subtext: "Discover vetted freelancers, browse their portfolio reels, and hire with confidence.",
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const bgColor = isDark ? "#121210" : "#F5F3EE";
    const textColor = isDark ? "#F5F3EE" : "#111111";
    const mutedColor = "#8E8E8A";
    const primaryBg = isDark ? "#F5F3EE" : "#111111";
    const primaryText = isDark ? "#111111" : "#F5F3EE";

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
        } else {
            router.replace("/(auth)/login");
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace("/(auth)/login");
    };

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const iconColor = isDark ? "#F5F3EE" : "#111111";

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
                {/* Abstract shape / icon area */}
                <Animated.View entering={FadeIn.delay(200).duration(600)}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : item.iconBg }]}>
                        <View style={[styles.iconInner, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(17,17,17,0.04)" }]}>
                            {item.renderIcon(iconColor)}
                        </View>
                    </View>
                </Animated.View>

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={[styles.headline, { color: mutedColor }]}>
                        {item.headline}
                    </Text>
                    <Text style={[styles.headlineBold, { color: textColor }]}>
                        {item.headlineBold}
                    </Text>
                    <Text style={[styles.subtext, { color: mutedColor }]}>
                        {item.subtext}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Skip button */}
                <View style={styles.topRow}>
                    <View />
                    {activeIndex < slides.length - 1 && (
                        <Pressable onPress={handleSkip} style={styles.skipButton}>
                            <Text style={[styles.skipText, { color: mutedColor }]}>Skip</Text>
                        </Pressable>
                    )}
                </View>

                {/* Slides */}
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
                />

                {/* Bottom area */}
                <View style={styles.bottomArea}>
                    {/* Dots */}
                    <View style={styles.dotsContainer}>
                        {slides.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === activeIndex
                                            ? textColor
                                            : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                                        width: i === activeIndex ? 24 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* CTA Button */}
                    <Pressable
                        onPress={handleNext}
                        style={[styles.ctaButton, { backgroundColor: primaryBg }]}
                    >
                        <Text style={[styles.ctaText, { color: primaryText }]}>
                            {activeIndex === slides.length - 1 ? "Get Started" : "Continue"}
                        </Text>
                        <ArrowRight size={20} color={primaryText} strokeWidth={2.5} />
                    </Pressable>

                    {/* Login link */}
                    <View style={styles.loginRow}>
                        <Text style={[styles.loginText, { color: mutedColor }]}>
                            Already have an account?{" "}
                        </Text>
                        <Pressable onPress={() => router.push("/(auth)/login")}>
                            <Text style={[styles.loginLink, { color: textColor }]}>Log in</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 8,
        height: 48,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipText: {
        fontSize: 16,
        fontWeight: "500",
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    slideContent: {
        alignItems: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 48,
    },
    iconInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        alignItems: "center",
    },
    headline: {
        fontSize: 32,
        fontWeight: "300",
        textAlign: "center",
        marginBottom: 4,
    },
    headlineBold: {
        fontSize: 40,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -1,
        marginBottom: 20,
    },
    subtext: {
        fontSize: 17,
        lineHeight: 26,
        textAlign: "center",
        maxWidth: 300,
    },
    bottomArea: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginBottom: 28,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    ctaButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 18,
        borderRadius: 20,
        marginBottom: 20,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: "700",
    },
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 8,
    },
    loginText: {
        fontSize: 15,
    },
    loginLink: {
        fontSize: 15,
        fontWeight: "700",
    },
});
