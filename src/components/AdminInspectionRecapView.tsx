/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  Layers,
  Building2,
  Waves,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  User,
  Calendar,
  CheckCircle2,
  TableProperties,
  BarChart3,
  Users2,
  Compass,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  BalaiPSDA,
  FollowUpStatus,
  InspectionCategory,
  RiverInspection,
  UserAccount,
  WILAYAH_SUNGAI_OPTIONS,
  WilayahSungai,
  calculateInspectionScores,
  getComponentsByCategory,
} from '../types/silussi';
import {
  exportAllInspectionsComprehensiveExcelHtml,
  exportAllInspectionsSummaryToCsv,
} from '../utils/reportExporter';

interface AdminInspectionRecapViewProps {
  inspections: RiverInspection[];
  currentUser: UserAccount;
  onSelectInspection: (inspection: RiverInspection) => void;
  onUpdateFollowUp: (
    inspectionId: string,
    newStatus: FollowUpStatus,
    notes?: string
  ) => void;
  onDeleteInspection: (inspectionId: string) => void;
  onLogExport?: (format: string, inspection?: RiverInspection) => void;
}

type RecapViewTab = 'master' | 'components' | 'aggregate';

export const AdminInspectionRecapView: React.FC<AdminInspectionRecapViewProps> = ({
  inspections,
  currentUser,
  onSelectInspection,
  onUpdateFollowUp,
  onDeleteInspection,
  onLogExport,
}) => {
  const [activeTab, setActiveTab] = useState<RecapViewTab>('master');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [balaiFilter, setBalaiFilter] = useState<string>('ALL');
  const [wsFilter, setWsFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [followUpFilter, setFollowUpFilter] = useState<string>('ALL');

  // Expanded row ID for showing full deep inspection details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quick edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Delete confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setBalaiFilter('ALL');
    setWsFilter('ALL');
    setRiskFilter('ALL');
    setFollowUpFilter('ALL');
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const cat = item.category || 'fisik_sungai';
      if (categoryFilter !== 'ALL' && cat !== categoryFilter) return false;
      if (balaiFilter !== 'ALL' && item.balaiPsda !== balaiFilter) return false;
      if (wsFilter !== 'ALL' && item.namaWs !== wsFilter) return false;
      if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) return false;
      if (followUpFilter !== 'ALL' && item.followUpStatus !== followUpFilter)
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRiver = (item.namaSungai || '').toLowerCase().includes(q);
        const matchPras = (item.namaPrasarana || '').toLowerCase().includes(q);
        const matchRuas = (item.noRuas || '').toLowerCase().includes(q);
        const matchKode = (item.kodeInspeksi || '').toLowerCase().includes(q);
        const matchKab = (item.kabupatenKota || '').toLowerCase().includes(q);
        const matchKec = (item.kecamatan || '').toLowerCase().includes(q);
        const matchDesa = (item.desa || '').toLowerCase().includes(q);
        const matchInsp = (item.inspectorName || '').toLowerCase().includes(q);
        const matchNip = (item.inspectorNip || '').toLowerCase().includes(q);

        if (
          !matchRiver &&
          !matchPras &&
          !matchRuas &&
          !matchKode &&
          !matchKab &&
          !matchKec &&
          !matchDesa &&
          !matchInsp &&
          !matchNip
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    inspections,
    categoryFilter,
    balaiFilter,
    wsFilter,
    riskFilter,
    followUpFilter,
    searchQuery,
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = inspections.length;
    const fisikCount = inspections.filter(
      (i) => (i.category || 'fisik_sungai') === 'fisik_sungai'
    ).length;
    const prasaranaCount = inspections.filter(
      (i) => i.category === 'kinerja_prasarana'
    ).length;
    const totalKm = inspections.reduce(
      (acc, cur) => acc + (cur.panjangRuasKm || 0),
      0
    );
    const avgNkf =
      total > 0
        ? inspections.reduce((acc, cur) => acc + cur.nkfTotal, 0) / total
        : 0;

    const rrCount = inspections.filter(
      (i) => i.riskLevel === 'Risiko Rendah (RR)'
    ).length;
    const rsCount = inspections.filter(
      (i) => i.riskLevel === 'Risiko Sedang (RS)'
    ).length;
    const rtCount = inspections.filter(
      (i) => i.riskLevel === 'Risiko Tinggi (RT)'
    ).length;

    const needFollowUpCount = inspections.filter(
      (i) => i.followUpStatus === 'Perlu Tindak Lanjut'
    ).length;

    return {
      total,
      fisikCount,
      prasaranaCount,
      totalKm,
      avgNkf,
      rrCount,
      rsCount,
      rtCount,
      needFollowUpCount,
    };
  }, [inspections]);

  // Aggregation by Balai PSDA
  const balaiStats = useMemo(() => {
    const map = new Map<
      string,
      {
        balai: string;
        count: number;
        totalKm: number;
        sumNkf: number;
        highRisk: number;
        needFollowUp: number;
      }
    >();

    for (const b of BALAI_PSDA_OPTIONS) {
      map.set(b, {
        balai: b,
        count: 0,
        totalKm: 0,
        sumNkf: 0,
        highRisk: 0,
        needFollowUp: 0,
      });
    }

    for (const insp of inspections) {
      const entry = map.get(insp.balaiPsda) || {
        balai: insp.balaiPsda,
        count: 0,
        totalKm: 0,
        sumNkf: 0,
        highRisk: 0,
        needFollowUp: 0,
      };
      entry.count += 1;
      entry.totalKm += insp.panjangRuasKm || 0;
      entry.sumNkf += insp.nkfTotal;
      if (insp.riskLevel === 'Risiko Tinggi (RT)') entry.highRisk += 1;
      if (insp.followUpStatus === 'Perlu Tindak Lanjut')
        entry.needFollowUp += 1;
      map.set(insp.balaiPsda, entry);
    }

    return Array.from(map.values());
  }, [inspections]);

  // Aggregation by Inspector
  const inspectorStats = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        nip: string;
        balai: string;
        count: number;
        totalKm: number;
        avgNkf: number;
        sumNkf: number;
        latestDate: string;
      }
    >();

    for (const insp of inspections) {
      const key = (insp.inspectorNip || insp.inspectorName || 'unknown').replace(
        /\s+/g,
        ''
      );
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: insp.inspectorName || 'Inspektor Lapangan',
          nip: insp.inspectorNip || '-',
          balai: insp.balaiPsda,
          count: 1,
          totalKm: insp.panjangRuasKm || 0,
          sumNkf: insp.nkfTotal,
          avgNkf: insp.nkfTotal,
          latestDate: insp.tanggalPelaksanaan || insp.createdAt || '',
        });
      } else {
        existing.count += 1;
        existing.totalKm += insp.panjangRuasKm || 0;
        existing.sumNkf += insp.nkfTotal;
        existing.avgNkf = existing.sumNkf / existing.count;
        if (
          insp.tanggalPelaksanaan &&
          insp.tanggalPelaksanaan > existing.latestDate
        ) {
          existing.latestDate = insp.tanggalPelaksanaan;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [inspections]);

  const handleExportExcel = () => {
    exportAllInspectionsComprehensiveExcelHtml(filteredInspections);
    onLogExport?.(
      'Excel Rekapitulasi Lengkap (.xls)',
      undefined
    );
  };

  const handleExportCsv = () => {
    exportAllInspectionsSummaryToCsv(filteredInspections);
    onLogExport?.(
      'CSV Rekapitulasi (.csv)',
      undefined
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSaveNote = (inspId: string) => {
    const target = inspections.find((i) => i.id === inspId);
    if (!target) return;
    onUpdateFollowUp(inspId, target.followUpStatus, noteDraft);
    setEditingNoteId(null);
    setNoteDraft('');
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteInspection(confirmDeleteId);
      setConfirmDeleteId(null);
      if (expandedId === confirmDeleteId) {
        setExpandedId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Header & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#1B65A6] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#1B65A6]" />
            Khusus Akun Administrator · Si-Lussi v2
          </div>
          <h1 className="font-display text-xl font-bold text-[#0B2C5F] mt-1">
            Rekapitulasi Semua Data Inputan Blangko Lapangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Pusat inventarisasi komprehensif seluruh inputan penilaian kondisi fisik sungai dan kinerja prasarana yang diinput oleh para inspektor se-Jawa Tengah.
          </p>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Unduh seluruh data dan kolom dalam format file Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Unduh Excel (.xls)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg bg-[#1B65A6] hover:bg-[#0B2C5F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Unduh data dalam format CSV untuk database & GIS"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak lembar rekapitulasi resmi DPUPR Jawa Tengah"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Metric Cards KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Inputan
          </div>
          <div className="text-2xl font-bold font-mono text-[#0B2C5F] mt-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Semua kategori ruas
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-sky-200 bg-gradient-to-br from-white to-sky-50/50">
          <div className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider flex items-center gap-1">
            <Waves className="w-3.5 h-3.5 text-sky-600" />
            Fisik Sungai
          </div>
          <div className="text-2xl font-bold font-mono text-sky-900 mt-1">
            {metrics.fisikCount}
          </div>
          <div className="text-[11px] text-sky-700 mt-0.5">
            Blangko penilaian alur
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50">
          <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Prasarana
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">
            {metrics.prasaranaCount}
          </div>
          <div className="text-[11px] text-indigo-700 mt-0.5">
            Bangunan air &amp; pengendali
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Panjang Terdata
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B65A6] mt-1">
            {metrics.totalKm.toFixed(1)} <span className="text-xs font-normal">Km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kumulatif panjang ruas
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata NKF
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {metrics.avgNkf.toFixed(1)}<span className="text-sm font-normal">%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kondisi fisik rata-rata
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Perlu Tindak Lanjut
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
            {metrics.needFollowUpCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            Menunggu penanganan
          </div>
        </div>
      </div>

      {/* Tabs Selection: Master Table vs Parameter Matrix vs Aggregates */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'master'
                ? 'border-[#1B65A6] text-[#0B2C5F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Tabel Master Seluruh Inputan ({filteredInspections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'components'
                ? 'border-[#1B65A6] text-[#0B2C5F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Matriks Skor Komponen &amp; Sub-Nilai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aggregate')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'aggregate'
                ? 'border-[#1B65A6] text-[#0B2C5F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Rekapitulasi per Balai &amp; Petugas</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Menampilkan {filteredInspections.length} dari total {inspections.length} inputan
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nama Sungai, No Ruas, Bangunan, Kabupaten, Inspektor, NIP, atau Kode Blangko..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] focus:ring-1 focus:ring-[#1B65A6] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kategori Inputan
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="fisik_sungai">Kondisi Fisik Sungai</option>
              <option value="kinerja_prasarana">Kinerja Prasarana</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Balai PSDA
            </label>
            <select
              value={balaiFilter}
              onChange={(e) => setBalaiFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Balai PSDA</option>
              {BALAI_PSDA_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Wilayah Sungai (WS)
            </label>
            <select
              value={wsFilter}
              onChange={(e) => setWsFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Wilayah Sungai</option>
              {WILAYAH_SUNGAI_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tingkat Risiko
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Risiko</option>
              <option value="Risiko Rendah (RR)">Risiko Rendah (RR)</option>
              <option value="Risiko Sedang (RS)">Risiko Sedang (RS)</option>
              <option value="Risiko Tinggi (RT)">Risiko Tinggi (RT)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Tindak Lanjut
            </label>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aman / Terkendali">Aman / Terkendali</option>
              <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
              <option value="Dalam Penanganan">Dalam Penanganan</option>
              <option value="Selesai Ditindaklanjuti">Selesai Ditindaklanjuti</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: MASTER COMPREHENSIVE TABLE */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-[#1B65A6]" />
              <span>Daftar Inputan Lengkap ({filteredInspections.length} Data)</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Klik tanda panah pada baris untuk membuka rincian nilai komponen dan koordinat lengkap
            </div>
          </div>

          {filteredInspections.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm font-semibold">Tidak ada data inputan yang cocok dengan filter</div>
              <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#1B65A6] text-white text-xs font-semibold"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2C5F] text-white font-semibold border-b border-white/20 whitespace-nowrap">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Kode Blangko</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Nama Sungai &amp; Ruas</th>
                    <th className="py-3 px-3">Balai &amp; Wilayah Sungai</th>
                    <th className="py-3 px-3">Lokasi Administrasi</th>
                    <th className="py-3 px-3 text-center">Panjang</th>
                    <th className="py-3 px-3">Tanggal &amp; Inspektor</th>
                    <th className="py-3 px-3 text-right">Skor NKF</th>
                    <th className="py-3 px-3 text-center">Tingkat Risiko</th>
                    <th className="py-3 px-3">Tindak Lanjut</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.map((insp, idx) => {
                    const isExpanded = expandedId === insp.id;
                    const isPras = insp.category === 'kinerja_prasarana';
                    const calc = calculateInspectionScores(
                      insp.subValues,
                      insp.category || 'fisik_sungai'
                    );

                    return (
                      <React.Fragment key={insp.id}>
                        <tr
                          className={`hover:bg-sky-50/40 transition-colors ${
                            isExpanded ? 'bg-sky-50/60 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-[#0B2C5F] bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {insp.kodeInspeksi}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {isPras ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                <Building2 className="w-3 h-3" />
                                Prasarana
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800">
                                <Waves className="w-3 h-3" />
                                Fisik Sungai
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 min-w-[200px]">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{insp.namaSungai}</span>
                            </div>
                            {isPras && insp.namaPrasarana && (
                              <div className="text-[11px] text-indigo-700 font-medium">
                                Bangunan: {insp.namaPrasarana}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 font-mono">
                              Ruas: {insp.noRuas}
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-700">
                              {insp.balaiPsda}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {insp.namaWs}
                            </div>
                          </td>

                          <td className="py-3 px-3 min-w-[160px]">
                            <div className="text-slate-800 font-medium">
                              {insp.kabupatenKota}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Kec. {insp.kecamatan}, Desa {insp.desa}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-slate-700">
                            {insp.panjangRuasKm ? `${insp.panjangRuasKm} Km` : '-'}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{insp.tanggalPelaksanaan}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700">{insp.inspectorName}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              NIP: {insp.inspectorNip}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                            <div className="text-sm font-bold text-[#0B2C5F]">
                              {calc.nkfTotal.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {calc.physicalStatusLabel}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                calc.riskLevel === 'Risiko Rendah (RR)'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : calc.riskLevel === 'Risiko Sedang (RS)'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {calc.riskLevel}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {calc.performanceLevel}
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <select
                              value={insp.followUpStatus}
                              onChange={(e) =>
                                onUpdateFollowUp(
                                  insp.id,
                                  e.target.value as FollowUpStatus
                                )
                              }
                              className={`text-[11px] font-semibold px-2 py-1 rounded-md border outline-none cursor-pointer ${
                                insp.followUpStatus === 'Aman / Terkendali'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : insp.followUpStatus === 'Perlu Tindak Lanjut'
                                    ? 'bg-red-50 border-red-300 text-red-800'
                                    : insp.followUpStatus === 'Dalam Penanganan'
                                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                                      : 'bg-blue-50 border-blue-300 text-blue-800'
                              }`}
                            >
                              <option value="Aman / Terkendali">Aman / Terkendali</option>
                              <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                              <option value="Dalam Penanganan">Dalam Penanganan</option>
                              <option value="Selesai Ditindaklanjuti">Selesai Ditindaklanjuti</option>
                            </select>
                            {insp.followUpNotes && (
                              <div className="text-[10px] text-slate-500 max-w-[150px] truncate mt-0.5" title={insp.followUpNotes}>
                                Catatan: {insp.followUpNotes}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleExpand(insp.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 transition-colors cursor-pointer"
                                title={isExpanded ? 'Tutup Rincian' : 'Lihat Rincian Lengkap'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#1B65A6]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectInspection(insp)}
                                className="p-1.5 rounded-lg bg-[#1B65A6] hover:bg-[#0B2C5F] text-white transition-colors cursor-pointer"
                                title="Buka Blangko Resmi & Cetak PDF / Excel"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(insp.id)}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                title="Hapus Data Inputan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Deep Breakdown Card */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <td colSpan={12} className="p-4 sm:p-5">
                              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-inner space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                                  <div>
                                    <div className="text-xs font-mono font-bold text-[#1B65A6] uppercase tracking-wider">
                                      Rincian Lengkap Seluruh Parameter Inputan Lapangan
                                    </div>
                                    <div className="text-sm font-bold text-[#0B2C5F]">
                                      {insp.namaSungai} ({insp.kodeInspeksi}) — Ruas {insp.noRuas}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onSelectInspection(insp)}
                                      className="px-3 py-1.5 rounded-lg bg-[#0B2C5F] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Buka Lembar Blangko Lengkap
                                    </button>
                                  </div>
                                </div>

                                {/* Geographic & Inspector Coordinate Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Coordinates */}
                                  <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100">
                                    <div className="text-xs font-bold text-[#0B2C5F] flex items-center gap-1.5 mb-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                      Titik Koordinat Lapangan
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div>
                                        <span className="text-slate-500 text-[11px]">Titik Awal:</span>{' '}
                                        <span className="font-mono font-semibold text-slate-800">
                                          {insp.koordinatAwal || '-'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 text-[11px]">Titik Akhir:</span>{' '}
                                        <span className="font-mono font-semibold text-slate-800">
                                          {insp.koordinatAkhir || '-'}
                                        </span>
                                      </div>
                                      {insp.koordinatAwal && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            insp.koordinatAwal
                                          )}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-[#1B65A6] hover:underline font-semibold mt-1"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Buka Lokasi di Google Maps
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Administrative Identity */}
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                                      <Compass className="w-3.5 h-3.5 text-slate-600" />
                                      Wilayah &amp; Administrasi
                                    </div>
                                    <div className="space-y-0.5 text-xs text-slate-700">
                                      <div>
                                        <span className="text-slate-500">Kabupaten/Kota:</span> {insp.kabupatenKota}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Kecamatan:</span> {insp.kecamatan}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Desa/Kelurahan:</span> {insp.desa}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Wilayah Sungai:</span> {insp.namaWs}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Balai Pengelola:</span> {insp.balaiPsda}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inspector Profile & Verification */}
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                                      <User className="w-3.5 h-3.5 text-slate-600" />
                                      Petugas &amp; Catatan Verifikasi
                                    </div>
                                    <div className="space-y-0.5 text-xs text-slate-700">
                                      <div>
                                        <span className="text-slate-500">Nama Petugas:</span>{' '}
                                        <span className="font-semibold">{insp.inspectorName}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">NIP:</span> {insp.inspectorNip}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Tgl Inspeksi:</span> {insp.tanggalPelaksanaan}
                                      </div>
                                      {insp.verifiedBy && (
                                        <div className="text-emerald-700 font-medium text-[11px] pt-1">
                                          Diverifikasi oleh: {insp.verifiedBy}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Component Scoring Breakdown Table */}
                                <div>
                                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5 text-[#1B65A6]" />
                                    Rincian Skor per Komponen Pembentuk Nilai Total
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                                    {Object.entries(calc.componentResults).map(([key, comp]) => (
                                      <div
                                        key={key}
                                        className="p-2.5 rounded-lg border border-slate-200 bg-white"
                                      >
                                        <div className="text-[10px] font-semibold text-slate-500 uppercase truncate" title={comp.title}>
                                          {comp.title}
                                        </div>
                                        <div className="text-base font-bold font-mono text-[#0B2C5F] mt-0.5">
                                          {comp.nilaiFisikKomponen.toFixed(2)}%
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          Bobot: {comp.bobotInduk}%
                                        </div>
                                        {comp.subResults && comp.subResults.length > 0 && (
                                          <div className="text-[10px] text-sky-700 font-medium mt-1">
                                            {comp.subResults.length} parameter dinilai
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Documentation Links */}
                                {(insp.linkDokumentasi1 ||
                                  insp.linkDokumentasi2 ||
                                  insp.linkDokumentasi3) && (
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="text-xs font-bold text-slate-700 mb-1.5">
                                      Tautan Berkas Dokumentasi Lapangan (Cloud Drive / Foto):
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      {insp.linkDokumentasi1 && (
                                        <a
                                          href={insp.linkDokumentasi1}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-sky-700 hover:text-sky-900 font-medium text-[11px]"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Link Dok 1: {insp.linkDokumentasi1.slice(0, 45)}...
                                        </a>
                                      )}
                                      {insp.linkDokumentasi2 && (
                                        <a
                                          href={insp.linkDokumentasi2}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-sky-700 hover:text-sky-900 font-medium text-[11px]"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Link Dok 2: {insp.linkDokumentasi2.slice(0, 45)}...
                                        </a>
                                      )}
                                      {insp.linkDokumentasi3 && (
                                        <a
                                          href={insp.linkDokumentasi3}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-sky-700 hover:text-sky-900 font-medium text-[11px]"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Link Dok 3: {insp.linkDokumentasi3.slice(0, 45)}...
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Admin Action & Notes Section */}
                                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-xs">
                                    <div className="font-bold text-amber-900">
                                      Catatan Tindak Lanjut Administrator:
                                    </div>
                                    <div className="text-amber-800 mt-0.5">
                                      {insp.followUpNotes || 'Belum ada catatan khusus dari Administrator.'}
                                    </div>
                                  </div>

                                  {editingNoteId === insp.id ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <input
                                        type="text"
                                        value={noteDraft}
                                        onChange={(e) => setNoteDraft(e.target.value)}
                                        placeholder="Tulis instruksi / catatan..."
                                        className="px-2.5 py-1 text-xs rounded border border-amber-300 bg-white outline-none w-60"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveNote(insp.id)}
                                        className="px-2.5 py-1 rounded bg-[#0B2C5F] text-white text-xs font-semibold"
                                      >
                                        Simpan
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteId(null)}
                                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingNoteId(insp.id);
                                        setNoteDraft(insp.followUpNotes || '');
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold shrink-0 cursor-pointer"
                                    >
                                      Edit Catatan Tindak Lanjut
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPONENT SCORE MATRIX */}
      {activeTab === 'components' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1B65A6]" />
              <span>Matriks Penilaian Parameter &amp; Sub-Komponen ({filteredInspections.length} Data)</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Rincian komparasi skor fisik dan kinerja seluruh ruas terdaftar
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B2C5F] text-white font-semibold whitespace-nowrap">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3">Kode &amp; Nama Sungai</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Palung (%)</th>
                  <th className="py-3 px-3 text-right">Bantaran Ka (%)</th>
                  <th className="py-3 px-3 text-right">Bantaran Ki (%)</th>
                  <th className="py-3 px-3 text-right">Sempadan Ka (%)</th>
                  <th className="py-3 px-3 text-right">Sempadan Ki (%)</th>
                  <th className="py-3 px-3 text-right">Muara (%)</th>
                  <th className="py-3 px-3 text-right">Limbah (%)</th>
                  <th className="py-3 px-3 text-right">Prasarana (%)</th>
                  <th className="py-3 px-3 text-right font-bold">Total NKF</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map((insp, idx) => {
                  const calc = calculateInspectionScores(
                    insp.subValues,
                    insp.category || 'fisik_sungai'
                  );
                  const isPras = insp.category === 'kinerja_prasarana';

                  return (
                    <tr key={insp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 min-w-[180px]">
                        <div className="font-bold text-slate-800">{insp.namaSungai}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {insp.kodeInspeksi} · Ruas {insp.noRuas}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isPras
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {isPras ? 'Prasarana' : 'Fisik'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.palung?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.bantaranKanan?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.bantaranKiri?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.sempadanKanan?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.sempadanKiri?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.muara?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {calc.componentResults.buanganLimbah?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-semibold">
                        {calc.componentResults.kinerjaPrasarana?.nilaiFisikKomponen?.toFixed(1) || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0B2C5F] text-sm">
                        {calc.nkfTotal.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            calc.riskLevel === 'Risiko Rendah (RR)'
                              ? 'bg-emerald-100 text-emerald-800'
                              : calc.riskLevel === 'Risiko Sedang (RS)'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {calc.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AGGREGATE SUMMARY BY BALAI & INSPECTOR */}
      {activeTab === 'aggregate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Balai PSDA */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1B65A6]" />
                <span>Rekapitulasi per Balai PSDA</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Balai PSDA</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Input</th>
                  <th className="py-2.5 px-3 text-right">Total Panjang</th>
                  <th className="py-2.5 px-3 text-right">Rerata NKF</th>
                  <th className="py-2.5 px-3 text-center">Tinggi Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balaiStats.map((item) => {
                  const avg = item.count > 0 ? (item.sumNkf / item.count).toFixed(1) : '-';
                  return (
                    <tr key={item.balai} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.balai}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#0B2C5F]">
                        {item.count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.totalKm.toFixed(1)} Km
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {avg !== '-' ? `${avg}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.highRisk > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            {item.highRisk} Ruas
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* By Inspector */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-[#1B65A6]" />
                <span>Rekapitulasi per Petugas Inspektor</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Nama &amp; NIP Petugas</th>
                  <th className="py-2.5 px-3">Unit Balai</th>
                  <th className="py-2.5 px-3 text-center">Inputan</th>
                  <th className="py-2.5 px-3 text-right">Rerata NKF</th>
                  <th className="py-2.5 px-3 text-center">Input Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspectorStats.map((item) => (
                  <tr key={item.nip + item.name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">NIP: {item.nip}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {item.balai}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#0B2C5F]">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {item.avgNkf.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                      {item.latestDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 mb-1">
              Konfirmasi Hapus Data Inputan
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus data inputan blangko ini? Tindakan ini akan menghapus data penilaian dan catatan terkait dari database rekapitulasi.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
