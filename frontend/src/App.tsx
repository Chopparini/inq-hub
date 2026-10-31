import React, { useState, useEffect, useMemo } from 'react';
import { quotesApi, ClientOption, ProductOption } from './api/quotesApi';
import { QuoteStatus } from './types/quote';
import {
  Package,
  FileSpreadsheet,
  Building2,
  Settings,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  Boxes,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function App() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ numericId: number; number: string } | null>(null);
  const [viewingDetail, setViewingDetail] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    clientId: '' as string | number,
    productId: '' as string | number,
    quantity: 1000,
    unitPrice: 1.5,
    status: 'Wersja robocza' as QuoteStatus,
    notes: ''
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchQuotesList = async () => {
    setIsLoading(true);
    try {
      const data = await quotesApi.getQuotes();
      setQuotes(data);
    } catch (err: any) {
      showNotification('error', `Błąd: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotesList();

    quotesApi.getClients().then((data) => {
      setClients(data);
      if (data.length > 0) setFormData((prev) => ({ ...prev, clientId: data[0].id }));
    }).catch(() => {});

    quotesApi.getProducts().then((data) => {
      setProducts(data);
      if (data.length > 0) setFormData((prev) => ({ ...prev, productId: data[0].id, unitPrice: data[0].defaultPrice || 1.5 }));
    }).catch(() => {});
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const clientName = (q.client || '').toLowerCase();
      const quoteNum = String(q.number || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = clientName.includes(search) || quoteNum.includes(search);
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const active = quotes.filter((q) => q.status !== 'Zaakceptowana').length;
    const totalValue = quotes.reduce((acc, curr) => acc + (curr.unitPrice || 0), 0);
    return {
      total,
      active,
      totalValue: Math.round(totalValue).toLocaleString('pl-PL')
    };
  }, [quotes]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      clientId: clients[0]?.id || '',
      productId: products[0]?.id || '',
      quantity: 1000,
      unitPrice: products[0]?.defaultPrice || 1.5,
      status: 'Wersja robocza',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (q: any) => {
    try {
      setIsLoading(true);
      const detail = await quotesApi.getQuoteDetail(q.numericId);
      const firstItem = detail.items?.[0];

      setEditingItem({ numericId: q.numericId, number: q.number });
      setFormData({
        clientId: detail.clientId || clients[0]?.id || '',
        productId: firstItem?.productId || products[0]?.id || '',
        quantity: firstItem?.quantity || 1000,
        unitPrice: firstItem?.unitPrice || 1.5,
        status: q.status,
        notes: detail.notes || ''
      });
      setIsModalOpen(true);
    } catch (err: any) {
      showNotification('error', `Błąd ładowania: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      showNotification('error', 'Wybierz klienta.');
      return;
    }
    if (!formData.productId) {
      showNotification('error', 'Wybierz produkt.');
      return;
    }
    if (formData.quantity <= 0) {
      showNotification('error', 'Nakład musi być większy od 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await quotesApi.updateQuote(editingItem.numericId, formData);
        showNotification('success', `Zaktualizowano wycenę ${editingItem.number}`);
      } else {
        await quotesApi.createQuote(formData);
        showNotification('success', 'Nowa wycena została dodana do bazy.');
      }
      setIsModalOpen(false);
      await fetchQuotesList();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (numericId: number) => {
    try {
      const detail = await quotesApi.getQuoteDetail(numericId);
      setViewingDetail(detail);
    } catch (err: any) {
      showNotification('error', `Błąd pobierania: ${err.message}`);
    }
  };

  const handleDelete = async (numericId: number, numberStr: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć wycenę ${numberStr}?`)) return;
    try {
      await quotesApi.deleteQuote(numericId);
      showNotification('success', `Usunięto wycenę ${numberStr}`);
      await fetchQuotesList();
    } catch (err: any) {
      showNotification('error', `Błąd usuwania: ${err.message}`);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'Zaakceptowana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Zaakceptowana
          </span>
        );
      case 'Wysłana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Wysłana
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Wersja robocza
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] text-slate-200 overflow-hidden font-sans">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <aside className="w-72 bg-[#0e131f]/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between p-5 z-20">
        <div>
          <div className="flex items-center gap-3.5 px-2 py-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                Hanka i Kartony
              </h1>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider">
                Sp. z o.o. • B2B System
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-600/20 to-sky-600/10 text-white border border-purple-500/40">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              <span>Wyceny i Oferty</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition">
              <Building2 className="w-4 h-4" />
              <span>Klienci B2B</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition">
              <Settings className="w-4 h-4" />
              <span>Ustawienia</span>
            </button>
          </nav>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white">
            OH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Olena Hakman</p>
            <p className="text-xs text-purple-400 truncate">Frontend Dev</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#0b0e14] via-[#0f1422] to-[#0b0e14]">
        <header className="h-18 px-8 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-10 bg-[#0b0e14]/70 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Szukaj wyceny..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>
          <button
            onClick={fetchQuotesList}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            Odśwież dane
          </button>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                Wyceny i Oferty
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Panel integracji end-to-end z bazą danych PostgreSQL
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">Wszystkie</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">Aktywne</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-purple-400">{stats.active}</span>
                </div>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 min-w-[170px]">
                <span className="text-xs font-medium text-slate-400">Łączna wartość</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-sky-400">{stats.totalValue} zł</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="Zaakceptowana">Zaakceptowane</option>
              <option value="Wysłana">Wysłane</option>
              <option value="Wersja robocza">Wersje robocze</option>
            </select>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj wycenę</span>
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Numer & Klient</div>
              <div className="col-span-2">Data utworzenia</div>
              <div className="col-span-2 text-center">Liczba pozycji</div>
              <div className="col-span-2 text-right">Wartość łączna</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Akcje</div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Pobieranie wycen z bazy...</p>
              </div>
            ) : filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => (
                <div
                  key={q.numericId}
                  className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 transition group"
                >
                  <div className="col-span-3">
                    <span className="text-xs font-mono font-semibold text-purple-400">{q.number}</span>
                    <p className="text-sm font-medium text-slate-200 truncate">{q.client}</p>
                  </div>
                  <div className="col-span-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{q.date}</span>
                  </div>
                  <div className="col-span-2 text-center text-xs font-semibold text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                      {q.quantity} {q.quantity === 1 ? 'pozycja' : 'pozycje'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono font-bold text-sky-400">
                    {Number(q.unitPrice).toFixed(2)} zł
                  </div>
                  <div className="col-span-2 flex justify-center">{getStatusBadge(q.status)}</div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(q.numericId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                      title="Podgląd pozycji"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                      title="Edytuj wycenę"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.numericId, q.number)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Usuń"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                Brak wycen w bazie danych.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DODAWANIA I PEŁNEJ EDYCJI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#101524] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingItem ? `Edycja Wyceny ${editingItem.number}` : 'Nowa Wycena Kartonów'}
              </h3>
              <button
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Klient *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Produkt / Rodzaj *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const prod = products.find((p) => String(p.id) === String(prodId));
                    setFormData({
                      ...formData,
                      productId: prodId,
                      unitPrice: prod?.defaultPrice || formData.unitPrice
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nakład (szt.) *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cena jedn. PLN *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status wyceny</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as QuoteStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Wersja robocza">Wersja robocza</option>
                  <option value="Wysłana">Wysłana</option>
                  <option value="Zaakceptowana">Zaakceptowana</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Uwagi do wyceny</label>
                <input
                  type="text"
                  placeholder="np. Nadruk jedno- lub dwukolorowy"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Zapisz zmiany' : 'Utwórz wycenę'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SZCZEGÓŁÓW (GET /quotes/{id}) */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#101524] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-purple-400">{viewingDetail.number}</span>
                <h3 className="text-base font-bold text-white">{viewingDetail.clientName}</h3>
              </div>
              <button onClick={() => setViewingDetail(null)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Pozycje zamówienia w wycenie:
              </h4>
              {viewingDetail.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-400" />
                      {item.productName}
                    </span>
                    <span className="font-mono text-sky-400 font-bold">{item.lineTotal} zł</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      Wymiary: {item.dimensions?.length} × {item.dimensions?.width} × {item.dimensions?.height} mm
                    </span>
                    <span>
                      {item.quantity} szt. × {item.unitPrice} zł
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-sm">
                <span className="text-slate-400">Łączna wartość:</span>
                <span className="text-emerald-400 font-bold font-mono text-base">
                  {viewingDetail.totalValue} PLN
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold mt-4"
            >
              Zamknij podgląd
            </button>
          </div>
        </div>
      )}
    </div>
  );
}