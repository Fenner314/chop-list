import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaceSync } from '@/hooks/useSpaceSync';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { inviteService } from '@/services/inviteService';
import { FirestoreInvite } from '@/types/firebase';

interface PendingInvitesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PendingInvitesModal({ visible, onClose }: PendingInvitesModalProps) {
  const { user } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );
  const { switchSpace } = useSpaceSync();

  const [invites, setInvites] = useState<FirestoreInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  // Subscribe to pending invites
  useEffect(() => {
    if (!visible || !user?.email) return;

    setLoading(true);
    const unsubscribe = inviteService.subscribeToPendingInvites(
      user.email,
      (pendingInvites: FirestoreInvite[]) => {
        setInvites(pendingInvites);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [visible, user?.email]);

  const handleAccept = async (invite: FirestoreInvite) => {
    if (!user || !invite.id) return;

    setProcessingId(invite.id);
    try {
      const spaceId = await inviteService.acceptInvite(
        invite.id,
        user.uid,
        user.email || '',
        user.displayName || 'Unknown'
      );

      Alert.alert(
        'Success',
        `You've joined ${invite.inviterDisplayName}'s space!`,
        [
          {
            text: 'Switch to Space',
            onPress: () => {
              switchSpace(spaceId);
              onClose();
            },
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    Alert.alert(
      'Decline Invite',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(inviteId);
            try {
              await inviteService.declineInvite(inviteId);
            } catch (error) {
              Alert.alert('Error', 'Failed to decline invitation');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            { backgroundColor: darkMode ? '#1a1a1a' : '#fff' },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { fontSize: fontSizeValue + 4, color: darkMode ? '#fff' : '#333' },
              ]}
            >
              Pending Invites
            </Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                name="xmark.circle.fill"
                size={28}
                color={darkMode ? '#666' : '#999'}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColor} />
            </View>
          ) : invites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="envelope.open"
                size={48}
                color={darkMode ? '#444' : '#ccc'}
              />
              <Text
                style={[
                  styles.emptyText,
                  { fontSize: fontSizeValue, color: darkMode ? '#666' : '#999' },
                ]}
              >
                No pending invites
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { fontSize: fontSizeValue - 2, color: darkMode ? '#555' : '#aaa' },
                ]}
              >
                When someone shares their space with you, it will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={invites}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.inviteCard,
                    { backgroundColor: darkMode ? '#222' : '#f9f9f9' },
                  ]}
                >
                  <View style={styles.inviteHeader}>
                    <IconSymbol
                      name="person.2.fill"
                      size={24}
                      color={themeColor}
                    />
                    <View style={styles.inviteInfo}>
                      <Text
                        style={[
                          styles.inviterName,
                          { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
                        ]}
                      >
                        {item.inviterDisplayName}
                      </Text>
                      <Text
                        style={[
                          styles.inviteMessage,
                          { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' },
                        ]}
                      >
                        wants to share their space with you
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inviteActions}>
                    <TouchableOpacity
                      style={[
                        styles.declineButton,
                        { borderColor: darkMode ? '#444' : '#ddd' },
                      ]}
                      onPress={() => handleDecline(item.id!)}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <ActivityIndicator size="small" color={darkMode ? '#999' : '#666'} />
                      ) : (
                        <Text
                          style={[
                            styles.declineButtonText,
                            { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' },
                          ]}
                        >
                          Decline
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.acceptButton, { backgroundColor: themeColor }]}
                      onPress={() => handleAccept(item)}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.acceptButtonText,
                            { fontSize: fontSizeValue - 2 },
                          ]}
                        >
                          Accept
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  inviteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  inviteInfo: {
    flex: 1,
  },
  inviterName: {
    fontWeight: '600',
  },
  inviteMessage: {},
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
