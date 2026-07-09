import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

const PIN_LENGTH = 5;

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  label?: string;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, label, autoFocus = false }: PinInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const isWeb = Platform.OS === 'web';

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, PIN_LENGTH));
  };

  if (isWeb) {
    return (
      <View style={styles.wrap}>
        {label ? (
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        ) : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          inputMode="numeric"
          maxLength={PIN_LENGTH}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          placeholder="00000"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.webInput,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.surface,
            },
          ]}
          accessibilityLabel={label ?? 'Пароль'}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
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
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        autoFocus={autoFocus}
        secureTextEntry
        caretHidden
        style={styles.nativeInput}
        accessibilityLabel={label ?? 'Пароль'}
      />
    </View>
  );
}

export const PIN_LEN = PIN_LENGTH;

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', width: '100%' },
  label: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
    justifyContent: 'center',
    minHeight: 44,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  webInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  nativeInput: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    height: 44,
    opacity: 0,
  },
});
