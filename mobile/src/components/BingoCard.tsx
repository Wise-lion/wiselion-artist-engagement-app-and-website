// Renders a single 5x5 bingo card and auto-daubs cells whose number was drawn.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config';

const HEADERS = ['B', 'I', 'N', 'G', 'O'];

interface Props {
  grid: number[][]; // [row][col]
  drawnNumbers: number[];
  isWinner?: boolean;
}

export const BingoCard: React.FC<Props> = ({ grid, drawnNumbers, isWinner }) => {
  const drawn = new Set(drawnNumbers);

  return (
    <View style={[styles.card, isWinner && styles.winner]}>
      <View style={styles.row}>
        {HEADERS.map((h) => (
          <View key={h} style={styles.headerCell}>
            <Text style={styles.headerText}>{h}</Text>
          </View>
        ))}
      </View>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const free = value === 0;
            const marked = free || drawn.has(value);
            return (
              <View key={c} style={[styles.cell, marked && styles.cellMarked]}>
                <Text style={[styles.cellText, marked && styles.cellTextMarked]}>
                  {free ? '★' : value}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const CELL = 52;
const styles = StyleSheet.create({
  card: { backgroundColor: theme.card, borderRadius: 12, padding: 6, borderWidth: 2, borderColor: theme.bronze, marginVertical: 8 },
  winner: { borderColor: theme.goldLight, shadowColor: theme.goldLight, shadowOpacity: 0.8, shadowRadius: 12 },
  row: { flexDirection: 'row' },
  headerCell: { width: CELL, height: 30, alignItems: 'center', justifyContent: 'center' },
  headerText: { color: theme.goldLight, fontWeight: '900', fontSize: 18 },
  cell: { width: CELL, height: CELL, margin: 2, borderRadius: 8, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  cellMarked: { backgroundColor: theme.gold },
  cellText: { color: theme.text, fontSize: 16, fontWeight: '700' },
  cellTextMarked: { color: theme.deepBlue, fontWeight: '900' },
});
