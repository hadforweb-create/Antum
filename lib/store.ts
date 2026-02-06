import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, Activity, Reel, LoadingState, AppError } from "@/types";

// ============================================
// AUTH STORE
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        error: null,
      }),
    }),
    {
      name: "nightout-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ============================================
// ACTIVITIES STORE
// ============================================

interface ActivitiesState {
  activities: Activity[];
  currentActivity: Activity | null;
  loadingState: LoadingState;
  error: AppError | null;
  
  // Joined activities (user has joined)
  joinedActivityIds: Set<string>;
  
  // Saved activities (user has bookmarked)
  savedActivityIds: Set<string>;
  
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  setCurrentActivity: (activity: Activity | null) => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: AppError | null) => void;
  
  // Join/Leave
  markAsJoined: (activityId: string) => void;
  markAsLeft: (activityId: string) => void;
  isJoined: (activityId: string) => boolean;
  
  // Save/Unsave
  markAsSaved: (activityId: string) => void;
  markAsUnsaved: (activityId: string) => void;
  isSaved: (activityId: string) => boolean;
  
  // Clear
  clearActivities: () => void;
}

export const useActivitiesStore = create<ActivitiesState>()((set, get) => ({
  activities: [],
  currentActivity: null,
  loadingState: "idle",
  error: null,
  joinedActivityIds: new Set(),
  savedActivityIds: new Set(),
  
  setActivities: (activities) => set({ activities, loadingState: "success" }),
  
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities],
  })),
  
  updateActivity: (id, data) => set((state) => ({
    activities: state.activities.map((a) =>
      a.id === id ? { ...a, ...data } : a
    ),
    currentActivity: state.currentActivity?.id === id 
      ? { ...state.currentActivity, ...data }
      : state.currentActivity,
  })),
  
  removeActivity: (id) => set((state) => ({
    activities: state.activities.filter((a) => a.id !== id),
  })),
  
  setCurrentActivity: (activity) => set({ currentActivity: activity }),
  
  setLoadingState: (loadingState) => set({ loadingState }),
  
  setError: (error) => set({ error, loadingState: "error" }),
  
  // Join/Leave
  markAsJoined: (activityId) => set((state) => {
    const newSet = new Set(state.joinedActivityIds);
    newSet.add(activityId);
    return { joinedActivityIds: newSet };
  }),
  
  markAsLeft: (activityId) => set((state) => {
    const newSet = new Set(state.joinedActivityIds);
    newSet.delete(activityId);
    return { joinedActivityIds: newSet };
  }),
  
  isJoined: (activityId) => get().joinedActivityIds.has(activityId),
  
  // Save/Unsave
  markAsSaved: (activityId) => set((state) => {
    const newSet = new Set(state.savedActivityIds);
    newSet.add(activityId);
    return { savedActivityIds: newSet };
  }),
  
  markAsUnsaved: (activityId) => set((state) => {
    const newSet = new Set(state.savedActivityIds);
    newSet.delete(activityId);
    return { savedActivityIds: newSet };
  }),
  
  isSaved: (activityId) => get().savedActivityIds.has(activityId),
  
  clearActivities: () => set({ 
    activities: [], 
    currentActivity: null,
    joinedActivityIds: new Set(),
    savedActivityIds: new Set(),
  }),
}));

// ============================================
// REELS STORE
// ============================================

interface ReelsState {
  reels: Reel[];
  currentIndex: number;
  loadingState: LoadingState;
  error: AppError | null;

  setReels: (reels: Reel[]) => void;
  addReel: (reel: Reel) => void;
  setCurrentIndex: (index: number) => void;
  nextReel: () => void;
  prevReel: () => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: AppError | null) => void;
  clearReels: () => void;
}

