# Firebase Real-Time List Sharing Implementation Plan

## Overview

Implement real-time list sharing for a React Native Expo pantry/shopping list app using Firebase (Firestore + Authentication). Users should be able to share lists with others and see changes in real-time.

## Current App Context

- React Native app built with Expo
- Uses Redux Toolkit for state management (`@/store/slices/itemsSlice`, `@/store/slices/settingsSlice`)
- Has two list types: "pantry" and "shopping"
- Items have: `id`, `name`, `quantity`, `unit`, `category`, and list-specific metadata
- Categories are customizable per user

---

## Phase 1: Firebase Setup

### 1.1 Install Dependencies

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore expo-build-properties
```

### 1.2 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project (e.g., "pantry-app")
3. Enable Firestore Database (start in test mode, we'll add rules later)
4. Enable Authentication → Sign-in methods → Email/Password and Anonymous
5. Add Android app (package name from `app.json`)
6. Add iOS app (bundle ID from `app.json`)
7. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### 1.3 Configure Expo

Create/update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 1.4 Create Firebase Config File

Create `@/services/firebase.ts`:

```typescript
import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export { firebase, auth, firestore };
```

---

## Phase 2: Data Model Design

### 2.1 Firestore Collections Structure

```
users/
  {userId}/
    email: string
    displayName: string
    createdAt: timestamp
    
lists/
  {listId}/
    name: string
    type: "pantry" | "shopping"
    ownerId: string
    memberIds: string[]
    createdAt: timestamp
    updatedAt: timestamp
    
lists/{listId}/items/
  {itemId}/
    name: string
    quantity: string
    unit: string
    category: string
    checked: boolean
    addedBy: string
    createdAt: timestamp
    updatedAt: timestamp
    pantryMetadata?: {
      expirationDate?: number
    }
    shoppingMetadata?: {
      price?: number
    }

lists/{listId}/members/
  {memberId}/
    userId: string
    email: string
    role: "owner" | "editor" | "viewer"
    joinedAt: timestamp

invites/
  {inviteCode}/
    listId: string
    listName: string
    createdBy: string
    createdAt: timestamp
    expiresAt: timestamp
