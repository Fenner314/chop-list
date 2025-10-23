import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setThemeColor, setFontSize, setDarkMode } from '@/store/slices/settingsSlice';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);
  const { themeColor, fontSize, darkMode } = settings;

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  const themeColors = [
    { name: 'Blue', value: '#007AFF' },
    { name: 'Green', value: '#34C759' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Orange', value: '#FF9500' },
    { name: 'Purple', value: '#AF52DE' },
    { name: 'Pink', value: '#FF2D55' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
      <Text style={[styles.mainTitle, { fontSize: fontSizeValue + 8, color: themeColor }]}>
        Settings
      </Text>

      <View style={[styles.section, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSizeValue + 2, color: darkMode ? '#fff' : '#333' }]}>
          General Settings
        </Text>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={(value) => dispatch(setDarkMode(value))}
            trackColor={{ false: '#767577', true: themeColor }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>Theme Color</Text>
        </View>
        <View style={styles.colorPickerContainer}>
          {themeColors.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorButton,
                { backgroundColor: color.value },
                themeColor === color.value && { borderColor: darkMode ? '#fff' : '#000', borderWidth: 3 },
              ]}
              onPress={() => dispatch(setThemeColor(color.value))}
            >
              {themeColor === color.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>Font Size</Text>
        </View>
        <View style={styles.fontSizeContainer}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.fontSizeButton,
                { backgroundColor: darkMode ? '#222' : '#f0f0f0' },
                fontSize === size && { backgroundColor: themeColor },
              ]}
              onPress={() => dispatch(setFontSize(size))}
            >
              <Text
                style={[
                  styles.fontSizeText,
                  { fontSize: fontSizeValue - 2, color: darkMode ? '#fff' : '#333' },
                  fontSize === size && styles.selectedFontSizeText,
                ]}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSizeValue + 2, color: darkMode ? '#fff' : '#333' }]}>
          Feature Settings
        </Text>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={[styles.settingButtonText, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>
            Shopping List Settings
          </Text>
          <Text style={[styles.arrow, { color: darkMode ? '#666' : '#999' }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={[styles.settingButtonText, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>
            Pantry List Settings
          </Text>
          <Text style={[styles.arrow, { color: darkMode ? '#666' : '#999' }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={[styles.settingButtonText, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>
            Recipes Settings
          </Text>
          <Text style={[styles.arrow, { color: darkMode ? '#666' : '#999' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={[styles.sectionTitle, { fontSize: fontSizeValue + 2, color: darkMode ? '#fff' : '#333' }]}>
          Account
        </Text>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={[styles.settingButtonText, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#333' }]}>
            Account Settings
          </Text>
          <Text style={[styles.arrow, { color: darkMode ? '#666' : '#999' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
        <Text style={[styles.versionText, { fontSize: fontSizeValue - 4, color: darkMode ? '#666' : '#999' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  checkmark: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  fontSizeText: {
    fontWeight: '500',
  },
  selectedFontSizeText: {
    color: '#fff',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingButtonText: {
  },
  arrow: {
    fontSize: 24,
  },
  versionText: {
    textAlign: 'center',
  },
});
