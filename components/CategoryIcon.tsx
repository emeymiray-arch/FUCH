import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { Category } from '@/types';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  cart: 'cart-outline',
  car: 'car-outline',
  restaurant: 'restaurant-outline',
  flash: 'flash-outline',
  bag: 'bag-outline',
  repeat: 'repeat-outline',
  wallet: 'wallet-outline',
  'trending-up': 'trending-up-outline',
  'alert-circle': 'alert-circle-outline',
  'swap-horizontal': 'swap-horizontal-outline',
};

interface CategoryIconProps {
  category: Category;
  size?: number;
}

export function CategoryIcon({ category, size = 20 }: CategoryIconProps) {
  const iconName = ICON_MAP[category.icon] ?? 'ellipse-outline';
  return (
    <View style={[styles.wrap, { backgroundColor: category.color + '22' }]}>
      <Ionicons name={iconName} size={size} color={category.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
