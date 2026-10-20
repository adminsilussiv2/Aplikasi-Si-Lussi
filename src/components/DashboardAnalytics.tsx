import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Eye,
  TrendingUp,
  Waves,
  Download,
  Building2,
  ShieldCheck,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  BLANGKO_COMPONENTS,
  FollowUpStatus,
  InspectionCategory,
  RiverInspection,
  UserAccount,
  WILAYAH_SUNGAI_OPTIONS,
  calculateInspectionScores,
} from '../types/silussi';
import {
  exportAllInspectionsSummaryToCsv,
  exportInspectionToExcelHtml,
} from '../utils/reportExporter';
import { InspectionMapPreview } from './InspectionMapPreview';

interface DashboardAnalyticsProps {
  inspections: RiverInspection[];
  currentUser: UserAccount;
  pendingAccountsCount: number;
  onOpenInspectionCategory: (category: InspectionCategory) => void;
  onSelectInspection: (inspection: RiverInspection) => void;
  onQuickUpdateFollowUp: (
    inspectionId: string,
    newStatus: FollowUpStatus
  ) => void;
  onDeleteInspection: (inspectionId: string) => void;
  onNavigateAdmin: () => void;
  onNavigateToRekap?: () => void;
  onEditInspection?: (inspection: RiverInspection) => void;
  onLogExport: (format: string, inspection?: RiverInspection) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  inspections,
  currentUser,
  pendingAccountsCount,
  onOpenInspectionCategory,
  onSelectInspection,
  onQuickUpdateFollowUp,
  onDeleteInspection,
  onNavigateAdmin,
  onNavigateToRekap,
  onEditInspection,
  onLogExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWs, setSelectedWs] = useState<string>('ALL');
  const [selectedBalai, setSelectedBalai] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const cat = item.category || 'fisik_sungai';
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return false;
      if (selectedWs !== 'ALL' && item.namaWs !== selectedWs) return false;
      if (selectedBalai !== 'ALL' && item.balaiPsda !== selectedBalai)
        return false;
      if (selectedRisk !== 'ALL' && item.riskLevel !== selectedRisk)
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRiver = item.namaSungai.toLowerCase().includes(q);
        const matchPras = (item.namaPrasarana || '').toLowerCase().includes(q);
        const matchRuas = item.noRuas.toLowerCase().includes(q);
        const matchKab = item.kabupatenKota.toLowerCase().includes(q);
        const matchInsp = item.inspectorName.toLowerCase().includes(q);
        const matchKode = item.kodeInspeksi.toLowerCase().includes(q);
        if (
          !matchRiver &&
          !matchPras &&
          !matchRuas &&
          !matchKab &&
          !matchInsp &&
          !matchKode
        )
          return false;
      }
      return true;
    });
  }, [
    inspections,
    selectedCategory,
    selectedWs,
    selectedBalai,
    selectedRisk,
    searchQuery,
  ]);

  // Aggregate Analytics
  const stats = useMemo(() => {
    const total = inspections.length;
    const fisikCount = inspections.filter(
      (i) => (i.category || 'fisik_sungai') === 'fisik_sungai'
    ).length;
    const prasaranaCount = inspections.filter(
      (i) => i.category === 'kinerja_prasarana'
    ).length;

    const totalLengthKm = inspections.reduce(
      (acc, cur) => acc + (cur.panjangRuasKm || 0),
      0
    );
    const avgNkf =
      total > 0
        ? inspections.reduce((acc, cur) => acc + cur.nkfTotal, 0) / total
        : 0;

    const highRiskCount = inspections.filter((i) => i.nkfTotal < 50).length;
    const medRiskCount = inspections.filter(
      (i) => i.nkfTotal >= 50 && i.nkfTotal <= 70
    ).length;
    const lowRiskCount = inspections.filter((i) => i.nkfTotal > 70).length;

    const needFollowUpCount = inspections.filter(
      (i) =>
        i.followUpStatus === 'Perlu Tindak Lanjut' ||
        i.followUpStatus === 'Dalam Penanganan'
    ).length;

    // Average per physical component (for physical inspections)
    const fisikInspections = inspections.filter(
      (i) => (i.category || 'fisik_sungai') === 'fisik_sungai'
    );
    const compAverages = BLANGKO_COMPONENTS.map((comp) => {
      const sum = fisikInspections.reduce((acc, insp) => {
        const c = calculateInspectionScores(insp.subValues, 'fisik_sungai');
        return acc + (c.componentResults[comp.key]?.nilaiFisikKomponen || 0);
      }, 0);
      return {
        key: comp.key,
        title: comp.shortTitle,
        bobotInduk: comp.bobotInduk,
        avgScore:
          fisikInspections.length > 0 ? sum / fisikInspections.length : 0,
      };
    });

    // Breakdown by WS
    const wsBreakdown = WILAYAH_SUNGAI_OPTIONS.map((ws) => {
      const matching = inspections.filter((i) => i.namaWs === ws);
      const avg =
        matching.length > 0
          ? matching.reduce((a, b) => a + b.nkfTotal, 0) / matching.length
          : 0;
      return {
        ws,
        count: matching.length,
        avgNkf: avg,
      };
    });

    return {
      total,
      fisikCount,
      prasaranaCount,
      totalLengthKm,
      avgNkf,
      highRiskCount,
      medRiskCount,
      lowRiskCount,
      needFollowUpCount,
      compAverages,
      wsBreakdown,
    };
  }, [inspections]);

  const chronologicalInspections = useMemo(() => {
    return [...inspections].sort((a, b) =>
      a.tanggalPelaksanaan.localeCompare(b.tanggalPelaksanaan)
    );
  }, [inspections]);

  return (
    <div className="space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-[#0B2C5F] via-[#124285] to-[#1B65A6] rounded-2xl p-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-sky-300">
            Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
            Dashboard Analitik Real-Time Kondisi Fisik &amp; Kinerja Prasarana Sungai
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1 max-w-3xl">
            Masuk sebagai{' '}
            <strong className="text-white">{currentUser.name}</strong> (
            {currentUser.jabatan} · NIP {currentUser.nip}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenInspectionCategory('fisik_sungai')}
            className="px-3.5 py-2.5 rounded-xl bg-white text-[#0B2C5F] hover:bg-sky-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Input Kondisi Fisik Sungai
          </button>

          <button
            type="button"
            onClick={() => onOpenInspectionCategory('kinerja_prasarana')}
            className="px-3.5 py-2.5 rounded-xl bg-sky-400/20 hover:bg-sky-400/30 border border-sky-200/40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Input Kinerja Prasarana
          </button>

          {currentUser.role === 'admin' && onNavigateToRekap && (
            <button
              type="button"
              onClick={onNavigateToRekap}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              title="Buka rekapitulasi lengkap seluruh inputan blangko penilaian sungai"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Pilihan Rekap Semua Inputan ({inspections.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onLogExport('Rekapitulasi Spreadsheet CSV Seluruh Ruas');
              exportAllInspectionsSummaryToCsv(filteredInspections);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Rekap CSV
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Data Inspeksi Terinput
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-[#0B2C5F] tabular-nums">
              {stats.total}
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {stats.totalLengthKm.toFixed(1)} Km Ruas
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.fisikCount} Fisik Sungai · {stats.prasaranaCount} Kinerja Prasarana
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500">
            Rata-Rata Nilai Kondisi / Kinerja (NKF)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-[#1B65A6] tabular-nums">
              {stats.avgNkf.toFixed(2)}%
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {stats.avgNkf > 70
                ? 'Kinerja Baik'
                : stats.avgNkf >= 50
                ? 'Kinerja Cukup'
                : 'Kinerja Buruk'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Ambang Kinerja Baik &gt;70% · Korektif 50–70%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500">
            Temuan Perlu Tindak Lanjut Lapangan
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-amber-700 tabular-nums">
              {stats.needFollowUpCount}
            </span>
            <span className="text-xs font-mono text-red-700 font-semibold tabular-nums">
              {stats.highRiskCount} Rusak Berat (&lt;50%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats.medRiskCount} Risiko Sedang · {stats.lowRiskCount} Risiko Rendah
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500">
            {currentUser.role === 'admin'
              ? 'Profil Administrator & Persetujuan'
              : 'Identitas Inspektor Aktif'}
          </div>
          {currentUser.role === 'admin' ? (
            <>
              <div className="mt-1.5 font-display text-sm font-bold text-[#0B2C5F] truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-slate-700 font-medium truncate">
                {currentUser.jabatan}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                NIP. {currentUser.nip}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Antrean: <strong>{pendingAccountsCount}</strong> akun
                </span>
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="text-xs font-semibold text-[#1B65A6] hover:underline cursor-pointer"
                >
                  Persetujuan Inspektor →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 font-display text-sm font-bold text-[#0B2C5F] truncate">
                {currentUser.name}
              </div>
              <div className="mt-1 text-xs font-mono text-slate-600 truncate">
                NIP. {currentUser.nip}
              </div>
              <div className="mt-1 text-xs text-[#1B65A6] font-semibold">
                {currentUser.balaiPsda}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Map Preview of Inputted Inspections in Central Java */}
      <InspectionMapPreview
        inspections={inspections}
        onSelectInspection={onSelectInspection}
      />

      {/* Real-Time Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Real-Time Trend Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0B2C5F] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1B65A6]" />
                  Tren Real-Time Nilai Kondisi Fisik &amp; Kinerja Prasarana
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan capaian skor (%) terhadap batas ambang Risiko Rendah (&gt;70%) dan Risiko Tinggi (&lt;50%).
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-700 font-semibold">&gt;70 RR</span>
                <span className="text-slate-300">·</span>
                <span className="text-amber-700 font-semibold">50–70 RS</span>
                <span className="text-slate-300">·</span>
                <span className="text-red-700 font-semibold">&lt;50 RT</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {chronologicalInspections.map((item) => {
                const barColor =
                  item.nkfTotal > 70
                    ? 'bg-emerald-600'
                    : item.nkfTotal >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-600';

                const textColor =
                  item.nkfTotal > 70
                    ? 'text-emerald-700'
                    : item.nkfTotal >= 50
                    ? 'text-amber-700'
                    : 'text-red-700';

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectInspection(item)}
                    className="group p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="min-w-0 pr-3">
                        <span className="font-bold text-slate-900 group-hover:text-[#0B2C5F]">
                          {item.namaSungai}
                        </span>
                        {item.category === 'kinerja_prasarana' && (
                          <span className="ml-1.5 text-[11px] font-semibold text-[#1B65A6]">
                            [Prasarana: {item.namaPrasarana || item.noRuas}]
                          </span>
                        )}
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-slate-600">{item.noRuas}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {item.namaWs}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className={`font-bold tabular-nums ${textColor}`}>
                          {item.nkfTotal.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({item.physicalStatusLabel})
                        </span>
                      </div>
                    </div>

                    <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 left-[50%] w-px bg-red-400/70 z-10"
                        title="Batas Risiko Tinggi (50%)"
                      />
                      <div
                        className="absolute top-0 bottom-0 left-[70%] w-px bg-emerald-600/70 z-10"
                        title="Batas Risiko Rendah (70%)"
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(100, item.nkfTotal)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Klik pada baris untuk membuka Blangko lengkap &amp; foto dokumentasi</span>
            <span className="font-mono">Total {chronologicalInspections.length} Data</span>
          </div>
        </div>

        {/* Right 5 Columns: Component Averages & 6 Wilayah Sungai Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-display text-sm font-bold text-[#0B2C5F] pb-3 border-b border-slate-100">
              Rata-Rata Nilai Fisik Komponen Sungai
            </h2>
            <div className="mt-4 space-y-3">
              {stats.compAverages.map((c) => (
                <div key={c.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {c.title}
                    </span>
                    <span className="font-mono font-bold text-[#0B2C5F] tabular-nums">
                      {c.avgScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B65A6] rounded-full"
                      style={{ width: `${Math.min(100, c.avgScore)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-display text-sm font-bold text-[#0B2C5F] pb-3 border-b border-slate-100 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-[#1B65A6]" />
              Rekapitulasi 6 Wilayah Sungai (WS) Jawa Tengah
            </h2>
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              {stats.wsBreakdown.map((w) => (
                <div
                  key={w.ws}
                  onClick={() =>
                    setSelectedWs(selectedWs === w.ws ? 'ALL' : w.ws)
                  }
                  className="py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{w.ws}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500">{w.count} data</span>
                  </div>
                  <div className="font-mono font-bold tabular-nums text-[#0B2C5F]">
                    {w.count > 0
                      ? `Rata-rata ${w.avgNkf.toFixed(1)}%`
                      : 'Belum ada data'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Master Inspection Table with Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B2C5F]">
                Daftar Hasil Inspeksi Kondisi Fisik Sungai &amp; Kinerja Prasarana
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {filteredInspections.length} dari {inspections.length} rekaman blangko inspeksi.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sungai, prasarana, ruas..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Jenis Inspeksi (2 Jenis)</option>
              <option value="fisik_sungai">1. Kondisi Fisik Sungai</option>
              <option value="kinerja_prasarana">2. Kinerja Prasarana Sungai</option>
            </select>

            <select
              value={selectedWs}
              onChange={(e) => setSelectedWs(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Wilayah Sungai (6 WS)</option>
              {WILAYAH_SUNGAI_OPTIONS.map((ws) => (
                <option key={ws} value={ws}>
                  {ws}
                </option>
              ))}
            </select>

            <select
              value={selectedBalai}
              onChange={(e) => setSelectedBalai(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Unit Balai PSDA</option>
              {BALAI_PSDA_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Tingkat Risiko</option>
              <option value="Risiko Tinggi (RT)">
                Risiko Tinggi (&lt;50% — Rehabilitatif)
              </option>
              <option value="Risiko Sedang (RS)">
                Risiko Sedang (50–70% — Korektif)
              </option>
              <option value="Risiko Rendah (RR)">
                Risiko Rendah (&gt;70% — Preventif)
              </option>
            </select>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 text-left font-semibold">
                  Sungai / Prasarana &amp; Ruas
                </th>
                <th className="py-3 px-3 text-left font-semibold">
                  Jenis Inspeksi
                </th>
                <th className="py-3 px-3 text-left font-semibold">
                  Wilayah Sungai &amp; Balai PSDA
                </th>
                <th className="py-3 px-3 text-left font-semibold">
                  Inspektor (Otomatis)
                </th>
                <th className="py-3 px-3 text-right font-mono font-semibold">
                  Skor (%)
                </th>
                <th className="py-3 px-3 text-left font-semibold">
                  Kondisi &amp; Rekomendasi
                </th>
                <th className="py-3 px-3 text-left font-semibold">
                  Status Tindak Lanjut
                </th>
                <th className="py-3 px-4 text-right font-semibold">
                  Blangko &amp; Ekspor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Tidak ada data inspeksi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((insp) => {
                  const totalPhotos = Object.values(insp.componentDocs).reduce(
                    (acc, d) => acc + (d?.photos?.length || 0),
                    0
                  );

                  const nkfTextColor =
                    insp.nkfTotal > 70
                      ? 'text-emerald-700'
                      : insp.nkfTotal >= 50
                      ? 'text-amber-700'
                      : 'text-red-700';

                  return (
                    <tr
                      key={insp.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {insp.namaSungai}
                        </div>
                        {insp.category === 'kinerja_prasarana' &&
                          insp.namaPrasarana && (
                            <div className="font-semibold text-[#1B65A6] mt-0.5">
                              {insp.namaPrasarana}
                            </div>
                          )}
                        <div className="text-slate-600 mt-0.5">{insp.noRuas}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {insp.kodeInspeksi} · {insp.tanggalPelaksanaan} ·{' '}
                          {insp.kabupatenKota}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {insp.category === 'kinerja_prasarana'
                            ? 'Kinerja Prasarana'
                            : 'Kondisi Fisik Sungai'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {insp.koordinatAwal}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#0B2C5F]">
                          {insp.namaWs}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {insp.balaiPsda}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {insp.inspectorName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          NIP. {insp.inspectorNip}
                        </div>
                        <div className="text-[11px] text-[#1B65A6] mt-0.5">
                          {totalPhotos} foto komponen
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div
                          className={`text-sm font-extrabold tabular-nums ${nkfTextColor}`}
                        >
                          {insp.nkfTotal.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className={`font-bold ${nkfTextColor}`}>
                          {insp.physicalStatusLabel} · {insp.riskLevel}
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          {insp.performanceLevel} ·{' '}
                          <span className="underline">
                            {insp.maintenanceAction}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={insp.followUpStatus}
                          onChange={(e) =>
                            onQuickUpdateFollowUp(
                              insp.id,
                              e.target.value as FollowUpStatus
                            )
                          }
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-[#1B65A6] outline-none cursor-pointer"
                        >
                          <option value="Aman / Terkendali">
                            Aman / Terkendali
                          </option>
                          <option value="Perlu Tindak Lanjut">
                            Perlu Tindak Lanjut
                          </option>
                          <option value="Dalam Penanganan">
                            Dalam Penanganan
                          </option>
                          <option value="Selesai Ditindaklanjuti">
                            Selesai Ditindaklanjuti
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {onEditInspection && (
                            <button
                              type="button"
                              onClick={() => onEditInspection(insp)}
                              className="px-2.5 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-[#1B65A6] text-[#0B2C5F] hover:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              title="Edit Data Blangko Penilaian Ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectInspection(insp)}
                            className="px-3 py-1.5 rounded-lg bg-[#0B2C5F] hover:bg-[#1B65A6] text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Blangko &amp; PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onLogExport('Spreadsheet Excel (.xls)', insp);
                              exportInspectionToExcelHtml(insp);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1B65A6] text-slate-600 hover:text-[#0B2C5F] transition-colors cursor-pointer"
                            title="Unduh Blangko Excel (.xls)"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => onDeleteInspection(insp.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              title="Hapus Data Inspeksi (Khusus Administrator)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
