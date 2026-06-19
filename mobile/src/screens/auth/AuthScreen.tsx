import React, { useState } from 'react';
import { View, TextInput, Image, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Title, Body, Button } from '../../components/ui';
import { theme } from '../../config';
import { signInEmail, signUpEmail } from '../../services/firebase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'in') await signInEmail(email.trim(), password);
      else await signUpEmail(email.trim(), password);
      // RootNavigator swaps automatically on auth state change.
    } catch (e: any) {
      Alert.alert('Authentication failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // TODO: wire Google/Apple via expo-auth-session + signInWithGoogle/Apple().
  const social = (provider: string) =>
    Alert.alert('Coming soon', `${provider} sign-in is wired in services/firebase.ts`);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen style={{ justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Image source={require('../../../assets/wiselion-avatar.png')} style={styles.logo} />
          <Title style={{ fontSize: 28, marginTop: 12 }}>Wiselionlikeking</Title>
          <Body>Watch live · Play bingo · Win lotto 🦁👑</Body>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.textDim}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title={mode === 'in' ? 'Sign In' : 'Create Account'} loading={loading} onPress={submit} />
        <Button
          variant="ghost"
          title={mode === 'in' ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
          onPress={() => setMode(mode === 'in' ? 'up' : 'in')}
        />

        <View style={{ height: 12 }} />
        <Button variant="ghost" title="Continue with Google" onPress={() => social('Google')} />
        <Button variant="ghost" title="Continue with Apple" onPress={() => social('Apple')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: theme.gold },
  input: {
    backgroundColor: theme.card,
    color: theme.text,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#1E2C4A',
  },
});
