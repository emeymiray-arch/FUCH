import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { processAIQuery } from '@/services/aiService';
import { useFinanceStore } from '@/store/financeStore';

const SUGGESTIONS = [
  'Запиши, наличными отдал долг 5000',
  'Сколько я потратил за месяц?',
  'Какая категория самая затратная?',
  'Добавь расход продукты 1500 наличными',
  'Покажи все переводы за неделю',
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
  analytics?: { label: string; value: string }[];
}

export default function AssistantScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Привет! Я ваш финансовый помощник. Могу анализировать финансы и записывать операции. Скажите: «Запиши, наличными отдал долг 5000».',
    },
  ]);
  const [speaking, setSpeaking] = useState(false);

  const addFromVoiceCommand = useFinanceStore((s) => s.addFromVoiceCommand);

  const sendQuery = (query: string) => {
    if (!query.trim()) return;

    const voiceResult = addFromVoiceCommand(query);
    const response = voiceResult.ok
      ? { text: voiceResult.message, analytics: undefined }
      : processAIQuery(query);

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: query },
      { role: 'assistant', text: response.text, analytics: response.analytics },
    ]);
    setInput('');
    Speech.speak(response.text, {
      language: 'ru-RU',
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  useEffect(() => () => { Speech.stop(); }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>AI-помощник</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              {
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? colors.accent : colors.surface,
              },
            ]}
          >
            <Text style={{ color: msg.role === 'user' ? '#FFF' : colors.text, lineHeight: 22 }}>
              {msg.text}
            </Text>
            {msg.analytics && msg.analytics.length > 0 && (
              <View style={styles.analytics}>
                {msg.analytics.map((a, j) => (
                  <View key={j} style={[styles.analyticRow, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{a.label}</Text>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{a.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => sendQuery(s)}
              style={[styles.suggestion, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.accent, fontSize: 13 }}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Спросите о финансах..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendQuery(input)}
          />
          <Pressable
            onPress={() => sendQuery(input)}
            style={[styles.sendBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </Pressable>
        </View>
        {speaking && (
          <Text style={{ color: colors.accent, textAlign: 'center', padding: 8, fontSize: 13 }}>
            Говорю...
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: '700' },
  messages: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  analytics: { marginTop: 10 },
  analyticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
  },
  suggestions: { marginTop: 8 },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
