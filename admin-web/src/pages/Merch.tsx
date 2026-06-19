import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, Button, Input, Field, colors } from '../components/ui';

export default function Merch() {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', priceCents: 2999, stock: 100, premiumOnly: false });

  const load = () => api.get<any[]>('/merch/products').then(setProducts).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    await api.post('/merch/products', form);
    setForm({ name: '', description: '', imageUrl: '', priceCents: 2999, stock: 100, premiumOnly: false });
    load();
  };

  const updateStock = async (id: string, stock: number) => {
    await api.patch(`/merch/products/${id}`, { stock });
    load();
  };

  return (
    <div>
      <h1>Merch Inventory</h1>
      <Card>
        <h3>Add Product</h3>
        <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Image URL"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
        <Field label="Price (cents)"><Input type="number" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: +e.target.value })} /></Field>
        <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></Field>
        <label style={{ color: colors.dim }}>
          <input type="checkbox" checked={form.premiumOnly} onChange={(e) => setForm({ ...form, premiumOnly: e.target.checked })} /> Premium only
        </label>
        <div><Button onClick={create} style={{ marginTop: 8 }}>Add Product</Button></div>
      </Card>

      {products.map((p) => (
        <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{p.name}</strong> — ${(p.priceCents / 100).toFixed(2)} {p.premiumOnly && '👑'}
            <div style={{ color: colors.dim, fontSize: 13 }}>Stock: {p.stock}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => updateStock(p.id, p.stock + 10)}>+10 stock</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
