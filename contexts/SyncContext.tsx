import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { syncService } from '@/services/syncService';
import { spaceService } from '@/services/spaceService';
import { setAllItems, Item } from '@/store/slices/itemsSlice';
import { setAllRecipes, Recipe } from '@/store/slices/recipesSlice';
import {
  setCurrentSpaceId,
  setAvailableSpaces,
  setSyncStatus,
  setSharingEnabled,
  SyncStatus,
} from '@/store/slices/settingsSlice';
import { AvailableSpace } from '@/types/firebase';
import { pushLocalDataToFirebase } from '@/utils/dataMigration';
import { setSyncingFromFirebase } from '@/store/middleware/syncMiddleware';

interface SyncContextType {
  isSyncing: boolean;
  syncStatus: SyncStatus;
  sharingEnabled: boolean;
  currentSpaceId: string | null;
  availableSpaces: AvailableSpace[];
  switchSpace: (spaceId: string) => void;
  isOwnSpace: () => boolean;
  getCurrentSpaceInfo: () => AvailableSpace | null;
  enableSharing: () => Promise<void>;
  disableSharing: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const sharingEnabled = useAppSelector((state) => state.settings.sharingEnabled);
  const currentSpaceId = useAppSelector((state) => state.settings.currentSpaceId);
  const availableSpaces = useAppSelector((state) => state.settings.availableSpaces);
  const syncStatus = useAppSelector((state) => state.settings.syncStatus);

  const isInitializedRef = useRef(false);

  // Initialize sync service once on mount (synchronously before other effects)
  if (!isInitializedRef.current) {
    syncService.initialize({
      onItemsUpdate: (items: Item[]) => {
        // Prevent middleware from re-pushing items that just came from Firebase
        setSyncingFromFirebase(true);
        dispatch(setAllItems(items));
        dispatch(setSyncStatus('synced'));
        // Use setTimeout to ensure the dispatch completes before re-enabling
        setTimeout(() => {
          setSyncingFromFirebase(false);
        }, 100);
      },
      onRecipesUpdate: (recipes: Recipe[]) => {
        // Prevent middleware from re-pushing recipes that just came from Firebase
        setSyncingFromFirebase(true);
        dispatch(setAllRecipes(recipes));
        // Use setTimeout to ensure the dispatch completes before re-enabling
        setTimeout(() => {
          setSyncingFromFirebase(false);
        }, 100);
      },
      onSpacesUpdate: (spaces: AvailableSpace[]) => {
        dispatch(setAvailableSpaces(spaces));
      },
    });
    isInitializedRef.current = true;
  }

  // Handle auth and sharing state changes
  useEffect(() => {
    // Only sync if sharing is explicitly enabled AND user is authenticated
    if (sharingEnabled && isAuthenticated && user) {
      syncService.setUser(user.uid);

      // Set to user's own space if not set
      if (!currentSpaceId) {
        dispatch(setCurrentSpaceId(user.uid));
      }
    } else {
      // Stop syncing and clear user
      syncService.setUser(null);
      syncService.stopSync();

      // If sharing was disabled or user logged out, go back to local mode
      if (!sharingEnabled) {
        dispatch(setSyncStatus('local'));
      }
    }
  }, [sharingEnabled, isAuthenticated, user, currentSpaceId, dispatch]);

  // Start/stop sync when space changes (only if sharing is enabled)
  useEffect(() => {
    if (sharingEnabled && currentSpaceId && isAuthenticated) {
      dispatch(setSyncStatus('syncing'));
      syncService.startSync(currentSpaceId);
    } else {
      syncService.stopSync();
      if (!sharingEnabled) {
        dispatch(setSyncStatus('local'));
      }
    }
  }, [currentSpaceId, isAuthenticated, sharingEnabled, dispatch]);

  // Handle when a shared space becomes paused - switch member back to their own space
  useEffect(() => {
    if (!sharingEnabled || !user || !currentSpaceId) return;

    // If viewing someone else's space
    if (currentSpaceId !== user.uid) {
      const currentSpace = availableSpaces.find((s) => s.id === currentSpaceId);

      // If that space is paused, switch back to own space
      if (currentSpace?.sharingPaused) {
        Alert.alert(
          'Space Paused',
          `${currentSpace.ownerDisplayName} has paused sharing. You've been switched back to your own space.`,
          [{ text: 'OK' }]
        );
        dispatch(setCurrentSpaceId(user.uid));
      }
    }
  }, [availableSpaces, currentSpaceId, user, sharingEnabled, dispatch]);

  // Enable sharing - pushes local data to Firebase (overwrites cloud data)
  const enableSharing = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to enable sharing and sync your lists.',
        [{ text: 'OK' }]
      );
      return;
    }

    dispatch(setSharingEnabled(true));
    dispatch(setCurrentSpaceId(user.uid));
    dispatch(setSyncStatus('syncing'));

    // Push local data to Firebase (clears cloud first, then uploads local)
    try {
      const result = await pushLocalDataToFirebase();

      // Resume sharing on the space (mark as not paused)
      await spaceService.resumeSharing(user.uid);

      if (result.success && (result.itemsPushed > 0 || result.recipesPushed > 0)) {
        Alert.alert(
          'Sharing Enabled',
          `Your local lists have been synced to the cloud:\n\n` +
            `${result.itemsPushed} items\n` +
            `${result.recipesPushed} recipes\n\n` +
            `You can now share your lists with others.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sharing Enabled',
          'Your lists are now synced to the cloud. You can share them with others.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to push data:', error);
      Alert.alert(
        'Sharing Enabled',
        'Sharing is enabled but some data may not have synced. Changes will sync automatically.',
        [{ text: 'OK' }]
      );
    }
  };

  // Disable sharing - keeps data local only
  const disableSharing = () => {
    Alert.alert(
      'Disable Sharing?',
      'Your lists will no longer sync to the cloud. Local changes will stay on this device only.\n\nPeople viewing your space will be switched back to their own space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            // Pause sharing on the space so members can't modify it
            if (user) {
              try {
                await spaceService.pauseSharing(user.uid);
              } catch (error) {
                console.error('Failed to pause sharing:', error);
              }
            }

            syncService.stopSync();
            syncService.setUser(null);
            dispatch(setSharingEnabled(false));
            // setSharingEnabled(false) also resets currentSpaceId and syncStatus
          },
        },
      ]
    );
  };

  const switchSpace = (spaceId: string) => {
    if (spaceId !== currentSpaceId) {
      dispatch(setCurrentSpaceId(spaceId));
    }
  };

  const isOwnSpace = () => {
    if (!user || !currentSpaceId) return true;
    return currentSpaceId === user.uid;
  };

  const getCurrentSpaceInfo = (): AvailableSpace | null => {
    if (!currentSpaceId) return null;
    return availableSpaces.find((s) => s.id === currentSpaceId) || null;
  };

  return (
    <SyncContext.Provider
      value={{
        isSyncing: syncStatus === 'syncing',
        syncStatus,
        sharingEnabled,
        currentSpaceId,
        availableSpaces,
        switchSpace,
        isOwnSpace,
        getCurrentSpaceInfo,
        enableSharing,
        disableSharing,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
