import React from 'react';
import { Modal } from 'react-native';
import { RecipeScanner } from './recipe-scanner';
import { ScanResult } from '@/services/recipeScannerService';

interface RecipeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (result: ScanResult) => void;
}

export function RecipeScannerModal({
  visible,
  onClose,
  onScanComplete,
}: RecipeScannerModalProps) {
  const handleScanComplete = (result: ScanResult) => {
    onScanComplete(result);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <RecipeScanner onScanComplete={handleScanComplete} onClose={onClose} />
    </Modal>
  );
}
