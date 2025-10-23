/**
 * ChopText Component Usage Examples
 *
 * This file demonstrates various ways to use the ChopText component
 */

import React from 'react';
import { View } from 'react-native';
import { ChopText } from './chop-text';

export function ChopTextExamples() {
  return (
    <View style={{ padding: 20 }}>
      {/* Basic usage */}
      <ChopText>Default text</ChopText>

      {/* Size variations */}
      <ChopText size="xs">Extra small text</ChopText>
      <ChopText size="small">Small text</ChopText>
      <ChopText size="medium">Medium text (default)</ChopText>
      <ChopText size="large">Large text</ChopText>
      <ChopText size="xl">Extra large text</ChopText>
      <ChopText size="xxl">Extra extra large text</ChopText>

      {/* Weight variations */}
      <ChopText weight="normal">Normal weight</ChopText>
      <ChopText weight="medium">Medium weight</ChopText>
      <ChopText weight="semibold">Semibold weight</ChopText>
      <ChopText weight="bold">Bold weight</ChopText>

      {/* Variant colors */}
      <ChopText variant="default">Default color (adapts to dark mode)</ChopText>
      <ChopText variant="theme">Theme color (user's selected color)</ChopText>
      <ChopText variant="muted">Muted text (gray)</ChopText>
      <ChopText variant="error">Error text (red)</ChopText>
      <ChopText variant="success">Success text (green)</ChopText>
      <ChopText variant="warning">Warning text (orange)</ChopText>

      {/* Combining props */}
      <ChopText size="large" weight="bold" variant="theme">
        Large bold themed heading
      </ChopText>

      <ChopText size="small" variant="muted">
        Small muted subtitle
      </ChopText>

      {/* With global font size applied */}
      <ChopText useGlobalFontSize>
        This text respects the user's global font size setting
      </ChopText>

      {/* Custom color override */}
      <ChopText color="#FF6B6B">Custom colored text</ChopText>

      {/* With additional styles */}
      <ChopText style={{ textAlign: 'center', marginTop: 20 }}>
        Centered text with custom margin
      </ChopText>

      {/* All React Native Text props work */}
      <ChopText numberOfLines={1} ellipsizeMode="tail">
        This is a very long text that will be truncated with an ellipsis
      </ChopText>
    </View>
  );
}

/**
 * Common use cases:
 */

// Page Title
export const PageTitle = ({ children }: { children: React.ReactNode }) => (
  <ChopText size="xxl" weight="bold" variant="theme">
    {children}
  </ChopText>
);

// Section Heading
export const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <ChopText size="large" weight="semibold">
    {children}
  </ChopText>
);

// Body Text
export const BodyText = ({ children }: { children: React.ReactNode }) => (
  <ChopText size="medium" useGlobalFontSize>
    {children}
  </ChopText>
);

// Caption/Small Text
export const Caption = ({ children }: { children: React.ReactNode }) => (
  <ChopText size="small" variant="muted">
    {children}
  </ChopText>
);

// Error Message
export const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <ChopText size="small" variant="error">
    {children}
  </ChopText>
);
