import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  gradient: [string, string, string];
  icon: React.ReactNode;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Hire Top Talent',
    description: 'Connect with elite freelancers and creative professionals worldwide. Build your dream team today.',
    gradient: ['#84cc16', '#65a30d', '#4d7c0f'],
    icon: '💼',
  },
  {
    id: '2',
    title: 'Trusted Platform',
    description: 'Secure payments, verified reviews, and professional escrow protection. Your peace of mind guaranteed.',
    gradient: ['#a855f7', '#9333ea', '#7e22ce'],
    icon: '🔒',
  },
  {
    id: '3',
    title: 'Build Your Empire',
    description: 'Scale your business with premium services. Join thousands of successful companies on Baysis.',
    gradient: ['#f97316', '#ea580c', '#c24a0c'],
    icon: '🚀',
  },
];

/**
 * OnboardingScreen - Carousel onboarding experience
 * 3 slides with gradient backgrounds and progress indicators
 */
export default function OnboardingScreen() {
  const c = useFigmaColors();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      // Navigate to sign in
      router.push('/(auth)/SignInScreen');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/SignInScreen');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    skipButton: {
      position: 'absolute',
      top: 56,
      right: 32,
      zIndex: 10,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: c.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      width,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 420,
    },
    imageContainer: {
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      overflow: 'hidden',
      marginBottom: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 60,
      elevation: 20,
    },
    imagePlaceholder: {
      width: 320,
      height: 420,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    pulseAnimation: {
      position: 'absolute',
    },
    contentContainer: {
      backgroundColor: c.surface,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      paddingHorizontal: 40,
      paddingTop: 48,
      paddingBottom: 48,
      alignItems: 'center',
    },
    title: {
      marginBottom: 20,
      textAlign: 'center',
    },
    description: {
      fontSize: 17,
      fontWeight: '500' as const,
      color: c.textSecondary,
      lineHeight: 27.625,
      marginBottom: 40,
      textAlign: 'center',
    },
    button: {
      width: '100%',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 40,
      marginBottom: 32,
    },
    dot: {
      height: 8,
      borderRadius: 9999,
      backgroundColor: c.textSecondary,
      opacity: 0.3,
    },
    activeDot: {
      width: 32,
      backgroundColor: '#ffffff',
      opacity: 1,
    },
    inactiveDot: {
      width: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Gradient Background */}
            <LinearGradient
              colors={slide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />

            {/* Image/Icon Container */}
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                {/* Animated pulse elements */}
                <View
                  style={[
                    styles.pulseAnimation,
                    {
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      top: 80,
                      left: 80,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pulseAnimation,
                    {
                      width: 192,
                      height: 192,
                      borderRadius: 96,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      bottom: 80,
                      right: 80,
                    },
                  ]}
                />
                {/* Icon Emoji */}
                <Text style={{ fontSize: 64 }}>{slide.icon}</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Typography variant="hero" style={styles.title}>
                {slide.title}
              </Typography>
              <Text style={styles.description}>{slide.description}</Text>
              <Button
                label="Continue"
                onPress={handleNext}
                style={styles.button}
                fullWidth
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Progress Indicators and Navigation */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
