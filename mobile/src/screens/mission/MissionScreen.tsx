// MissionScreen — lion-conservation mission, harvested from the Wiselion brand
// website (Big Life Foundation partnership + impact tracker + how to help).
// Rendered in the app's gold/deep-blue theme. Impact numbers are illustrative —
// wire them to a real /impact endpoint when available (see TODO).
import React from 'react';
import { ScrollView, View, Image, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Card, Button } from '../../components/ui';
import { theme } from '../../config';

const PILLARS = [
  'Supporting dedicated rangers protecting lions 24/7',
  'Funding patrols and equipment to combat poaching',
  'Education and livelihood programs for local communities',
  'Scientific tracking and habitat protection initiatives',
];

// TODO: replace with live figures from a backend /impact endpoint.
const IMPACT = [
  { value: '37', label: 'Rangers supported', sub: 'On the front lines' },
  { value: '12,400', label: 'Acres protected', sub: 'Habitat secured & monitored' },
  { value: '$84k', label: 'Raised', sub: 'From shows, merch & memberships' },
];

export default function MissionScreen() {
  const nav = useNavigation<any>();

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={require('../../../assets/wiselion-avatar.png')}
            style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: theme.gold }}
          />
          <Title style={{ marginTop: 12, textAlign: 'center' }}>The Roar Kingdom Story</Title>
          <Body style={{ textAlign: 'center', marginTop: 6 }}>
            Every show, every drop, every membership helps protect wild lions.
          </Body>
        </View>

        {/* Partnership */}
        <Card style={{ marginBottom: 12 }}>
          <Body style={{ color: theme.textDim }}>Our partnership</Body>
          <Title style={{ fontSize: 18, color: theme.goldLight }}>Big Life Foundation</Title>
          <View style={{ marginTop: 10, gap: 8 }}>
            {PILLARS.map((p) => (
              <View key={p} style={{ flexDirection: 'row' }}>
                <Body style={{ color: theme.gold, marginRight: 8 }}>🦁</Body>
                <Body style={{ color: theme.text, flex: 1 }}>{p}</Body>
              </View>
            ))}
          </View>
        </Card>

        {/* Impact tracker */}
        <Title style={{ fontSize: 16, marginVertical: 8 }}>Impact tracker</Title>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {IMPACT.map((s) => (
            <Card key={s.label} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 6 }}>
              <Title style={{ color: theme.goldLight, fontSize: 22 }}>{s.value}</Title>
              <Body style={{ textAlign: 'center', color: theme.text, fontSize: 12 }}>{s.label}</Body>
              <Body style={{ textAlign: 'center', fontSize: 10 }}>{s.sub}</Body>
            </Card>
          ))}
        </View>

        {/* How you can help */}
        <Title style={{ fontSize: 16, marginVertical: 8 }}>How you can help</Title>
        <Card style={{ marginBottom: 12 }}>
          <Help icon="📺" title="Attend a show" desc="Catch a live stream — proceeds fund the rangers." onPress={() => nav.navigate('Tabs')} />
          <Help icon="👑" title="Join the Pride" desc="Premium membership directly supports conservation." onPress={() => nav.navigate('Membership')} />
          <Help icon="🛍️" title="Buy the drop" desc="Official merch — a share goes to lion habitat." onPress={() => nav.navigate('Tabs')} />
          <Help icon="📣" title="Spread the word" desc="Share Wiselion with your pride." last />
        </Card>

        <Button title="Make a Direct Impact" onPress={() => Linking.openURL('https://biglife.org/donate').catch(() => {})} />
        <Body style={{ textAlign: 'center', marginTop: 8, fontSize: 11 }}>
          Wiselion partners with Big Life Foundation. Impact figures are updated periodically.
        </Body>
      </ScrollView>
    </Screen>
  );
}

const Help: React.FC<{ icon: string; title: string; desc: string; onPress?: () => void; last?: boolean }> = ({ icon, title, desc, onPress, last }) => (
  <View
    style={[styles.help, !last && { borderBottomWidth: 1, borderBottomColor: '#1E2C4A' }]}
    onTouchEnd={onPress}
  >
    <Body style={{ fontSize: 22, marginRight: 12 }}>{icon}</Body>
    <View style={{ flex: 1 }}>
      <Body style={{ color: theme.text, fontWeight: '700' }}>{title}</Body>
      <Body style={{ fontSize: 12 }}>{desc}</Body>
    </View>
    {onPress ? <Body style={{ color: theme.goldLight, fontSize: 18 }}>›</Body> : null}
  </View>
);

const styles = StyleSheet.create({
  help: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
});
