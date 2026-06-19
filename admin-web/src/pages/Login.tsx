import React, { useState } from 'react';
import { signIn } from '../services/firebase';
import { Card, Button, Input, Field, colors } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, pass);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 340 }}>
        <h2 style={{ color: colors.goldLight }}>🦁👑 Admin Login</h2>
        <form onSubmit={submit}>
          <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
          <Field label="Password"><Input value={pass} onChange={(e) => setPass(e.target.value)} type="password" /></Field>
          {err && <p style={{ color: '#E2483A' }}>{err}</p>}
          <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
        </form>
        <p style={{ color: colors.dim, fontSize: 12 }}>Your email must be in the server's ADMIN_EMAILS allowlist.</p>
      </Card>
    </div>
  );
}