```

### 2.2 Create TypeScript Types

Create `@/types/firebase.ts`:

```typescript
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface FirestoreUser {
  email: string;
  displayName: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface FirestoreList {
  id?: string;
  name: string;
  type: 'pantry' | 'shopping';
  ownerId: string;
  memberIds: string[];
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface FirestoreItem {
  id?: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
  addedBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  pantryMetadata?: {
    expirationDate?: number;
  };
  shoppingMetadata?: {
    price?: number;
  };
}

export interface FirestoreListMember {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface FirestoreInvite {
  listId: string;
  listName: string;
  createdBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  expiresAt: FirebaseFirestoreTypes.Timestamp;
}
```

---

## Phase 3: Authentication

### 3.1 Create Auth Service

Create `@/services/authService.ts`:

```typescript
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const authService = {
  // Get current user
  getCurrentUser: (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
    return auth().onAuthStateChanged(callback);
  },

  // Sign up with email/password
  signUp: async (email: string, password: string, displayName: string) => {
    const credential = await auth().createUserWithEmailAndPassword(email, password);
    
    // Update display name
    await credential.user.updateProfile({ displayName });
    
    // Create user document
    await firestore().collection('users').doc(credential.user.uid).set({
      email,
      displayName,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    
    return credential.user;
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return credential.user;
  },

  // Sign in anonymously (for trying the app)
  signInAnonymously: async () => {
    const credential = await auth().signInAnonymously();
    return credential.user;
  },

  // Convert anonymous account to permanent
  linkAnonymousAccount: async (email: string, password: string) => {
    const credential = auth.EmailAuthProvider.credential(email, password);
    const user = auth().currentUser;
    if (user) {
      await user.linkWithCredential(credential);
      await firestore().collection('users').doc(user.uid).set({
        email,
        displayName: email.split('@')[0],
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  },

  // Sign out
  signOut: async () => {
    await auth().signOut();
  },

  // Reset password
  resetPassword: async (email: string) => {
    await auth().sendPasswordResetEmail(email);
  },
};
```

### 3.2 Create Auth Context

Create `@/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    await authService.signUp(email, password, displayName);
  };

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
  };

  const signInAnonymously = async () => {
    await authService.signInAnonymously();
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInAnonymously,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.3 Create Auth Screens

Create the following screens in `@/app/(auth)/`:

1. `login.tsx` - Email/password sign in
2. `signup.tsx` - Create account
3. `forgot-password.tsx` - Password reset

Basic structure for `login.tsx`:

```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ChopText } from '@/components/chop-text';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInAnonymously } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... UI implementation
  );
}
```

---

## Phase 4: List Service

### 4.1 Create List Service

Create `@/services/listService.ts`:

```typescript
import firestore from '@react-native-firebase/firestore';
import { FirestoreList, FirestoreItem, FirestoreListMember } from '@/types/firebase';

const listsCollection = firestore().collection('lists');

export const listService = {
  // Create a new list
  createList: async (
    userId: string,
    name: string,
    type: 'pantry' | 'shopping'
  ): Promise<string> => {
    const listRef = await listsCollection.add({
      name,
      type,
      ownerId: userId,
      memberIds: [userId],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Add owner as member
    await listRef.collection('members').doc(userId).set({
      userId,
      email: '', // Will be filled from auth
      role: 'owner',
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });

    return listRef.id;
  },

  // Get all lists for a user
  getUserLists: (userId: string) => {
    return listsCollection
      .where('memberIds', 'array-contains', userId)
      .orderBy('updatedAt', 'desc');
  },

  // Subscribe to a list
  subscribeToList: (
    listId: string,
    callback: (list: FirestoreList | null) => void
  ) => {
    return listsCollection.doc(listId).onSnapshot((doc) => {
      if (doc.exists) {
        callback({ id: doc.id, ...doc.data() } as FirestoreList);
      } else {
        callback(null);
      }
    });
  },

  // Subscribe to list items
  subscribeToListItems: (
    listId: string,
    callback: (items: FirestoreItem[]) => void
  ) => {
    return listsCollection
      .doc(listId)
      .collection('items')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreItem[];
        callback(items);
      });
  },

  // Add item to list
  addItem: async (listId: string, item: Omit<FirestoreItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const itemRef = await listsCollection.doc(listId).collection('items').add({
      ...item,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update list's updatedAt
    await listsCollection.doc(listId).update({
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return itemRef.id;
  },

  // Update item
  updateItem: async (listId: string, itemId: string, updates: Partial<FirestoreItem>) => {
    await listsCollection.doc(listId).collection('items').doc(itemId).update({
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await listsCollection.doc(listId).update({
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Delete item
  deleteItem: async (listId: string, itemId: string) => {
    await listsCollection.doc(listId).collection('items').doc(itemId).delete();

    await listsCollection.doc(listId).update({
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Toggle item checked status
  toggleItemChecked: async (listId: string, itemId: string, checked: boolean) => {
    await listsCollection.doc(listId).collection('items').doc(itemId).update({
      checked,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Delete list
  deleteList: async (listId: string) => {
    // Delete all items first
    const itemsSnapshot = await listsCollection.doc(listId).collection('items').get();
    const batch = firestore().batch();
    itemsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    
    // Delete all members
    const membersSnapshot = await listsCollection.doc(listId).collection('members').get();
    membersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    
    // Delete the list itself
    batch.delete(listsCollection.doc(listId));
    
    await batch.commit();
  },

  // Get list members
  subscribeToListMembers: (
    listId: string,
    callback: (members: FirestoreListMember[]) => void
  ) => {
    return listsCollection
      .doc(listId)
      .collection('members')
      .onSnapshot((snapshot) => {
        const members = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as FirestoreListMember[];
        callback(members);
      });
  },
};
```

### 4.2 Create Invite Service

Create `@/services/inviteService.ts`:

```typescript
import firestore from '@react-native-firebase/firestore';
import { FirestoreInvite } from '@/types/firebase';

const invitesCollection = firestore().collection('invites');
const listsCollection = firestore().collection('lists');

// Generate a short invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const inviteService = {
  // Create an invite link for a list
  createInvite: async (listId: string, listName: string, createdBy: string): Promise<string> => {
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await invitesCollection.doc(code).set({
      listId,
      listName,
      createdBy,
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
    });

    return code;
  },

  // Get invite details
  getInvite: async (code: string): Promise<FirestoreInvite | null> => {
    const doc = await invitesCollection.doc(code.toUpperCase()).get();
    if (!doc.exists) return null;
    
    const invite = doc.data() as FirestoreInvite;
    
    // Check if expired
    if (invite.expiresAt.toDate() < new Date()) {
      await invitesCollection.doc(code).delete();
      return null;
    }
    
    return invite;
  },

  // Accept an invite
  acceptInvite: async (code: string, userId: string, userEmail: string): Promise<string> => {
    const invite = await inviteService.getInvite(code);
    if (!invite) {
      throw new Error('Invalid or expired invite code');
    }

    const listRef = listsCollection.doc(invite.listId);
    const listDoc = await listRef.get();
    
    if (!listDoc.exists) {
      throw new Error('List no longer exists');
    }

    // Add user to memberIds array
    await listRef.update({
      memberIds: firestore.FieldValue.arrayUnion(userId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Add member document
    await listRef.collection('members').doc(userId).set({
      userId,
      email: userEmail,
      role: 'editor',
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });

    return invite.listId;
  },

  // Remove a member from a list
  removeMember: async (listId: string, userId: string) => {
    const listRef = listsCollection.doc(listId);
    
    await listRef.update({
      memberIds: firestore.FieldValue.arrayRemove(userId),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await listRef.collection('members').doc(userId).delete();
  },

  // Leave a list
  leaveList: async (listId: string, userId: string) => {
    const listDoc = await listsCollection.doc(listId).get();
    const list = listDoc.data();
    
    if (list?.ownerId === userId) {
      throw new Error('Owner cannot leave the list. Transfer ownership or delete the list.');
    }

    await inviteService.removeMember(listId, userId);
  },
};
```

---

## Phase 5: Redux Integration

### 5.1 Create Sync Slice

Create `@/store/slices/syncSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  currentListId: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
}

const initialState: SyncState = {
  currentListId: null,
  isOnline: true,
  isSyncing: false,
  lastSyncedAt: null,
  pendingChanges: 0,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setCurrentListId: (state, action: PayloadAction<string | null>) => {
      state.currentListId = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSyncedAt: (state, action: PayloadAction<number>) => {
      state.lastSyncedAt = action.payload;
    },
    setPendingChanges: (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
    },
  },
});

export const {
  setCurrentListId,
  setOnlineStatus,
  setSyncing,
  setLastSyncedAt,
  setPendingChanges,
} = syncSlice.actions;

export default syncSlice.reducer;
```

### 5.2 Create Lists Slice

Create `@/store/slices/listsSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FirestoreList, FirestoreListMember } from '@/types/firebase';

interface ListWithMembers extends FirestoreList {
  members?: FirestoreListMember[];
}

interface ListsState {
  lists: ListWithMembers[];
  loading: boolean;
  error: string | null;
}

const initialState: ListsState = {
  lists: [],
  loading: true,
  error: null,
};

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    setLists: (state, action: PayloadAction<ListWithMembers[]>) => {
      state.lists = action.payload;
      state.loading = false;
    },
    addList: (state, action: PayloadAction<ListWithMembers>) => {
      state.lists.unshift(action.payload);
    },
    updateList: (state, action: PayloadAction<ListWithMembers>) => {
      const index = state.lists.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    },
    removeList: (state, action: PayloadAction<string>) => {
      state.lists = state.lists.filter((l) => l.id !== action.payload);
    },
    setListMembers: (
      state,
      action: PayloadAction<{ listId: string; members: FirestoreListMember[] }>
    ) => {
      const list = state.lists.find((l) => l.id === action.payload.listId);
      if (list) {
        list.members = action.payload.members;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLists,
  addList,
  updateList,
  removeList,
  setListMembers,
  setLoading,
  setError,
} = listsSlice.actions;

export default listsSlice.reducer;
```

### 5.3 Update Store Configuration

Update `@/store/index.ts` to include new slices:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import itemsReducer from './slices/itemsSlice';
import settingsReducer from './slices/settingsSlice';
import syncReducer from './slices/syncSlice';
import listsReducer from './slices/listsSlice';

export const store = configureStore({
  reducer: {
    items: itemsReducer,
    settings: settingsReducer,
    sync: syncReducer,
    lists: listsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase Timestamp objects
        ignoredActions: ['lists/setLists', 'lists/addList', 'lists/updateList'],
        ignoredPaths: ['lists.lists'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## Phase 6: Sync Hook

### 6.1 Create useListSync Hook

Create `@/hooks/useListSync.ts`:

```typescript
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { listService } from '@/services/listService';
import { setLists, setListMembers, setLoading } from '@/store/slices/listsSlice';
import {
  setItems,
  addItem,
  updateItem,
  removeItem,
} from '@/store/slices/itemsSlice';
import { setCurrentListId, setSyncing } from '@/store/slices/syncSlice';
import { FirestoreItem, FirestoreList } from '@/types/firebase';

export function useListSync() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const currentListId = useAppSelector((state) => state.sync.currentListId);

  // Subscribe to user's lists
  useEffect(() => {
    if (!user) {
      dispatch(setLists([]));
      return;
    }

    dispatch(setLoading(true));

    const unsubscribe = listService
      .getUserLists(user.uid)
      .onSnapshot((snapshot) => {
        const lists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreList[];
        dispatch(setLists(lists));
      });

    return () => unsubscribe();
  }, [user, dispatch]);

  // Subscribe to current list's items
  useEffect(() => {
    if (!currentListId) return;

    dispatch(setSyncing(true));

    const unsubscribe = listService.subscribeToListItems(
      currentListId,
      (items) => {
        // Convert Firestore items to your app's item format
        const convertedItems = items.map(convertFirestoreItemToLocal);
        dispatch(setItems({ listType: 'current', items: convertedItems }));
        dispatch(setSyncing(false));
      }
    );

    return () => unsubscribe();
  }, [currentListId, dispatch]);

  // Subscribe to current list's members
  useEffect(() => {
    if (!currentListId) return;

    const unsubscribe = listService.subscribeToListMembers(
      currentListId,
      (members) => {
        dispatch(setListMembers({ listId: currentListId, members }));
      }
    );

    return () => unsubscribe();
  }, [currentListId, dispatch]);

  // Helper to convert Firestore item to local format
  const convertFirestoreItemToLocal = (item: FirestoreItem) => {
    return {
      id: item.id!,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: item.checked,
      // Add other fields as needed
    };
  };

  // Actions
  const selectList = useCallback(
    (listId: string) => {
      dispatch(setCurrentListId(listId));
    },
    [dispatch]
  );

  const createList = useCallback(
    async (name: string, type: 'pantry' | 'shopping') => {
      if (!user) throw new Error('Not authenticated');
      const listId = await listService.createList(user.uid, name, type);
      return listId;
    },
    [user]
  );

  const addItemToList = useCallback(
    async (item: Omit<FirestoreItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!currentListId || !user) return;
      await listService.addItem(currentListId, {
        ...item,
        addedBy: user.uid,
      });
    },
    [currentListId, user]
  );

  const updateItemInList = useCallback(
    async (itemId: string, updates: Partial<FirestoreItem>) => {
      if (!currentListId) return;
      await listService.updateItem(currentListId, itemId, updates);
    },
    [currentListId]
  );

  const deleteItemFromList = useCallback(
    async (itemId: string) => {
      if (!currentListId) return;
      await listService.deleteItem(currentListId, itemId);
    },
    [currentListId]
  );

  const toggleItemChecked = useCallback(
    async (itemId: string, checked: boolean) => {
      if (!currentListId) return;
      await listService.toggleItemChecked(currentListId, itemId, checked);
    },
    [currentListId]
  );

  return {
    selectList,
    createList,
    addItemToList,
    updateItemInList,
    deleteItemFromList,
    toggleItemChecked,
  };
}
```

---

## Phase 7: UI Components

### 7.1 List Selector Component

Create `@/components/ListSelector.tsx`:

```typescript
import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useListSync } from '@/hooks/useListSync';
import { ChopText } from './chop-text';

interface ListSelectorProps {
  type?: 'pantry' | 'shopping';
}

export function ListSelector({ type }: ListSelectorProps) {
  const lists = useAppSelector((state) => state.lists.lists);
  const currentListId = useAppSelector((state) => state.sync.currentListId);
  const { selectList } = useListSync();

  const filteredLists = type ? lists.filter((l) => l.type === type) : lists;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {filteredLists.map((list) => (
        <TouchableOpacity
          key={list.id}
          style={[
            styles.listChip,
            currentListId === list.id && styles.selectedChip,
          ]}
          onPress={() => selectList(list.id!)}
        >
          <ChopText
            size="small"
            weight={currentListId === list.id ? 'bold' : 'normal'}
          >
            {list.name}
          </ChopText>
          {list.memberIds.length > 1 && (
            <ChopText size="xs" variant="muted">
              {list.memberIds.length} members
            </ChopText>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#007AFF',
  },
});
```

### 7.2 Share List Modal

Create `@/components/ShareListModal.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { inviteService } from '@/services/inviteService';
import { ChopText } from './chop-text';

interface ShareListModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
}

export function ShareListModal({
  visible,
  onClose,
  listId,
  listName,
}: ShareListModalProps) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const code = await inviteService.createInvite(listId, listName, user.uid);
      setInviteCode(code);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join my ${listName} list on Pantry App! Use code: ${inviteCode}`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ChopText size="xl" weight="bold">
            Share List
          </ChopText>
          
          {!inviteCode ? (
            <TouchableOpacity
              style={styles.button}
              onPress={generateInvite}
              disabled={loading}
            >
              <ChopText size="medium" color="#fff">
                {loading ? 'Generating...' : 'Generate Invite Code'}
              </ChopText>
            </TouchableOpacity>
          ) : (
            <View style={styles.codeContainer}>
              <ChopText size="xs" variant="muted">
                Share this code:
              </ChopText>
              <ChopText size="xxl" weight="bold" style={styles.code}>
                {inviteCode}
              </ChopText>
              <ChopText size="xs" variant="muted">
                Expires in 7 days
              </ChopText>
              <TouchableOpacity style={styles.button} onPress={shareInvite}>
                <ChopText size="medium" color="#fff">
                  Share
                </ChopText>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={onClose}>
            <ChopText size="medium" variant="muted">
              Close
            </ChopText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  codeContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  code: {
    letterSpacing: 4,
    marginVertical: 8,
  },
});
```

### 7.3 Join List Modal

Create `@/components/JoinListModal.tsx`:

```typescript
import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { inviteService } from '@/services/inviteService';
import { useListSync } from '@/hooks/useListSync';
import { ChopText } from './chop-text';

interface JoinListModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinListModal({ visible, onClose }: JoinListModalProps) {
  const { user } = useAuth();
  const { selectList } = useListSync();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    
    setLoading(true);
    try {
      const listId = await inviteService.acceptInvite(
        code.trim().toUpperCase(),
        user.uid,
        user.email || ''
      );
      selectList(listId);
      onClose();
      Alert.alert('Success', 'You have joined the list!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ChopText size="xl" weight="bold">
            Join a List
          </ChopText>
          
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="Enter invite code"
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.button, !code.trim() && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={loading || !code.trim()}
          >
            <ChopText size="medium" color="#fff">
              {loading ? 'Joining...' : 'Join List'}
            </ChopText>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <ChopText size="medium" variant="muted">
              Cancel
            </ChopText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
```

---

## Phase 8: Firestore Security Rules

### 8.1 Set Up Security Rules

In Firebase Console → Firestore → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Lists - users can read/write if they're a member
    match /lists/{listId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.memberIds;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid in resource.data.memberIds;
      
      // Items subcollection
      match /items/{itemId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.memberIds;
      }
      
      // Members subcollection
      match /members/{memberId} {
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.memberIds;
        allow write: if request.auth != null && 
          (request.auth.uid == get(/databases/$(database)/documents/lists/$(listId)).data.ownerId ||
           request.auth.uid == memberId);
      }
    }
    
    // Invites - anyone authenticated can read, only creator can write
    match /invites/{inviteCode} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
  }
}
```

---

## Phase 9: Migration Strategy

### 9.1 Create Migration Utility

Create `@/utils/migration.ts` to migrate existing local data to Firebase:

```typescript
import { store } from '@/store';
import { listService } from '@/services/listService';
import { authService } from '@/services/authService';

export async function migrateLocalDataToFirebase() {
  const user = authService.getCurrentUser();
  if (!user) return;

  const state = store.getState();
  
  // Get local items
  const localPantryItems = Object.values(state.items.items).filter(
    (item) => item.lists.pantry
  );
  const localShoppingItems = Object.values(state.items.items).filter(
    (item) => item.lists.shopping
  );

  // Create default lists if user has local data
  if (localPantryItems.length > 0) {
    const pantryListId = await listService.createList(user.uid, 'My Pantry', 'pantry');
    
    for (const item of localPantryItems) {
      await listService.addItem(pantryListId, {
        name: item.name,
        quantity: item.lists.pantry?.quantity || item.quantity,
        unit: item.lists.pantry?.unit || item.unit || '',
        category: item.category,
        checked: false,
        addedBy: user.uid,
        pantryMetadata: {
          expirationDate: item.lists.pantry?.expirationDate,
        },
      });
    }
  }

  if (localShoppingItems.length > 0) {
    const shoppingListId = await listService.createList(user.uid, 'My Shopping List', 'shopping');
    
    for (const item of localShoppingItems) {
      await listService.addItem(shoppingListId, {
        name: item.name,
        quantity: item.lists.shopping?.quantity || item.quantity,
        unit: item.lists.shopping?.unit || item.unit || '',
        category: item.category,
        checked: item.lists.shopping?.checked || false,
        addedBy: user.uid,
      });
    }
  }
}
```

---

## Phase 10: Testing Checklist

### Manual Testing

1. **Authentication**
   - [ ] Sign up with email/password
   - [ ] Sign in with existing account
   - [ ] Sign in anonymously
   - [ ] Sign out
   - [ ] Password reset email

2. **Lists**
   - [ ] Create new pantry list
   - [ ] Create new shopping list
   - [ ] Switch between lists
   - [ ] Delete a list

3. **Items**
   - [ ] Add item to list
   - [ ] Edit item
   - [ ] Delete item
   - [ ] Toggle checked status
   - [ ] Changes appear in real-time

4. **Sharing**
   - [ ] Generate invite code
   - [ ] Share invite code
   - [ ] Join list with invite code
   - [ ] See other users' changes in real-time
   - [ ] Leave a shared list

5. **Offline**
   - [ ] Add items while offline
   - [ ] Changes sync when back online
   - [ ] App shows offline indicator

6. **Migration**
   - [ ] Existing local data migrates to Firebase
   - [ ] No duplicate items after migration

---

## File Structure Summary

```
@/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   └── (tabs)/
│       └── ... existing tabs
├── components/
│   ├── ListSelector.tsx
│   ├── ShareListModal.tsx
│   ├── JoinListModal.tsx
│   └── ... existing components
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useListSync.ts
├── services/
│   ├── firebase.ts
│   ├── authService.ts
│   ├── listService.ts
│   └── inviteService.ts
├── store/
│   ├── index.ts (updated)
│   └── slices/
│       ├── itemsSlice.ts (existing)
│       ├── settingsSlice.ts (existing)
│       ├── syncSlice.ts (new)
│       └── listsSlice.ts (new)
├── types/
│   └── firebase.ts
└── utils/
    └── migration.ts
```

---

## Implementation Order

1. **Phase 1** - Firebase setup and configuration
2. **Phase 2** - Type definitions
3. **Phase 3** - Authentication (service, context, screens)
4. **Phase 4** - List and invite services
5. **Phase 5** - Redux slices
6. **Phase 6** - Sync hook
7. **Phase 7** - UI components
8. **Phase 8** - Security rules
9. **Phase 9** - Migration utility
10. **Phase 10** - Testing

Execute each phase completely before moving to the next. Test each phase independently where possible.
