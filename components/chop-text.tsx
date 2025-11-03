import { useAppSelector } from "@/store/hooks";
import React, { forwardRef, ReactNode, useMemo } from "react";
import { StyleSheet, Text, TextProps } from "react-native";

type ChopTextProps = TextProps & {
  children: ReactNode;
  size?: "xs" | "small" | "medium" | "large" | "xl" | "xxl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  variant?: "default" | "theme" | "muted" | "error" | "success" | "warning";
  useGlobalFontSize?: boolean;
};

/**
 * ChopText - A reusable text component that integrates with app settings
 *
 * @param size - Predefined size options (xs: 10, small: 12, medium: 16, large: 20, xl: 24, xxl: 32)
 * @param weight - Font weight options (normal: 400, medium: 500, semibold: 600, bold: 700)
 * @param color - Custom color override
 * @param variant - Predefined color variants (default, theme, muted, error, success, warning)
 * @param useGlobalFontSize - Apply user's global font size setting (small/medium/large)
 *
 * @example
 * <ChopText size="large" weight="bold" variant="theme">Title Text</ChopText>
 * <ChopText variant="muted" size="small">Subtitle text</ChopText>
 */
export const ChopText = forwardRef<Text, ChopTextProps>(
  (
    {
      children,
      size = "medium",
      weight = "normal",
      color,
      variant = "default",
      useGlobalFontSize = false,
      style,
      ...props
    },
    ref
  ) => {
    const darkMode = useAppSelector((state) => state.settings.darkMode);
    const themeColor = useAppSelector((state) => state.settings.themeColor);
    const globalFontSize = useAppSelector((state) => state.settings.fontSize);

    // Base font sizes
    const baseFontSizes = {
      xs: 10,
      small: 12,
      medium: 16,
      large: 20,
      xl: 24,
      xxl: 32,
    };

    // Calculate final font size
    const fontSize = useMemo(() => {
      let baseSize = baseFontSizes[size];

      // Apply global font size multiplier if enabled
      if (useGlobalFontSize) {
        const multiplier =
          globalFontSize === "small"
            ? 0.875
            : globalFontSize === "large"
            ? 1.25
            : 1;
        baseSize = Math.round(baseSize * multiplier);
      }

      return baseSize;
    }, [size, useGlobalFontSize, globalFontSize]);

    // Font weight mapping
    const fontWeight = useMemo(() => {
      const weights = {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      };
      return weights[weight];
    }, [weight]);

    // Color variants
    const textColor = useMemo(() => {
      // Custom color takes precedence
      if (color) return color;

      // Variant-based colors
      switch (variant) {
        case "theme":
          return themeColor;
        case "muted":
          return darkMode ? "#999" : "#666";
        case "error":
          return "#ff3b30";
        case "success":
          return "#34C759";
        case "warning":
          return "#ff9500";
        case "default":
        default:
          return darkMode ? "#fff" : "#000";
      }
    }, [color, variant, darkMode, themeColor]);

    return (
      <Text
        ref={ref}
        {...props}
        style={[
          styles.text,
          {
            fontSize,
            fontWeight: fontWeight as TextProps["style"]["fontWeight"],
            color: textColor,
          },
          style,
        ]}
      >
        {children}
      </Text>
    );
  }
);

ChopText.displayName = "ChopText";

const styles = StyleSheet.create({
  text: {
    // Default styles - can be overridden
  },
});
