import React, { useState, useEffect, useMemo } from 'react';
import initialQuotesData from './api/mockData.json';
import { QuoteItem, QuoteStatus } from './types/quote';
import {
  Package,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Building2,
  Settings,
  Search,
  Bell,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
  Boxes
} from 'lucide-react';

export default function App() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'quotes' | 'users' | 'dashboard'>('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [boxTypeFilter, setBoxTypeFilter] = useState('all');

  // Stany dla modali
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [viewingQuote, setViewingQuote] = useState<QuoteItem | null>(null);

  // Formularz nowej / edytowanej wyceny
  const [formData, setFormData] = useState({
    client: '',
    boxType: 'Karton klapowy (Fala C)',
    length: 300,
    width: 200,
    height: 150,
    quantity: 1000,
    unitPrice: 1.5,
    status: 'Wersja robocza' as QuoteStatus,
    notes: ''
  });

  // Wymóg E3: Inicjalizacja danymi makietowymi z pliku JSON
  useEffect(() => {
    setQuotes(initialQuotesData as QuoteItem[]);
  }, []);

  // Filtrowanie wycen w czasie rzeczywistym
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesSearch =
        q.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchesType = boxTypeFilter === 'all' || q.boxType.includes(boxTypeFilter);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [quotes, searchTerm, statusFilter, boxTypeFilter]);

  // Statystyki KPI
  const stats = useMemo(() => {
    const total = quotes.length;
    const active = quotes.filter((q) => q.status !== 'Zaakceptowana').length;
    const totalValue = quotes.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);
    return {
      total,
      active,
      totalValue: Math.round(totalValue).toLocaleString('pl-PL')
    };
  }, [quotes]);

  // Obsługa dodawania / edycji
  const handleOpenAdd = () => {
    setEditingQuote(null);
    setFormData({
      client: '',
      boxType: 'Karton klapowy (Fala C)',
      length: 300,
      width: 200,
      height: 150,
      quantity: 1000,
      unitPrice: 1.5,
      status: 'Wersja robocza',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (quote: QuoteItem) => {
    setEditingQuote(quote);
    setFormData({
      client: quote.client,
      boxType: quote.boxType,
      length: quote.dimensions.length,
      width: quote.dimensions.width,
      height: quote.dimensions.height,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      status: quote.status,
      notes: quote.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client) return;

    if (editingQuote) {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === editingQuote.id
            ? {
                ...q,
                client: formData.client,
                boxType: formData.boxType,
                dimensions: {
                  length: Number(formData.length),
                  width: Number(formData.width),
                  height: Number(formData.height)
                },
                quantity: Number(formData.quantity),
                unitPrice: Number(formData.unitPrice),
                status: formData.status,
                notes: formData.notes
              }
            : q
        )
      );
    } else {
      const newQuote: QuoteItem = {
        id: `WYC-${1025 + quotes.length}`,
        client: formData.client,
        boxType: formData.boxType,
        dimensions: {
          length: Number(formData.length),
          width: Number(formData.width),
          height: Number(formData.height)
        },
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        status: formData.status,
        date: new Date().toLocaleDateString('pl-PL'),
        notes: formData.notes
      };
      setQuotes([newQuote, ...quotes]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę wycenę?')) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'Zaakceptowana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Zaakceptowana
          </span>
        );
      case 'Wysłana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Wysłana
          </span>
        );
      case 'Wersja robocza':
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
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0e131f]/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between p-5 z-20">
        <div>
          {/* Logo i Nazwa Firmy */}
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

          {/* Nawigacja */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'quotes'
                  ? 'bg-gradient-to-r from-purple-600/20 to-sky-600/10 text-white border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              <span>Wyceny i Oferty</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Użytkownicy (Admin)</span>
            </button>

            <div className="pt-4 pb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Operacje
            </div>

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

        {/* Profil Opiekuna Klienta */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
            JK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Jan Kowalski</p>
            <p className="text-xs text-purple-400/90 truncate">Opiekun Klienta</p>
          </div>
        </div>
      </aside>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#0b0e14] via-[#0f1422] to-[#0b0e14]">
        {/* Pasek wyszukiwania u góry */}
        <header className="h-18 px-8 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-[#0b0e14]/70">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Szukaj klienta, ID wyceny..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-1.5 right-1.5 animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Zawartość widoku */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Tytuł & Kafelki KPI */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                Wyceny i Oferty
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Zarządzanie kalkulacjami i ofertami kartonów dla klientów biznesowych
              </p>
            </div>

            {/* Kafelki statystyk */}
            <div className="grid grid-cols-3 gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
                <span className="text-xs font-medium text-slate-400">Wszystkie oferty</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
                <span className="text-xs font-medium text-slate-400">Aktywne wyceny</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-purple-400">{stats.active}</span>
                </div>
              </div>

              <div className="px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md min-w-[170px]">
                <span className="text-xs font-medium text-slate-400">Suma wycen</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-sky-400">{stats.totalValue}</span>
                  <span className="text-xs text-slate-400">PLN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pasek filtrów i przycisk Dodaj */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtruj tabelę..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500/50"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="Zaakceptowana">Zaakceptowane</option>
                <option value="Wysłana">Wysłane</option>
                <option value="Wersja robocza">Wersje robocze</option>
              </select>

              <select
                value={boxTypeFilter}
                onChange={(e) => setBoxTypeFilter(e.target.value)}
                className="bg-slate-950/70 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500/50"
              >
                <option value="all">Wszystkie rodzaje tektury</option>
                <option value="Fala C">Fala C (klapowe)</option>
                <option value="Fala E">Fala E (mikrofala/fason)</option>
                <option value="Fala BC">Fala BC (5-warstwowe)</option>
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj nową wycenę</span>
            </button>
          </div>

          {/* TABELA WYCEN (Wymóg E2: Widok danych) */}
          <div className="space-y-2.5">
            {/* Nagłówki kolumn */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">ID & Klient</div>
              <div className="col-span-3">Typ Kartonu (Fala)</div>
              <div className="col-span-2">Wymiary (mm)</div>
              <div className="col-span-1 text-right">Nakład</div>
              <div className="col-span-1 text-right">Cena jedn.</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Akcje</div>
            </div>

            {/* Wiersze tabeli - styl glassmorphism cards */}
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => (
                <div
                  key={q.id}
                  className="grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-purple-500/30 transition duration-200 group backdrop-blur-sm"
                >
                  <div className="col-span-2">
                    <span className="text-xs font-mono font-semibold text-purple-400">
                      {q.id}
                    </span>
                    <p className="text-sm font-medium text-slate-200 truncate">{q.client}</p>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Package className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                      <span>{q.boxType}</span>
                    </div>
                  </div>

                  <div className="col-span-2 text-xs font-mono text-slate-400">
                    {q.dimensions.length} × {q.dimensions.width} × {q.dimensions.height}
                  </div>

                  <div className="col-span-1 text-right text-xs font-semibold text-slate-200">
                    {q.quantity.toLocaleString()} szt.
                  </div>

                  <div className="col-span-1 text-right text-xs font-mono font-medium text-sky-400">
                    {q.unitPrice.toFixed(2)} zł
                  </div>

                  <div className="col-span-2 flex justify-center">
                    {getStatusBadge(q.status)}
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setViewingQuote(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition"
                      title="Podgląd"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition"
                      title="Edytuj"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Usuń"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                Nie znaleziono wycen spełniających podane kryteria.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL: Dodawanie / Edycja Wyceny */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#101524] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingQuote ? `Edycja Wyceny ${editingQuote.id}` : 'Nowa Wycena Kartonów'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nazwa Klienta / Firmy</label>
                <input
                  type="text"
                  required
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="np. Sklep E-commerce Sp. z o.o."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Typ opakowania & Fala</label>
                <select
                  value={formData.boxType}
                  onChange={(e) => setFormData({ ...formData, boxType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Karton klapowy (Fala C)">Karton klapowy (Fala C)</option>
                  <option value="Fasonowy (Fala E)">Fasonowy (Fala E - mikrofala)</option>
                  <option value="Wielogabarytowy (Fala BC)">Wielogabarytowy (Fala BC - 5 warstw)</option>
                  <option value="Karton z automatycznym dnem">Karton z automatycznym dnem (Fala B)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Długość (mm)</label>
                  <input
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Szerokość (mm)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Wysokość (mm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nakład (szt.)</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cena jedn. netto (PLN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status wyceny</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as QuoteStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Wersja robocza">Wersja robocza</option>
                  <option value="Wysłana">Wysłana do klienta</option>
                  <option value="Zaakceptowana">Zaakceptowana</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition"
                >
                  {editingQuote ? 'Zapisz zmiany' : 'Utwórz wycenę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Szczegółowy Podgląd Wyceny */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#101524] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-purple-400">{viewingQuote.id}</span>
                <h3 className="text-base font-bold text-white">{viewingQuote.client}</h3>
              </div>
              <button
                onClick={() => setViewingQuote(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Typ tektury:</span>
                <span className="text-white font-medium">{viewingQuote.boxType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Wymiary (dł x szer x wys):</span>
                <span className="text-white font-mono">
                  {viewingQuote.dimensions.length} × {viewingQuote.dimensions.width} × {viewingQuote.dimensions.height} mm
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Ilość zamówienia:</span>
                <span className="text-white font-semibold">{viewingQuote.quantity.toLocaleString()} szt.</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Cena jednostkowa:</span>
                <span className="text-sky-400 font-mono">{viewingQuote.unitPrice.toFixed(2)} PLN</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Wartość łączna:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {(viewingQuote.quantity * viewingQuote.unitPrice).toFixed(2)} PLN
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Status oferty:</span>
                {getStatusBadge(viewingQuote.status)}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingQuote(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}