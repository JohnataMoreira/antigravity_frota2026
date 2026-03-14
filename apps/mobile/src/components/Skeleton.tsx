import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      accessibilityLabel="Carregando conteúdo..."
      style={[
        { width: width as any, height: height as any, borderRadius, backgroundColor: '#E2E8F0' }, 
        style, 
        animatedStyle
      ]} 
    />
  );
}

export function VehicleSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.header}>
        <Skeleton width={56} height={56} borderRadius={16} />
        <View style={skeletonStyles.textGroup}>
          <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <View style={skeletonStyles.divider} />
      <View style={skeletonStyles.footer}>
        <Skeleton width={100} height={16} />
        <Skeleton width={100} height={32} borderRadius={12} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  textGroup: {
    marginLeft: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
