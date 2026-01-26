import { initializeApp, getApps, getApp } from "@react-native-firebase/app";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import type { 
  Activity, 
  User, 
  Reel, 
  ActivityParticipant, 
  SavedActivity,
  CreateActivityForm,
  ActivityCategory 
} from "@/types";

// Firebase is auto-initialized from google-services.json / GoogleService-Info.plist
// No manual config needed with @react-native-firebase

// ============================================
// AUTH FUNCTIONS
// ============================================

export const firebaseAuth = {
  // Get current user
  getCurrentUser: (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
  },

  // Sign up with email/password
  signUp: async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
    return auth().createUserWithEmailAndPassword(email, password);
  },

  // Sign in with email/password
  signIn: async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
    return auth().signInWithEmailAndPassword(email, password);
  },

  // Sign out
  signOut: async (): Promise<void> => {
    return auth().signOut();
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
    return auth().onAuthStateChanged(callback);
  },

  // Send password reset email
  sendPasswordReset: async (email: string): Promise<void> => {
    return auth().sendPasswordResetEmail(email);
  },

  // Update profile
  updateProfile: async (displayName: string, photoURL?: string): Promise<void> => {
    const user = auth().currentUser;
    if (user) {
      await user.updateProfile({ displayName, photoURL });
    }
  },
};

// ============================================
// FIRESTORE REFERENCES
// ============================================

const db = firestore();

const collections = {
  users: db.collection("users"),
  activities: db.collection("activities"),
  reels: db.collection("reels"),
};

// ============================================
// USER FUNCTIONS
// ============================================

