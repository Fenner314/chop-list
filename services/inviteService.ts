import firestore from '@react-native-firebase/firestore';
import { FirestoreInvite } from '@/types/firebase';

const invitesCollection = firestore().collection('invites');
const spacesCollection = firestore().collection('spaces');

export const inviteService = {
  // Send an invite to a user by email
  sendInvite: async (
    spaceId: string,
    inviterUserId: string,
    inviterDisplayName: string,
    inviteeEmail: string
  ): Promise<string> => {
    // Normalize email
    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    // Check if we already sent an invite to this email for this space
    // We filter by inviterUserId to only check our own invites (security rules only allow this)
    const existingInvite = await invitesCollection
      .where('spaceId', '==', spaceId)
      .where('inviteeEmail', '==', normalizedEmail)
      .where('inviterUserId', '==', inviterUserId)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvite.empty) {
      throw new Error('An invite has already been sent to this email');
    }

    // Check if the space exists (the inviter should be a member)
    const spaceDoc = await spacesCollection.doc(spaceId).get();
    if (!spaceDoc.exists) {
      throw new Error('Space not found');
    }

    // Note: We can't check if the invitee is already a member from the client
    // because we can't query the users collection for other users' data.
    // This will be handled when they try to accept - if already a member,
    // the space update will be a no-op.

    // Create the invite
    const inviteRef = await invitesCollection.add({
      spaceId,
      inviterUserId,
      inviterDisplayName,
      inviteeEmail: normalizedEmail,
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return inviteRef.id;
  },

  // Get pending invites for a user (by email)
  getPendingInvites: async (email: string): Promise<FirestoreInvite[]> => {
    const normalizedEmail = email.toLowerCase().trim();

    const snapshot = await invitesCollection
      .where('inviteeEmail', '==', normalizedEmail)
      .where('status', '==', 'pending')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreInvite[];
  },

  // Subscribe to pending invites for a user
  subscribeToPendingInvites: (
    email: string,
    callback: (invites: FirestoreInvite[]) => void
  ) => {
    const normalizedEmail = email.toLowerCase().trim();

    return invitesCollection
      .where('inviteeEmail', '==', normalizedEmail)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        const invites = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirestoreInvite[];
        callback(invites);
      });
  },

  // Accept an invite
  acceptInvite: async (
    inviteId: string,
    userId: string,
    userEmail: string,
    userDisplayName: string
  ): Promise<string> => {
    const inviteDoc = await invitesCollection.doc(inviteId).get();

    if (!inviteDoc.exists) {
      throw new Error('Invite not found');
    }

    const invite = inviteDoc.data() as FirestoreInvite;

    if (invite.status !== 'pending') {
      throw new Error('This invite is no longer valid');
    }

    // Verify the email matches
    if (invite.inviteeEmail !== userEmail.toLowerCase().trim()) {
      throw new Error('This invite is for a different email address');
    }

    const spaceRef = spacesCollection.doc(invite.spaceId);

    // Add user to space memberIds
    // Note: We can't read the space doc first (permission denied for non-members)
    // If the space was deleted, this update will fail silently or throw
    try {
      await spaceRef.update({
        memberIds: firestore.FieldValue.arrayUnion(userId),
      });
    } catch (error: any) {
      // If space doesn't exist or update fails, mark invite as declined
      if (error.code === 'firestore/not-found') {
        await invitesCollection.doc(inviteId).update({ status: 'declined' });
        throw new Error('The space no longer exists');
      }
      throw error;
    }

    // Add user to space members subcollection
    await spaceRef.collection('members').doc(userId).set({
      userId,
      email: userEmail,
      displayName: userDisplayName,
      role: 'editor',
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update invite status
    await invitesCollection.doc(inviteId).update({
      status: 'accepted',
    });

    return invite.spaceId;
  },

  // Decline an invite
  declineInvite: async (inviteId: string): Promise<void> => {
    await invitesCollection.doc(inviteId).update({
      status: 'declined',
    });
  },

  // Get invites sent from a space (for viewing pending invites as owner)
  getSpaceInvites: async (spaceId: string, inviterUserId: string): Promise<FirestoreInvite[]> => {
    const snapshot = await invitesCollection
      .where('spaceId', '==', spaceId)
      .where('inviterUserId', '==', inviterUserId)
      .where('status', '==', 'pending')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreInvite[];
  },

  // Cancel a pending invite (as the inviter)
  cancelInvite: async (inviteId: string): Promise<void> => {
    await invitesCollection.doc(inviteId).delete();
  },
};
