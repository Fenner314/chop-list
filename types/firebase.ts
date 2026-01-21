import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// User document in /users/{userId}
export interface FirestoreUser {
  email: string;
  displayName: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

// Space document in /spaces/{spaceId}
export interface FirestoreSpace {
  id?: string;
  ownerId: string;
  ownerEmail: string;
  ownerDisplayName: string;
  memberIds: string[];
  createdAt: FirebaseFirestoreTypes.Timestamp;
  // When true, the owner has disabled sharing - members should be read-only
  sharingPaused?: boolean;
}

// Member document in /spaces/{spaceId}/members/{userId}
export interface FirestoreSpaceMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'editor';
  joinedAt: FirebaseFirestoreTypes.Timestamp;
}

// Item document in /spaces/{spaceId}/items/{itemId}
// Mirrors the local Item interface
export interface FirestoreItem {
  id?: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  shoppingPreferences?: {
    quantity: string;
    unit?: string;
  };
  lists: {
    pantry?: {
      expirationDate?: number;
      addedDate: number;
      order: number;
      quantity?: string;
      unit?: string;
    };
    shopping?: {
      completed: boolean;
      createdAt: number;
      order: number;
      quantity?: string;
      unit?: string;
    };
  };
  // Sync metadata
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
  updatedBy?: string;
}

// Recipe document in /spaces/{spaceId}/recipes/{recipeId}
export interface FirestoreRecipe {
  id?: string;
  name: string;
  description?: string;
  servings: number;
  ingredients: FirestoreRecipeIngredient[];
  instructions?: string[];
  createdAt: number;
  updatedAt: number;
  // Sync metadata
  syncUpdatedAt?: FirebaseFirestoreTypes.Timestamp;
  updatedBy?: string;
}

export interface FirestoreRecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category?: string;
}

// Invite document in /invites/{inviteId}
export interface FirestoreInvite {
  id?: string;
  spaceId: string;
  inviterUserId: string;
  inviterDisplayName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

// Available space info for UI
export interface AvailableSpace {
  id: string;
  ownerDisplayName: string;
  ownerEmail: string;
  isOwner: boolean;
  sharingPaused?: boolean;
}
