import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface AnimatedCaretProps {
  isExpanded: boolean;
  color?: string;
  size?: number;
}

export function AnimatedCaret({ isExpanded, color = '#999', size = 24 }: AnimatedCaretProps) {
  const rotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
      <Text style={[styles.caret, { color, fontSize: size }]}>›</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caret: {
    fontWeight: 'bold',
  },
});
