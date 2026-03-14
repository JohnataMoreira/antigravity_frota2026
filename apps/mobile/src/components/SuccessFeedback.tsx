import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

interface SuccessFeedbackProps {
  visible: boolean;
  title: string;
  message: string;
  onComplete: () => void;
}

export function SuccessFeedback({ visible, title, message, onComplete }: SuccessFeedbackProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0);

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
          // Callback after fade out
        });
        setTimeout(onComplete, 350);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = 20;
    }
  }, [visible]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.content, animatedTextStyle]}>
          <Animated.View style={[styles.circle, animatedCircleStyle]}>
            <Check size={40} color="white" strokeWidth={3} />
          </Animated.View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 40,
    width: '100%',
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
});
