import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { inviteService } from '@/services/inviteService';
import { FirestoreInvite } from '@/types/firebase';

interface SpaceSwitcherProps {
  onInvitesPress: () => void;
  onSignInPress?: () => void;
}

export function SpaceSwitcher({ onInvitesPress, onSignInPress }: SpaceSwitcherProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );
  const {
    sharingEnabled,
    currentSpaceId,
    availableSpaces,
    switchSpace,
    getCurrentSpaceInfo,
    isOwnSpace,
    enableSharing,
    disableSharing,
  } = useSync();

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;
  const currentSpace = getCurrentSpaceInfo();

  // Subscribe to pending invites count (only if sharing is enabled)
  useEffect(() => {
    if (!user?.email || !sharingEnabled) {
      setPendingInvitesCount(0);
      return;
    }

    const unsubscribe = inviteService.subscribeToPendingInvites(
      user.email,
      (invites: FirestoreInvite[]) => {
        setPendingInvitesCount(invites.length);
      }
    );

    return () => unsubscribe();
  }, [user?.email, sharingEnabled]);

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Pressable
          style={[
            styles.notLoggedIn,
            { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
          ]}
          onPress={onSignInPress}
        >
          <IconSymbol
            name="person.crop.circle.badge.questionmark"
            size={24}
            color={darkMode ? '#666' : '#999'}
          />
          <Text
            style={[
              styles.notLoggedInText,
              { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' },
            ]}
          >
            Sign in to enable sharing
          </Text>
        </Pressable>
      </View>
    );
  }

  // Authenticated but sharing not enabled - show enable button
  if (!sharingEnabled) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.localMode,
            { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
          ]}
        >
          <View style={styles.localModeInfo}>
            <IconSymbol
              name="iphone"
              size={20}
              color={darkMode ? '#666' : '#999'}
            />
            <View style={styles.localModeText}>
              <Text
                style={[
                  styles.localModeTitle,
                  { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
                ]}
              >
                Local Mode
              </Text>
              <Text
                style={[
                  styles.localModeSubtitle,
                  { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' },
                ]}
              >
                Your lists are stored on this device only
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.enableButton, { backgroundColor: themeColor }]}
          onPress={enableSharing}
        >
          <IconSymbol name="icloud.fill" size={20} color="#fff" />
          <Text style={[styles.enableButtonText, { fontSize: fontSizeValue }]}>
            Enable Sharing & Sync
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.helpText,
            { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' },
          ]}
        >
          Enable sharing to sync your lists across devices and share with family or friends.
        </Text>
      </View>
    );
  }

  // Sharing enabled - show full space switcher
  const handleSpaceSelect = (spaceId: string) => {
    switchSpace(spaceId);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.currentSpace,
          { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.spaceInfo}>
          <IconSymbol
            name={isOwnSpace() ? 'person.fill' : 'person.2.fill'}
            size={20}
            color={themeColor}
          />
          <View style={styles.spaceTextContainer}>
            <Text
              style={[
                styles.spaceLabel,
                { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' },
              ]}
            >
              Current Space
            </Text>
            <Text
              style={[
                styles.spaceName,
                { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' },
              ]}
            >
              {isOwnSpace()
                ? 'My Space'
                : currentSpace?.ownerDisplayName
                ? `${currentSpace.ownerDisplayName}'s Space`
                : 'Unknown Space'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {pendingInvitesCount > 0 && (
            <TouchableOpacity
              style={[styles.badge, { backgroundColor: themeColor }]}
              onPress={onInvitesPress}
            >
              <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
            </TouchableOpacity>
          )}
          <IconSymbol
            name="chevron.down"
            size={16}
            color={darkMode ? '#666' : '#999'}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
          ]}
          onPress={() => router.push('/share-space')}
        >
          <IconSymbol name="person.badge.plus" size={18} color={themeColor} />
          <Text
            style={[
              styles.actionButtonText,
              { fontSize: fontSizeValue - 2, color: darkMode ? '#fff' : '#333' },
            ]}
          >
            Share My Space
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
          ]}
          onPress={onInvitesPress}
        >
          <IconSymbol name="envelope.fill" size={18} color={themeColor} />
          <Text
            style={[
              styles.actionButtonText,
              { fontSize: fontSizeValue - 2, color: darkMode ? '#fff' : '#333' },
            ]}
          >
            Invites
          </Text>
          {pendingInvitesCount > 0 && (
            <View style={[styles.smallBadge, { backgroundColor: themeColor }]}>
              <Text style={styles.smallBadgeText}>{pendingInvitesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.disableLink}
        onPress={disableSharing}
      >
        <Text
          style={[
            styles.disableLinkText,
            { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' },
          ]}
        >
          Disable sharing & sync
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: darkMode ? '#1a1a1a' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontSize: fontSizeValue + 4, color: darkMode ? '#fff' : '#333' },
                ]}
              >
                Switch Space
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={28}
                  color={darkMode ? '#666' : '#999'}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableSpaces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.spaceItem,
                    { backgroundColor: darkMode ? '#222' : '#f9f9f9' },
                    currentSpaceId === item.id && {
                      borderColor: themeColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => handleSpaceSelect(item.id)}
                >
                  <IconSymbol
                    name={item.isOwner ? 'person.fill' : 'person.2.fill'}
                    size={24}
                    color={currentSpaceId === item.id ? themeColor : darkMode ? '#666' : '#999'}
                  />
                  <View style={styles.spaceItemText}>
                    <Text
                      style={[
                        styles.spaceItemName,
                        {
                          fontSize: fontSizeValue,
                          color: darkMode ? '#fff' : '#333',
                        },
                      ]}
                    >
                      {item.isOwner ? 'My Space' : `${item.ownerDisplayName}'s Space`}
                    </Text>
                    <Text
                      style={[
                        styles.spaceItemEmail,
                        {
                          fontSize: fontSizeValue - 2,
                          color: darkMode ? '#666' : '#999',
                        },
                      ]}
                    >
                      {item.ownerEmail}
                    </Text>
                  </View>
                  {currentSpaceId === item.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={themeColor} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text
                    style={[
                      styles.emptyText,
                      { fontSize: fontSizeValue, color: darkMode ? '#666' : '#999' },
                    ]}
                  >
                    No spaces available
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  notLoggedIn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  notLoggedInText: {},
  localMode: {
    padding: 16,
    borderRadius: 12,
  },
  localModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  localModeText: {},
  localModeTitle: {
    fontWeight: '600',
  },
  localModeSubtitle: {},
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpText: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  currentSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  spaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spaceTextContainer: {},
  spaceLabel: {},
  spaceName: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontWeight: '500',
  },
  smallBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  smallBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  disableLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  disableLinkText: {
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '600',
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  spaceItemText: {
    flex: 1,
  },
  spaceItemName: {
    fontWeight: '500',
  },
  spaceItemEmail: {},
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {},
});