export const usersDb = {
  // Create user profile after signup
  create: async (userId: string, data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<void> => {
    await collections.users.doc(userId).set({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Get user by ID
  get: async (userId: string): Promise<User | null> => {
    const doc = await collections.users.doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  },

  // Update user profile
  update: async (userId: string, data: Partial<User>): Promise<void> => {
    await collections.users.doc(userId).update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Get user stats
  getStats: async (userId: string): Promise<{ hosted: number; joined: number; followers: number }> => {
    const [hostedSnap, joinedSnap] = await Promise.all([
      collections.activities.where("organizerId", "==", userId).get(),
      db.collectionGroup("participants").where("userId", "==", userId).get(),
    ]);
    
    return {
      hosted: hostedSnap.size,
      joined: joinedSnap.size,
      followers: 0, // TODO: Implement followers
    };
  },
};

// ============================================
// ACTIVITY FUNCTIONS
// ============================================

export const activitiesDb = {
  // Create activity
  create: async (data: CreateActivityForm, organizerId: string, imageUrls: string[]): Promise<string> => {
    const docRef = await collections.activities.add({
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      date: firestore.Timestamp.fromDate(new Date(data.date)),
      time: data.time,
      maxAttendees: parseInt(data.maxAttendees, 10),
      attendeeCount: 0,
      images: imageUrls,
      organizerId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  },

  // Get activity by ID
  get: async (activityId: string): Promise<Activity | null> => {
    const doc = await collections.activities.doc(activityId).get();
    if (!doc.exists) return null;
    
    const data = doc.data()!;
    const organizerDoc = await collections.users.doc(data.organizerId).get();
    const organizer = organizerDoc.data();
    
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      organizer: {
        id: data.organizerId,
        displayName: organizer?.displayName || "Unknown",
        avatarUrl: organizer?.avatarUrl || null,
      },
    } as Activity;
  },

  // Get all activities (feed)
  getAll: async (limit: number = 20): Promise<Activity[]> => {
    const snap = await collections.activities
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    
    const activities = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        const organizerDoc = await collections.users.doc(data.organizerId).get();
        const organizer = organizerDoc.data();
        
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          organizer: {
            id: data.organizerId,
            displayName: organizer?.displayName || "Unknown",
            avatarUrl: organizer?.avatarUrl || null,
          },
        } as Activity;
      })
    );
    
    return activities;
  },

  // Get activities by category
  getByCategory: async (category: ActivityCategory, limit: number = 20): Promise<Activity[]> => {
    const snap = await collections.activities
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    })) as Activity[];
  },

  // Get activities by user (hosted)
  getByUser: async (userId: string): Promise<Activity[]> => {
    const snap = await collections.activities
      .where("organizerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    })) as Activity[];
  },

  // Update activity
  update: async (activityId: string, data: Partial<Activity>): Promise<void> => {
    await collections.activities.doc(activityId).update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Delete activity
  delete: async (activityId: string): Promise<void> => {
    await collections.activities.doc(activityId).delete();
  },

  // Join activity
  join: async (activityId: string, userId: string): Promise<void> => {
    const batch = db.batch();
    
    // Add participant
    const participantRef = collections.activities
      .doc(activityId)
      .collection("participants")
      .doc(userId);
    
    batch.set(participantRef, {
      userId,
      joinedAt: firestore.FieldValue.serverTimestamp(),
      status: "confirmed",
    });
    
    // Increment attendee count
    const activityRef = collections.activities.doc(activityId);
    batch.update(activityRef, {
      attendeeCount: firestore.FieldValue.increment(1),
    });
    
    await batch.commit();
  },

  // Leave activity
  leave: async (activityId: string, userId: string): Promise<void> => {
    const batch = db.batch();
    
    // Remove participant
    const participantRef = collections.activities
      .doc(activityId)
      .collection("participants")
      .doc(userId);
    
    batch.delete(participantRef);
    
    // Decrement attendee count
    const activityRef = collections.activities.doc(activityId);
    batch.update(activityRef, {
      attendeeCount: firestore.FieldValue.increment(-1),
    });
    
    await batch.commit();
  },

  // Check if user has joined
  hasJoined: async (activityId: string, userId: string): Promise<boolean> => {
    const doc = await collections.activities
      .doc(activityId)
      .collection("participants")
      .doc(userId)
      .get();
    
    return doc.exists;
  },

  // Get participants
  getParticipants: async (activityId: string): Promise<ActivityParticipant[]> => {
    const snap = await collections.activities
      .doc(activityId)
      .collection("participants")
      .get();
    
    return snap.docs.map((doc) => ({
      id: doc.id,
      activityId,
      ...doc.data(),
    })) as ActivityParticipant[];
  },
};

// ============================================
// SAVED ACTIVITIES FUNCTIONS
// ============================================

export const savedDb = {
  // Save activity
  save: async (userId: string, activityId: string): Promise<void> => {
    await collections.users
      .doc(userId)
      .collection("saved")
      .doc(activityId)
      .set({
        activityId,
        savedAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  // Unsave activity
  unsave: async (userId: string, activityId: string): Promise<void> => {
    await collections.users
      .doc(userId)
      .collection("saved")
      .doc(activityId)
      .delete();
  },

  // Check if saved
  isSaved: async (userId: string, activityId: string): Promise<boolean> => {
    const doc = await collections.users
      .doc(userId)
      .collection("saved")
      .doc(activityId)
      .get();
    
    return doc.exists;
  },

  // Get all saved activities
  getAll: async (userId: string): Promise<Activity[]> => {
    const savedSnap = await collections.users
      .doc(userId)
      .collection("saved")
      .orderBy("savedAt", "desc")
      .get();
    
    const activityIds = savedSnap.docs.map((doc) => doc.data().activityId);
    
    if (activityIds.length === 0) return [];
    
    const activities = await Promise.all(
      activityIds.map((id) => activitiesDb.get(id))
    );
    
    return activities.filter((a): a is Activity => a !== null);
  },
};

// ============================================
// REELS FUNCTIONS
// ============================================

export const reelsDb = {
  // Create reel
  create: async (
    activityId: string,
    userId: string,
    videoUrl: string,
    thumbnailUrl: string,
    duration: number
  ): Promise<string> => {
    // Get activity info
    const activity = await activitiesDb.get(activityId);
    if (!activity) throw new Error("Activity not found");
    
    // Get user info
    const user = await usersDb.get(userId);
    if (!user) throw new Error("User not found");
    
    const docRef = await collections.reels.add({
      activityId,
      userId,
      videoUrl,
      thumbnailUrl,
      duration,
      viewCount: 0,
      activity: {
        id: activityId,
        title: activity.title,
        category: activity.category,
      },
      user: {
        id: userId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    
    return docRef.id;
  },

  // Get all reels
  getAll: async (limit: number = 20): Promise<Reel[]> => {
    const snap = await collections.reels
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Reel[];
  },

  // Increment view count
  incrementView: async (reelId: string): Promise<void> => {
    await collections.reels.doc(reelId).update({
      viewCount: firestore.FieldValue.increment(1),
    });
  },
};

// ============================================
// STORAGE FUNCTIONS
// ============================================

export const firebaseStorage = {
  // Upload activity image
  uploadActivityImage: async (
    activityId: string,
    imageUri: string,
    index: number
  ): Promise<string> => {
    const ref = storage().ref(`activities/${activityId}/image_${index}.jpg`);
    await ref.putFile(imageUri);
    return ref.getDownloadURL();
  },

  // Upload multiple activity images
  uploadActivityImages: async (
    activityId: string,
    imageUris: string[]
  ): Promise<string[]> => {
    return Promise.all(
      imageUris.map((uri, index) => 
        firebaseStorage.uploadActivityImage(activityId, uri, index)
      )
    );
  },

  // Upload reel video
  uploadReelVideo: async (reelId: string, videoUri: string): Promise<string> => {
    const ref = storage().ref(`reels/${reelId}/video.mp4`);
    await ref.putFile(videoUri);
    return ref.getDownloadURL();
  },

  // Upload reel thumbnail
  uploadReelThumbnail: async (reelId: string, thumbnailUri: string): Promise<string> => {
    const ref = storage().ref(`reels/${reelId}/thumbnail.jpg`);
    await ref.putFile(thumbnailUri);
    return ref.getDownloadURL();
  },

  // Upload user avatar
  uploadAvatar: async (userId: string, imageUri: string): Promise<string> => {
    const ref = storage().ref(`avatars/${userId}/avatar.jpg`);
    await ref.putFile(imageUri);
    return ref.getDownloadURL();
  },

  // Delete file
  deleteFile: async (path: string): Promise<void> => {
    await storage().ref(path).delete();
  },
};

export { auth, firestore, storage };
