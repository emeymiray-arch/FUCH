import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useFinanceStore } from '@/store/financeStore';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');

  const handleAdd = () => {
    if (!addName.trim()) return;
    addCategory({
      name: addName.trim(),
      icon: 'bag',
      color: '#6366F1',
      type: 'expense',
    });
    setAddName('');
    setShowAdd(false);
  };

  const handleDelete = (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      Alert.alert('Нельзя удалить', 'Стандартные категории нельзя удалить');
      return;
    }
    Alert.alert('Удалить категорию', `Удалить «${name}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Категории',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {showAdd && (
          <View style={[styles.addRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Название категории"
              placeholderTextColor={colors.textSecondary}
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />
            <Pressable onPress={handleAdd}>
              <Ionicons name="checkmark-circle" size={28} color={colors.accent} />
            </Pressable>
          </View>
        )}

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable
              onPress={() => setShowAdd(true)}
              style={[styles.addBtn, { backgroundColor: colors.accentLight }]}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Новая категория</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface }]}>
              <CategoryIcon category={item} />
              {editing === item.id ? (
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={newName}
                  onChangeText={setNewName}
                  onSubmitEditing={() => {
                    updateCategory(item.id, { name: newName });
                    setEditing(null);
                  }}
                  autoFocus
                />
              ) : (
                <View style={styles.info}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>
                    {item.name}
                  </Text>
                  {item.isDefault && (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Стандартная</Text>
                  )}
                </View>
              )}
              <Pressable
                onPress={() => {
                  setEditing(item.id);
                  setNewName(item.name);
                }}
                style={styles.action}
              >
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </Pressable>
              {!item.isDefault && (
                <Pressable
                  onPress={() => handleDelete(item.id, item.name, item.isDefault)}
                  style={styles.action}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.expense} />
                </Pressable>
              )}
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  info: { flex: 1 },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
  },
  action: { padding: 6 },
});
