import React, { useState, useEffect, useMemo } from 'react';
import { quotesApi, ClientOption, ProductOption } from './api/quotesApi';
import { QuoteListItem, QuoteDetail, QuoteStatus, QuoteIn } from './types/quote';
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
  Calendar,
  RotateCw,
  WifiOff
} from 'lucide-react';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Wersja robocza',
  sent: 'Wysłana',
  accepted: 'Zaakceptowana',
  rejected: 'Odrzucona',
};

const BOX_TYPE_LABELS: Record<string, string> = {
  flap: 'Klapowy',
  die_cut: 'Fasonowy',
  oversized: 'Wielkogabarytowy',
  auto_bottom: 'Z automatycznym dnem',
};

const FLUTE_LABELS: Record<string, string> = {
  B: 'Fala B (~3mm)',
  C: 'Fala C (~4mm)',
  E: 'Fala E / Mikrofala (~1.5mm)',
  BC: 'Fala BC (~7mm)',
};

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDate;
}

interface FormItemState {
  productId: number | '';
  quantity: number | '';
  unitPrice: string;
  notes: string;
}

export default function App() {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [viewingDetail, setViewingDetail] = useState<QuoteDetail | null>(null);

  const [formHeader, setFormHeader] = useState<{
    clientId: number | '';
    status: QuoteStatus;
    quoteDate: string;
    validUntil: string;
    notes: string;
  }>({
    clientId: '',
    status: 'draft',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    notes: '',
  });

  const [formItems, setFormItems] = useState<FormItemState[]>([
    { productId: '', quantity: 500, unitPrice: '', notes: '' },
  ]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchQuotesList = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const data = await quotesApi.getQuotes();
      setQuotes(data);
    } catch (err: any) {
      const msg = err.message || 'Brak połączenia z serwerem';
      setConnectionError(msg);
      showNotification('error', `Błąd sieci: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotesList();

    quotesApi.getClients().then((data) => {
      setClients(data);
    }).catch(() => {});

    quotesApi.getProducts().then((data) => {
      setProducts(data);
    }).catch(() => {});
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        q.number.toLowerCase().includes(search) ||
        q.clientName.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchesClient = clientFilter === 'all' || String(q.clientId) === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [quotes, searchTerm, statusFilter, clientFilter]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const active = quotes.filter((q) => q.status !== 'accepted' && q.status !== 'rejected').length;
    const totalValue = quotes.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    return {
      total,
      active,
      totalValue: Math.round(totalValue).toLocaleString('pl-PL'),
    };
  }, [quotes]);

  const handleAddItemRow = () => {
    const selectedIds = formItems.map((i) => i.productId);
    const availableProd = products.find((p) => !selectedIds.includes(p.id));

    setFormItems((prev) => [
      ...prev,
      {
        productId: availableProd ? availableProd.id : (products[0]?.id || ''),
        quantity: 500,
        unitPrice: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) {
      setModalError('Wycena musi zawierać co najmniej jedną pozycję.');
      return;
    }
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItemState, value: any) => {
    setFormItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleOpenAdd = () => {
    setEditingQuoteId(null);
    setModalError(null);
    setFormHeader({
      clientId: clients[0]?.id || '',
      status: 'draft',
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: '',
      notes: '',
    });
    setFormItems([
      {
        productId: products[0]?.id || '',
        quantity: 500,
        unitPrice: '',
        notes: '',
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (q: QuoteListItem) => {
    try {
      setIsLoading(true);
      setModalError(null);
      const detail = await quotesApi.getQuote(q.id);

      setEditingQuoteId(detail.id);
      setFormHeader({
        clientId: detail.clientId,
        status: detail.status,
        quoteDate: detail.quoteDate || '',
        validUntil: detail.validUntil || '',
        notes: detail.notes || '',
      });

      setFormItems(
        detail.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice !== undefined && it.unitPrice !== null ? String(it.unitPrice) : '',
          notes: it.notes || '',
        }))
      );

      setIsModalOpen(true);
    } catch (err: any) {
      showNotification('error', `Błąd wczytywania szczegółów: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formHeader.clientId) {
      setModalError('Wybierz klienta z listy.');
      return;
    }

    if (formItems.length === 0) {
      setModalError('Wycena musi mieć co najmniej jedną pozycję.');
      return;
    }

    const productIds = formItems.map((it) => it.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      setModalError('Produkt może wystąpić w wycenie tylko raz.');
      return;
    }

    for (let i = 0; i < formItems.length; i++) {
      const it = formItems[i];
      if (!it.productId) {
        setModalError(`Pozycja #${i + 1}: Wybierz produkt.`);
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        setModalError(`Pozycja #${i + 1}: Nakład musi być większy niż 0.`);
        return;
      }
    }

    const payload: QuoteIn = {
      clientId: Number(formHeader.clientId),
      status: formHeader.status,
      quoteDate: formHeader.quoteDate || null,
      validUntil: formHeader.validUntil || null,
      notes: formHeader.notes || null,
      items: formItems.map((it) => {
        const itemPayload: any = {
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          notes: it.notes || null,
        };
        if (it.unitPrice.trim() !== '') {
          itemPayload.unitPrice = parseFloat(it.unitPrice);
        }
        return itemPayload;
      }),
    };

    setIsSubmitting(true);
    try {
      if (editingQuoteId) {
        await quotesApi.updateQuote(editingQuoteId, payload);
        showNotification('success', 'Wycena została pomyślnie zaktualizowana.');
      } else {
        await quotesApi.createQuote(payload);
        showNotification('success', 'Nowa wycena została dodana do bazy.');
      }
      setIsModalOpen(false);
      await fetchQuotesList();
    } catch (err: any) {
      setModalError(err.message || 'Wystąpił błąd podczas zapisu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (quoteId: number) => {
    try {
      const detail = await quotesApi.getQuote(quoteId);
      setViewingDetail(detail);
    } catch (err: any) {
      showNotification('error', `Błąd pobierania pozycji: ${err.message}`);
    }
  };

  const handleDelete = async (quoteId: number, numberStr: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć wycenę ${numberStr}?`)) return;
    try {
      await quotesApi.deleteQuote(quoteId);
      showNotification('success', `Usunięto wycenę ${numberStr}`);
      await fetchQuotesList();
    } catch (err: any) {
      showNotification('error', `Błąd usuwania: ${err.message}`);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {STATUS_LABELS[status]}
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            {STATUS_LABELS[status]}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {STATUS_LABELS[status]}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {STATUS_LABELS[status]}
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] text-slate-200 overflow-hidden font-sans">
      {/* Toast błędu połączenia / sukcesu */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
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

      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#0b0e14] via-[#0f1422] to-[#0b0e14]">
        <header className="h-18 px-8 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-10 bg-[#0b0e14]/70 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Szukaj po numerze lub kliencie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>
          <button
            onClick={fetchQuotesList}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isLoading ? 'Ładowanie...' : 'Odśwież dane'}</span>
          </button>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                Wyceny i Oferty
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Kalkulacja ofertowa z obsługą wielu pozycji kartonów
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">Wszystkie wyceny</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">Aktywne w toku</span>
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
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="draft">Wersja robocza</option>
                <option value="sent">Wysłana</option>
                <option value="accepted">Zaakceptowana</option>
                <option value="rejected">Odrzucona</option>
              </select>

              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300"
              >
                <option value="all">Wszyscy Klienci</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj wycenę</span>
            </button>
          </div>

          {/* STAN BŁĘDU: BRAK POŁĄCZENIA Z BACKENDEM */}
          {connectionError ? (
            <div className="flex flex-col items-center justify-center p-12 bg-rose-950/20 border border-rose-500/40 rounded-3xl text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-rose-400" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-lg font-bold text-white">Brak połączenia z serwerem</h3>
                <p className="text-[11px] font-mono text-slate-500 mt-2">
                </p>
              </div>
              <button
                onClick={fetchQuotesList}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Ponów próbę połączenia</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-3">Numer & Klient</div>
                <div className="col-span-2">Data wyceny</div>
                <div className="col-span-2 text-center">Liczba pozycji</div>
                <div className="col-span-2 text-right">Wartość łączna</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-right">Akcje</div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      <div>
                        <p className="text-sm font-semibold text-purple-200">Ładowanie wycen...</p>
                        <p className="text-xs text-slate-400">Trwa synchronizacja rekordów</p>
                      </div>
                    </div>
                  </div>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl bg-slate-900/30 border border-slate-800/40 animate-pulse"
                    >
                      <div className="col-span-3 space-y-2">
                        <div className="h-3 w-16 bg-purple-900/30 rounded"></div>
                        <div className="h-4 w-36 bg-slate-800 rounded"></div>
                      </div>
                      <div className="col-span-2">
                        <div className="h-3.5 w-24 bg-slate-800 rounded"></div>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className="h-6 w-20 bg-slate-800 rounded-lg"></div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <div className="h-4 w-16 bg-slate-800 rounded"></div>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className="h-6 w-24 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="col-span-1 flex justify-end gap-2">
                        <div className="h-6 w-6 bg-slate-800 rounded-lg"></div>
                        <div className="h-6 w-6 bg-slate-800 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 transition group"
                  >
                    <div className="col-span-3">
                      <span className="text-xs font-mono font-semibold text-purple-400">{q.number}</span>
                      <p className="text-sm font-medium text-slate-200 truncate">{q.clientName}</p>
                    </div>
                    <div className="col-span-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(q.quoteDate)}</span>
                    </div>
                    <div className="col-span-2 text-center text-xs font-semibold text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                        {q.itemsCount} {q.itemsCount === 1 ? 'pozycja' : 'pozycje'}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm font-mono font-bold text-sky-400">
                      {Number(q.totalValue).toFixed(2)} zł
                    </div>
                    <div className="col-span-2 flex justify-center">{getStatusBadge(q.status)}</div>
                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetail(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                        title="Szczegóły pozycji"
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
                        onClick={() => handleDelete(q.id, q.number)}
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
                  Brak wycen spełniających kryteria.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL FORMULARZA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#101524] border border-slate-700/80 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingQuoteId ? `Edycja Wyceny #${editingQuoteId}` : 'Nowa Wycena Kartonów'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingQuoteId ? 'Modyfikacja nagłówka i pozycji zamówienia' : 'Numer wyceny zostanie nadany automatycznie przez serwer'}
                </p>
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-200 text-xs shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-sm block text-red-100">Błąd walidacji:</span>
                  <span className="text-red-300 text-xs leading-relaxed">{modalError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveQuote} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-850">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Klient *</label>
                  <select
                    value={formHeader.clientId}
                    onChange={(e) => setFormHeader({ ...formHeader, clientId: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Status wyceny *</label>
                  <select
                    value={formHeader.status}
                    onChange={(e) => setFormHeader({ ...formHeader, status: e.target.value as QuoteStatus })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="draft">Wersja robocza</option>
                    <option value="sent">Wysłana</option>
                    <option value="accepted">Zaakceptowana</option>
                    <option value="rejected">Odrzucona</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Data wyceny</label>
                  <input
                    type="date"
                    value={formHeader.quoteDate}
                    onChange={(e) => setFormHeader({ ...formHeader, quoteDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ważna do (opcjonalnie)</label>
                  <input
                    type="date"
                    value={formHeader.validUntil}
                    onChange={(e) => setFormHeader({ ...formHeader, validUntil: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Uwagi do wyceny</label>
                  <input
                    type="text"
                    placeholder="np. Nadruk jednokolorowy, dostawa w 2 partiach"
                    value={formHeader.notes}
                    onChange={(e) => setFormHeader({ ...formHeader, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Pozycje wyceny (Produkty)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Dodaj pozycję</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row gap-3 items-end"
                    >
                      <div className="flex-1 w-full">
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Produkt #{idx + 1} *
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-32">
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Nakład (szt.) *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="w-full md:w-36">
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Cena PLN (opcjonalna)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="z cennika"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={formItems.length === 1}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Usuń pozycję"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingQuoteId ? 'Zapisz zmiany w wycenie' : 'Utwórz wycenę'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SZCZEGÓŁÓW */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#101524] border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-purple-400 font-semibold">{viewingDetail.number}</span>
                <h3 className="text-lg font-bold text-white">{viewingDetail.clientName}</h3>
                <span className="text-xs text-slate-400">
                  Data: {formatDate(viewingDetail.quoteDate)}
                  {viewingDetail.validUntil ? ` • Ważna do: ${formatDate(viewingDetail.validUntil)}` : ''}
                </span>
              </div>
              <button onClick={() => setViewingDetail(null)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingDetail.notes && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-400 block mb-0.5">Uwagi do zamówienia:</span>
                {viewingDetail.notes}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lista pozycji ({viewingDetail.items.length}):
              </h4>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {viewingDetail.items.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-white flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-purple-400" />
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Typ: {BOX_TYPE_LABELS[item.boxType] || item.boxType}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Fala: {FLUTE_LABELS[item.flute] || item.flute}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Wymiary: {item.dimensions.length} × {item.dimensions.width} × {item.dimensions.height} mm
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sky-400 font-bold text-base whitespace-nowrap">
                        {item.lineTotal.toFixed(2)} zł
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-900">
                      <span>
                        Nakład: <strong className="text-slate-200">{item.quantity} szt.</strong> × {item.unitPrice.toFixed(2)} zł
                      </span>
                      {item.notes && <span className="italic text-slate-500 truncate max-w-[200px]">{item.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <span className="text-sm font-medium text-slate-400">Łączna suma wyceny:</span>
                <span className="text-emerald-400 font-bold font-mono text-xl">
                  {viewingDetail.totalValue.toFixed(2)} PLN
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Zamknij podgląd
            </button>
          </div>
        </div>
      )}
    </div>
  );
}