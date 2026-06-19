// PrizePotCard — renders the composed "displayed pot" from the Prize Growth
// Engine: base (tickets) + AMM yield + house boost, in XRP, with the rollover/
// boost tag and a count-up animation so the jackpot visibly "grows".
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { theme } from '../config';

export interface DisplayPot {
  totalXRP: number;
  baseFromTickets: number;
  yieldFromAMM: number;
  boostedByHouse: number;
}

interface Props {
  pot: DisplayPot;
  tag: string;          // e.g. "🔥 JACKPOT ROLLOVER!"
  isRollover: boolean;
  drawTime?: string;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const PrizePotCard: React.FC<Props> = ({ pot, tag, isRollover, drawTime }) => {
  // Count-up: animate a numeric value from its previous total to the new one.
  const anim = useRef(new Animated.Value(0)).current;
  const prev = useRef(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const from = prev.current;
    const to = pot.totalXRP;
    anim.setValue(0);
    const id = anim.addListener(({ value }) => setShown(from + (to - from) * value));
    Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: false }).start(() => {
      prev.current = to;
    });
    return () => anim.removeListener(id);
  }, [pot.totalXRP]);

  return (
    <View style={[styles.card, isRollover && styles.rollover]}>
      <View style={[styles.tag, { backgroundColor: isRollover ? theme.gold : theme.bronze }]}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>

      <Text style={styles.label}>Jackpot</Text>
      <Text style={styles.total}>{fmt(shown)} XRP</Text>

      {/* Breakdown of where the pot comes from — the three growth engines. */}
      <View style={styles.breakdown}>
        <Row label="Tickets" value={pot.baseFromTickets} />
        <Row label="AMM yield" value={pot.yieldFromAMM} accent={theme.green} prefix="+" />
        <Row label="House boost" value={pot.boostedByHouse} accent={theme.goldLight} prefix="+" />
      </View>

      {drawTime ? (
        <Text style={styles.draw}>Draws {new Date(drawTime).toLocaleString()}</Text>
      ) : null}
    </View>
  );
};

const Row: React.FC<{ label: string; value: number; accent?: string; prefix?: string }> = ({
  label,
  value,
  accent,
  prefix,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowVal, accent ? { color: accent } : null]}>
      {value > 0 && prefix ? prefix : ''}
      {fmt(value)} XRP
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2C4A',
    alignItems: 'center',
  },
  rollover: { borderColor: theme.goldLight, borderWidth: 2 },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  tagText: { color: theme.deepBlue, fontWeight: '800', fontSize: 12 },
  label: { color: theme.textDim, fontSize: 13 },
  total: { color: theme.goldLight, fontSize: 36, fontWeight: '800', marginVertical: 2 },
  breakdown: { width: '100%', marginTop: 12, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: theme.textDim, fontSize: 13 },
  rowVal: { color: theme.text, fontSize: 13, fontWeight: '600' },
  draw: { color: theme.textDim, fontSize: 12, marginTop: 12 },
});

export default PrizePotCard;
