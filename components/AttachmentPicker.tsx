import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/hooks/useTheme';
import { Attachment } from '@/types';

interface AttachmentPickerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  label?: string;
}

export function AttachmentPicker({ attachments, onChange, label = 'Фото и документы' }: AttachmentPickerProps) {
  const { colors } = useTheme();

  const addImage = async (type: Attachment['type'], fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Доступ', 'Разрешите доступ к камере или галерее');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      onChange([
        ...attachments,
        {
          id: `att-${Date.now()}`,
          type,
          uri: result.assets[0].uri,
          name: result.assets[0].fileName ?? 'photo.jpg',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const addPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0]) {
      onChange([
        ...attachments,
        {
          id: `att-${Date.now()}`,
          type: 'pdf',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const remove = (id: string) => onChange(attachments.filter((a) => a.id !== id));

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.btns}>
        <Pressable
          onPress={() => addImage('receipt', true)}
          style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="camera-outline" size={20} color={colors.accent} />
          <Text style={styles.btnText}>Камера</Text>
        </Pressable>
        <Pressable
          onPress={() => addImage('receipt', false)}
          style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="image-outline" size={20} color={colors.accent} />
          <Text style={styles.btnText}>Галерея</Text>
        </Pressable>
        <Pressable
          onPress={() => addImage('payment', false)}
          style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="receipt-outline" size={20} color={colors.accent} />
          <Text style={styles.btnText}>Чек</Text>
        </Pressable>
        <Pressable
          onPress={addPdf}
          style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="document-outline" size={20} color={colors.accent} />
          <Text style={styles.btnText}>PDF</Text>
        </Pressable>
      </View>
      {attachments.map((a) => (
        <View key={a.id} style={[styles.item, { backgroundColor: colors.surface }]}>
          {a.type !== 'pdf' ? (
            <Image source={{ uri: a.uri }} style={styles.thumb} />
          ) : (
            <Ionicons name="document" size={28} color={colors.accent} />
          )}
          <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{a.name}</Text>
          <Pressable onPress={() => remove(a.id)}>
            <Ionicons name="close-circle" size={22} color={colors.expense} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: { fontSize: 10, marginTop: 4, color: '#666' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  thumb: { width: 44, height: 44, borderRadius: 8 },
});
