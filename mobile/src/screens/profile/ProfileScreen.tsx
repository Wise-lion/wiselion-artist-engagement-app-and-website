import React, { useState } from 'react';
import { View, Image, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Title, Body, Button, Card, TierBadge } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { Endpoints } from '../../services/api';
import { theme } from '../../config';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { profile, refreshProfile, logout } = useAuthStore();
  const [bio, setBio] = useState(profile?.bio || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await Endpoints.updateMe({ username, bio });
      await refreshProfile();
      Alert.alert('Saved', 'Profile updated.');
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={
              profile?.avatarUrl
                ? { uri: profile.avatarUrl }
                : require('../../../assets/wiselion-avatar.png')
            }
            style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: theme.gold }}
          />
          <Title style={{ marginTop: 12 }}>{profile?.username}</Title>
          <View style={{ marginTop: 6 }}><TierBadge tier={profile?.tier || 'FREE'} /></View>
          <Body style={{ marginTop: 6 }}>{profile?.email}</Body>
        </View>

        <Card style={{ marginTop: 20 }}>
          <Body>Username</Body>
          <TextInput value={username} onChangeText={setUsername} style={input} placeholderTextColor={theme.textDim} />
          <Body style={{ marginTop: 8 }}>Bio</Body>
          <TextInput value={bio} onChangeText={setBio} multiline style={[input, { height: 80 }]} placeholderTextColor={theme.textDim} />
          <Button title="Save Profile" loading={saving} onPress={save} />
        </Card>

        {profile?.tier !== 'PREMIUM' && (
          <Button title="👑 Go Premium" onPress={() => nav.navigate('Membership')} style={{ marginTop: 16 }} />
        )}
        <Button variant="ghost" title="Log Out" onPress={logout} style={{ marginTop: 8 }} />
      </ScrollView>
    </Screen>
  );
}

const input = {
  backgroundColor: theme.bg,
  color: theme.text,
  borderRadius: 10,
  padding: 12,
  marginTop: 4,
  borderWidth: 1,
  borderColor: '#1E2C4A',
} as const;
