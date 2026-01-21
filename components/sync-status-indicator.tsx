import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ChopText } from '@/components/chop-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSync } from '@/contexts/SyncContext';
import { useAppSelector } from '@/store/hooks';

interface SyncStatusIndicatorProps {
  showSpaceName?: boolean;
}

export function SyncStatusIndicator({ showSpaceName = true }: SyncStatusIndicatorProps) {
  const { syncStatus, sharingEnabled, getCurrentSpaceInfo, isOwnSpace } = useSync();
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  // Don't show anything if sharing is not enabled (local mode)
  if (!sharingEnabled) {
    return null;
  }

  const spaceInfo = getCurrentSpaceInfo();
  const isOwn = isOwnSpace();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <ActivityIndicator size="small" color={themeColor} />;
      case 'synced':
        return <IconSymbol name="checkmark.icloud" size={16} color="#34c759" />;
      case 'error':
        return <IconSymbol name="exclamationmark.icloud" size={16} color="#ff3b30" />;
      default:
        return <IconSymbol name="icloud.slash" size={16} color={darkMode ? '#666' : '#999'} />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync error';
      default:
        return 'Local';
    }
  };

  return (
    <View style={styles.container}>
      {showSpaceName && !isOwn && spaceInfo && (
        <View style={[styles.spaceBadge, { backgroundColor: themeColor + '20' }]}>
          <IconSymbol name="person.2.fill" size={12} color={themeColor} />
          <ChopText size="xs" weight="semibold" style={{ color: themeColor }}>
            {spaceInfo.ownerDisplayName}'s Space
          </ChopText>
        </View>
      )}
      <View style={styles.statusContainer}>
        {getStatusIcon()}
        <ChopText size="xs" variant="muted" style={styles.statusText}>
          {getStatusText()}
        </ChopText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    marginLeft: 2,
  },
});
