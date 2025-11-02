import React, { useEffect, useRef } from 'react';
import { Animated, View } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";

interface AnimatedCaretProps {
  isExpanded: boolean;
  color?: string;
  size?: number;
}

export function AnimatedCaret({
  isExpanded,
  color = "#999",
  size = 20,
}: AnimatedCaretProps) {
  const rotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isExpanded ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
        <IconSymbol name="chevron.right" size={size} color={color} />
      </Animated.View>
    </View>
  );
}
