import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  className = '',
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-gray-300 ${className}`}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Specific skeleton components for different UI elements

export function SkeletonText({ lines = 1, width = '100%', className = '' }: { lines?: number; width?: number | string; className?: string }) {
  if (lines === 1) {
    return <Skeleton width={width} height={16} className={className} />;
  }

  return (
    <View className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '70%' : width}
          height={16}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonButton({ width = 100, height = 40 }: { width?: number; height?: number }) {
  return <Skeleton width={width} height={height} borderRadius={8} />;
}

export function SkeletonCard({ height = 80, className = '' }: { height?: number; className?: string }) {
  return (
    <View className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
      <SkeletonText lines={2} />
    </View>
  );
}

export function SkeletonList({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <View className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <View key={i} className="flex-row items-center space-x-3">
          <SkeletonAvatar size={32} />
          <View className="flex-1">
            <SkeletonText lines={1} width="60%" />
            <SkeletonText lines={1} width="40%" />
          </View>
        </View>
      ))}
    </View>
  );
}