import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { inviteService } from '@/services/inviteService';
import { spaceService } from '@/services/spaceService';
import { FirestoreInvite, FirestoreSpaceMember } from '@/types/firebase';

export default function ShareSpaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FirestoreSpaceMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<FirestoreInvite[]>([]);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;
  const spaceId = user?.uid;

  // Load members and pending invites
  useEffect(() => {
    if (!spaceId || !user) return;

    // Subscribe to members
    const unsubMembers = spaceService.subscribeToMembers(spaceId, setMembers);

    // Load pending invites
    const loadInvites = async () => {
      const invites = await inviteService.getSpaceInvites(spaceId, user.uid);
      setPendingInvites(invites);
    };
    loadInvites();

    return () => {
      unsubMembers();
    };
  }, [spaceId, user]);

  const handleSendInvite = async () => {
    if (!email.trim() || !user || !spaceId) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await inviteService.sendInvite(
        spaceId,
        user.uid,
        user.displayName || 'Unknown',
        email.trim()
      );

      // Refresh pending invites
      const invites = await inviteService.getSpaceInvites(spaceId, user.uid);
      setPendingInvites(invites);

      setEmail('');
      Alert.alert('Success', 'Invitation sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    Alert.alert(
      'Cancel Invite',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await inviteService.cancelInvite(inviteId);
              setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!spaceId) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from your space?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await spaceService.removeMember(spaceId, memberId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? '#000' : '#fff' },
      ]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={themeColor} />
          <Text style={[styles.backText, { color: themeColor, fontSize: fontSizeValue }]}>
            Settings
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.title,
            { fontSize: fontSizeValue + 4, color: darkMode ? '#fff' : '#333' },
          ]}
        >
          Share My Space
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
            ]}
          >
            Invite by Email
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: darkMode ? '#222' : '#f5f5f5' },
            ]}
          >
            <IconSymbol
              name="envelope.fill"
              size={20}
              color={darkMode ? '#666' : '#999'}
            />
            <TextInput
              style={[
                styles.input,
                { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
              ]}
              placeholder="Enter email address"
              placeholderTextColor={darkMode ? '#666' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: themeColor },
              loading && styles.sendButtonDisabled,
            ]}
            onPress={handleSendInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                <Text
                  style={[styles.sendButtonText, { fontSize: fontSizeValue }]}
                >
                  Send Invite
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
            ]}
          >
            Members ({members.length})
          </Text>
          <View style={styles.memberList}>
            {members.map((item) => (
              <View
                key={item.userId}
                style={[
                  styles.memberItem,
                  { backgroundColor: darkMode ? '#222' : '#f9f9f9' },
                ]}
              >
                <View style={styles.memberInfo}>
                  <IconSymbol
                    name={item.role === 'owner' ? 'crown.fill' : 'person.fill'}
                    size={20}
                    color={item.role === 'owner' ? '#FFD700' : themeColor}
                  />
                  <View style={styles.memberText}>
                    <Text
                      style={[
                        styles.memberName,
                        { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
                      ]}
                    >
                      {item.displayName}
                      {item.userId === user?.uid && ' (You)'}
                    </Text>
                    <Text
                      style={[
                        styles.memberEmail,
                        { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' },
                      ]}
                    >
                      {item.email}
                    </Text>
                  </View>
                </View>
                {item.role !== 'owner' && item.userId !== user?.uid && (
                  <TouchableOpacity
                    onPress={() =>
                      handleRemoveMember(item.userId, item.displayName)
                    }
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#ff3b30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {pendingInvites.length > 0 && (
          <View style={styles.listSection}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
              ]}
            >
              Pending Invites ({pendingInvites.length})
            </Text>
            <View style={styles.inviteList}>
              {pendingInvites.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.inviteItem,
                    { backgroundColor: darkMode ? '#222' : '#f9f9f9' },
                  ]}
                >
                  <View style={styles.inviteInfo}>
                    <IconSymbol
                      name="envelope.badge.fill"
                      size={20}
                      color={darkMode ? '#666' : '#999'}
                    />
                    <Text
                      style={[
                        styles.inviteEmail,
                        { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
                      ]}
                    >
                      {item.inviteeEmail}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCancelInvite(item.id!)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    fontWeight: '500',
    marginLeft: 4,
  },
  title: {
    fontWeight: '600',
    flex: 2,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listSection: {
    marginBottom: 20,
  },
  memberList: {},
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberText: {},
  memberName: {
    fontWeight: '500',
  },
  memberEmail: {},
  inviteList: {},
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  inviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inviteEmail: {},
});
