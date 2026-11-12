import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { clientsApi } from '../api/clientsApi';
import { Client, ClientIn } from '../types/client';

const EMPTY_FORM: ClientIn = {
  name: '', nip: '', email: '', phone: '', contactPerson: '', street: '', postalCode: '', city: '',
};

const FIELDS: { key: keyof ClientIn; label: string }[] = [
  { key: 'name', label: 'Nazwa firmy *' },
  { key: 'nip', label: 'NIP (10 cyfr)' },
  { key: 'contactPerson', label: 'Osoba kontaktowa' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefon' },
  { key: 'street', label: 'Ulica' },
  { key: 'postalCode', label: 'Kod pocztowy (00-000)' },
  { key: 'city', label: 'Miasto' },
];

function toForm(c: Client): ClientIn {
  return {
    name: c.name,
    nip: c.nip ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    contactPerson: c.contactPerson ?? '',
    street: c.street ?? '',
    postalCode: c.postalCode ?? '',
    city: c.city ?? '',
  };
}

interface ClientsPageProps {
  isAdmin: boolean;
}

export default function ClientsPage({ isAdmin }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientIn | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setClients(await clientsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openForm(client?: Client) {
    setEditingId(client?.id ?? null);
    setForm(client ? toForm(client) : EMPTY_FORM);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await clientsApi.update(editingId, form);
      } else {
        await clientsApi.create(form);
      }
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Usunąć klienta „${client.name}”?`)) return;
    try {
      await clientsApi.remove(client.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    }
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Klienci</h2>
          <p className="text-sm text-slate-400">Lista firm, dla których przygotowujemy wyceny</p>
        </div>
        {isAdmin && (
          <button onClick={() => openForm()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nowy klient
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#0e131f]/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-3">Nazwa</th>
                <th className="text-left px-4 py-3">NIP</th>
                <th className="text-left px-4 py-3">Kontakt</th>
                <th className="text-left px-4 py-3">Adres</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-200">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{c.nip ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {[c.contactPerson, c.email, c.phone].filter(Boolean).join(' • ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {[c.street, [c.postalCode, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openForm(c)} className="p-1.5 text-slate-400 hover:text-white" title="Edytuj">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-400 hover:text-rose-400" title="Usuń">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <form onSubmit={handleSave} className="bg-[#101524] border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Edycja klienta' : 'Nowy klient'}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <input
                  key={f.key}
                  className={`input ${f.key === 'name' || f.key === 'street' ? 'col-span-2' : ''}`}
                  placeholder={f.label}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required={f.key === 'name'}
                />
              ))}
            </div>

            {formError && (
              <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <button type="submit" disabled={isSaving} className="w-full btn-primary">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Zapisz
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
