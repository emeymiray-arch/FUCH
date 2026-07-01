import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

const PIN_LENGTH = 5;

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  label?: string;
}

export function PinInput({ value, onChange, label }: PinInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <Pressable style={styles.dots} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: value.length === i ? colors.accent : colors.border,
                backgroundColor: value.length > i ? colors.accent : colors.surface,
              },
            ]}
          />
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={PIN_LENGTH}
        style={styles.hidden}
        autoFocus
      />
    </View>
  );
}

export const PIN_LEN = PIN_LENGTH;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  label: { fontSize: 14, marginBottom: 16 },
  dots: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
});
