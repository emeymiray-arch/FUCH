import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface SimpleBarChartProps {
  data: BarItem[];
  title?: string;
}

export function SimpleBarChart({ data, title }: SimpleBarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}
      {data.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: item.color,
                  width: `${(item.value / max) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.value, { color: colors.text }]}>
            {(item.value / 1000).toFixed(0)}K
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    width: 90,
    fontSize: 12,
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
