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

    // Create the user's space
    const spaceRef = firestore().collection('spaces').doc(credential.user.uid);
    await spaceRef.set({
      ownerId: credential.user.uid,
      ownerEmail: email,
      ownerDisplayName: displayName,
      memberIds: [credential.user.uid],
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Add owner as member of their own space
    await spaceRef.collection('members').doc(credential.user.uid).set({
      userId: credential.user.uid,
      email,
      displayName,
      role: 'owner',
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });

    return credential.user;
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return credential.user;
  },

  // Sign out
  signOut: async () => {
    await auth().signOut();
  },

  // Reset password
  resetPassword: async (email: string) => {
    await auth().sendPasswordResetEmail(email);
  },

  // Update user profile
  updateProfile: async (displayName: string) => {
    const user = auth().currentUser;
    if (user) {
      await user.updateProfile({ displayName });

      // Update user document
      await firestore().collection('users').doc(user.uid).update({
        displayName,
      });

      // Update space owner name if this is their space
      const spaceRef = firestore().collection('spaces').doc(user.uid);
      const spaceDoc = await spaceRef.get();
      if (spaceDoc.exists) {
        await spaceRef.update({
          ownerDisplayName: displayName,
        });
      }

      // Update member entry
      await spaceRef.collection('members').doc(user.uid).update({
        displayName,
      });
    }
  },

  // Get user ID
  getUserId: (): string | null => {
    return auth().currentUser?.uid || null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return auth().currentUser !== null;
  },
};