export const useReelsStore = create<ReelsState>()((set, get) => ({
  reels: [],
  currentIndex: 0,
  loadingState: "idle",
  error: null,
  
  setReels: (reels) => set({ reels, loadingState: "success" }),
  
  addReel: (reel) => set((state) => ({
    reels: [reel, ...state.reels],
  })),
  
  setCurrentIndex: (index) => set({ currentIndex: index }),
  
  nextReel: () => set((state) => ({
    currentIndex: Math.min(state.currentIndex + 1, state.reels.length - 1),
  })),
  
  prevReel: () => set((state) => ({
    currentIndex: Math.max(state.currentIndex - 1, 0),
  })),

  setLoadingState: (loadingState) => set({ loadingState }),

  setError: (error) => set({ error, loadingState: "error" }),

  clearReels: () => set({ reels: [], currentIndex: 0, loadingState: "idle" }),
}));

// ============================================
// THEME STORE
// ============================================

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      isDark: false,
      
      setMode: (mode) => set({ 
        mode,
        isDark: mode === "dark",
      }),
      
      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === "dark" ? "light" : "dark";
        set({ mode: newMode, isDark: newMode === "dark" });
      },
    }),
    {
      name: "nightout-theme",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// UI STORE (for modals, sheets, etc.)
// ============================================

interface UIState {
  isCreateActivityOpen: boolean;
  isCreateReelOpen: boolean;
  isActivityDetailOpen: boolean;
  selectedActivityId: string | null;
  
  openCreateActivity: () => void;
  closeCreateActivity: () => void;
  openCreateReel: () => void;
  closeCreateReel: () => void;
  openActivityDetail: (activityId: string) => void;
  closeActivityDetail: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isCreateActivityOpen: false,
  isCreateReelOpen: false,
  isActivityDetailOpen: false,
  selectedActivityId: null,

  openCreateActivity: () => set({ isCreateActivityOpen: true }),
  closeCreateActivity: () => set({ isCreateActivityOpen: false }),

  openCreateReel: () => set({ isCreateReelOpen: true }),
  closeCreateReel: () => set({ isCreateReelOpen: false }),

  openActivityDetail: (activityId) => set({
    isActivityDetailOpen: true,
    selectedActivityId: activityId,
  }),
  closeActivityDetail: () => set({
    isActivityDetailOpen: false,
    selectedActivityId: null,
  }),
}));

// ============================================
// SKILLS STORE
// ============================================

interface Skill {
  id: string;
  name: string;
  slug: string;
}

interface SkillsState {
  skills: Skill[];
  loadingState: LoadingState;
  error: AppError | null;

  setSkills: (skills: Skill[]) => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: AppError | null) => void;
}

export const useSkillsStore = create<SkillsState>()((set) => ({
  skills: [],
  loadingState: "idle",
  error: null,

  setSkills: (skills) => set({ skills, loadingState: "success" }),
  setLoadingState: (loadingState) => set({ loadingState }),
  setError: (error) => set({ error, loadingState: "error" }),
}));

// ============================================
// SHORTLIST STORE
// ============================================

interface ShortlistState {
  shortlistIds: Set<string>;
  loadingState: LoadingState;
  error: AppError | null;

  addToShortlist: (freelancerId: string) => void;
  removeFromShortlist: (freelancerId: string) => void;
  isShortlisted: (freelancerId: string) => boolean;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: AppError | null) => void;
}

export const useShortlistStore = create<ShortlistState>()((set, get) => ({
  shortlistIds: new Set(),
  loadingState: "idle",
  error: null,

  addToShortlist: (freelancerId) => set((state) => {
    const newSet = new Set(state.shortlistIds);
    newSet.add(freelancerId);
    return { shortlistIds: newSet };
  }),

  removeFromShortlist: (freelancerId) => set((state) => {
    const newSet = new Set(state.shortlistIds);
    newSet.delete(freelancerId);
    return { shortlistIds: newSet };
  }),

  isShortlisted: (freelancerId) => get().shortlistIds.has(freelancerId),

  setLoadingState: (loadingState) => set({ loadingState }),
  setError: (error) => set({ error, loadingState: "error" }),
}));
