import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { COLORS } from '../lib/design'

type Props = {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export default function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: COLORS.bgSurface, opacity }, style]}
    />
  )
}
