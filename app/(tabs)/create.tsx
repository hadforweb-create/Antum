import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  ImagePlus,
  Camera,
  Video as VideoIcon,
  X,
  Film,
  Type,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/store";
import { createReel } from "@/lib/api/reels";
import { uploadMedia, UploadProgress } from "@/lib/api/uploads";
import { colors } from "@/lib/theme";
import { toast } from "@/lib/ui/toast";
import type { MediaType } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Step = "media" | "details";

interface SelectedMedia {
  uri: string;
  type: MediaType;
  mimeType: string;
}

export default function CreateReelScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>("media");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Progress bar animation
  const progressWidth = useSharedValue(0);

  const pickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Permission to access gallery is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === "video";
      setSelectedMedia({
        uri: asset.uri,
        type: isVideo ? "VIDEO" : "IMAGE",
        mimeType: isVideo ? "video/mp4" : "image/jpeg",
      });
      setStep("details");
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.error("Permission to access camera is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({
        uri: asset.uri,
        type: "IMAGE",
        mimeType: "image/jpeg",
      });
      setStep("details");
    }
  };

  const recordVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.error("Permission to access camera is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 60,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedMedia({
        uri: asset.uri,
        type: "VIDEO",
        mimeType: "video/mp4",
      });
      setStep("details");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "details") {
      setStep("media");
      setSelectedMedia(null);
    }
  };

  const handlePost = async () => {
    if (!selectedMedia) {
      toast.error("Please select media");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    progressWidth.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Upload media with progress tracking
      const uploadResult = await uploadMedia(
        selectedMedia.uri,
        selectedMedia.mimeType,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
          progressWidth.value = withTiming(progress.percentage, { duration: 100 });
        }
      );

      // Create reel with uploaded media
      await createReel({
        mediaType: uploadResult.mediaType,
        mediaUrl: uploadResult.url,
        caption: caption || undefined,
      });

      // Reset form
      setSelectedMedia(null);
      setCaption("");
      setStep("media");
      setUploadProgress(0);
      progressWidth.value = 0;

      // Show success toast
      toast.success("Your reel is now live! 🎉");

      // Navigate after a short delay
      setTimeout(() => {
        router.push("/(tabs)");
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create reel";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Non-freelancer screen
  if (user?.role !== "FREELANCER") {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.restrictedContent}>
            <View style={styles.restrictedIconOuter}>
              <View style={styles.restrictedIconInner}>
                <Film size={36} color={colors.primary} strokeWidth={1.5} />
              </View>
            </View>
            <Text style={styles.restrictedTitle}>Creators Only</Text>
            <Text style={styles.restrictedText}>
              Switch to a freelancer account to create and share your portfolio reels
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {step !== "media" ? (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <X size={24} color="#FFF" strokeWidth={2} />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          <Text style={styles.headerTitle}>
            {step === "media" && "New Reel"}
            {step === "details" && "Add Details"}
          </Text>

          <View style={styles.backButton} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step === "media" && styles.progressDotActive]} />
          <View style={[styles.progressLine, step === "details" && styles.progressLineActive]} />
          <View style={[styles.progressDot, step === "details" && styles.progressDotActive]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          {/* Step 1: Media Selection */}
          {step === "media" && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.mediaStep}>
              <Text style={styles.mediaTitle}>Choose your media</Text>
              <Text style={styles.mediaSubtitle}>Share a video or image to showcase your work</Text>

              <View style={styles.mediaOptions}>
                <Pressable style={styles.mediaOption} onPress={pickFromGallery}>
                  <View style={styles.mediaOptionIcon}>
                    <ImagePlus size={32} color={colors.primary} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.mediaOptionTitle}>Gallery</Text>
                  <Text style={styles.mediaOptionDesc}>Pick from your photos</Text>
                </Pressable>

                <Pressable style={styles.mediaOption} onPress={recordVideo}>
                  <View style={styles.mediaOptionIcon}>
                    <VideoIcon size={32} color={colors.primary} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.mediaOptionTitle}>Record Video</Text>
                  <Text style={styles.mediaOptionDesc}>Up to 60 seconds</Text>
                </Pressable>

                <Pressable style={styles.mediaOption} onPress={takePhoto}>
                  <View style={styles.mediaOptionIcon}>
                    <Camera size={32} color={colors.primary} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.mediaOptionTitle}>Take Photo</Text>
                  <Text style={styles.mediaOptionDesc}>Capture now</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Step 2: Preview + Caption */}
          {step === "details" && selectedMedia && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.detailsStep}>
              {/* Media Preview */}
              <View style={styles.previewContainer}>
                {selectedMedia.type === "VIDEO" ? (
                  <Video
                    source={{ uri: selectedMedia.uri }}
                    style={styles.preview}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                  />
                ) : (
                  <Image source={{ uri: selectedMedia.uri }} style={styles.preview} />
                )}
                <View style={styles.mediaTypeBadge}>
                  <Text style={styles.mediaTypeBadgeText}>
                    {selectedMedia.type === "VIDEO" ? "📹 Video" : "📷 Photo"}
                  </Text>
                </View>
              </View>

              {/* Caption Input */}
              <View style={styles.captionSection}>
                <View style={styles.inputIconContainer}>
                  <Type size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption (optional)..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  maxLength={300}
                />
              </View>
              <Text style={styles.charCount}>{caption.length}/300</Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>

        {/* Post button with upload progress */}
        {step === "details" && (
          <View style={styles.postButtonContainer}>
            {uploading && (
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
                <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
              </View>
            )}
            <PostButton
              onPress={handlePost}
              loading={uploading}
              disabled={!selectedMedia}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function PostButton({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading || disabled}
    >
      <Animated.View
        style={[
          animatedStyle,
          styles.postButton,
          (loading || disabled) && styles.postButtonDisabled,
        ]}
      >
        <Film size={20} color="#FFF" strokeWidth={2.5} />
        <Text style={styles.postButtonText}>
          {loading ? "Uploading..." : "Post Reel"}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  // Media step styles
  mediaStep: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  mediaTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  mediaSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginBottom: 40,
  },
  mediaOptions: {
    gap: 16,
  },
  mediaOption: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(80, 80, 240, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  mediaOptionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  mediaOptionDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
  // Details step styles
  detailsStep: {
    flex: 1,
    paddingHorizontal: 24,
  },
  previewContainer: {
    height: SCREEN_HEIGHT * 0.45,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  mediaTypeBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mediaTypeBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  captionSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(80, 80, 240, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  captionInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  // Post button styles
  postButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  uploadProgressText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  // Restricted screen
  restrictedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  restrictedContent: {
    alignItems: "center",
  },
  restrictedIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(80, 80, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  restrictedIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(80, 80, 240, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  restrictedTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  restrictedText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
