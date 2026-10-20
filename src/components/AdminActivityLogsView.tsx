import React, { useMemo, useState } from 'react';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  PlusCircle,
  Pencil,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Radio,
} from 'lucide-react';
import {
  ActivityLog,
  BALAI_PSDA_OPTIONS,
  BalaiPSDA,
  UserAccount,
} from '../types/silussi';

interface AdminActivityLogsViewProps {
  logs: ActivityLog[];
  currentUser: UserAccount;
  onNavigateToRekap?: () => void;
  onNavigateToAccounts?: () => void;
}

export const AdminActivityLogsView: React.FC<AdminActivityLogsViewProps> = ({
  logs,
  currentUser,
  onNavigateToRekap,
  onNavigateToAccounts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [balaiFilter, setBalaiFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action type filter
      if (actionFilter !== 'ALL' && log.actionType !== actionFilter) {
        return false;
      }
      // Balai filter
      if (balaiFilter !== 'ALL' && log.actorBalai !== balaiFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = log.actorName.toLowerCase().includes(q);
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesDetail = log.detail.toLowerCase().includes(q);
        const matchesBalai = log.actorBalai.toLowerCase().includes(q);
        const matchesId = log.relatedId?.toLowerCase().includes(q);
        if (
          !matchesActor &&
          !matchesSummary &&
          !matchesDetail &&
          !matchesBalai &&
          !matchesId
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, balaiFilter, roleFilter, searchQuery]);

  // Activity stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = logs.filter((l) => l.timestamp.startsWith(today)).length;
    const inspectionCount = logs.filter(
      (l) =>
        l.actionType === 'CREATE_INSPECTION' ||
        l.actionType === 'UPDATE_INSPECTION'
    ).length;
    const accountCount = logs.filter(
      (l) =>
        l.actionType === 'REGISTER_ACCOUNT' ||
        l.actionType === 'APPROVE_ACCOUNT' ||
        l.actionType === 'REJECT_ACCOUNT'
    ).length;
    return {
      total: logs.length,
      today: todayCount,
      inspections: inspectionCount,
      accounts: accountCount,
    };
  }, [logs]);

  const resetFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
    setBalaiFilter('ALL');
    setRoleFilter('ALL');
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (actionType: ActivityLog['actionType']) => {
    switch (actionType) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
            <LogIn className="w-3 h-3" />
            LOGIN
          </span>
        );
      case 'CREATE_INSPECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
            <PlusCircle className="w-3 h-3 text-emerald-600" />
            INPUT BLANGKO
          </span>
        );
      case 'UPDATE_INSPECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-50 border border-sky-300 text-sky-800">
            <Pencil className="w-3 h-3 text-[#1B65A6]" />
            EDIT DATA
          </span>
        );
      case 'APPROVE_ACCOUNT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-teal-50 border border-teal-300 text-teal-800">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            SETUJUI AKUN
          </span>
        );
      case 'REJECT_ACCOUNT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 border border-rose-300 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            TOLAK AKUN
          </span>
        );
      case 'REGISTER_ACCOUNT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 border border-amber-300 text-amber-800">
            <UserPlus className="w-3 h-3 text-amber-600" />
            DAFTAR AKUN
          </span>
        );
      case 'UPDATE_FOLLOWUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-50 border border-violet-300 text-violet-800">
            <AlertCircle className="w-3 h-3 text-violet-600" />
            TINDAK LANJUT
          </span>
        );
      case 'EXPORT_REPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-700">
            <Download className="w-3 h-3" />
            EKSPOR LAPORAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            {actionType}
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Waktu',
      'Aktor',
      'Peran',
      'Balai PSDA',
      'Tipe Aksi',
      'Ringkasan',
      'Detail Keterangan',
      'ID Terkait',
    ];
    const rows = filteredLogs.map((l) => [
      formatTimestamp(l.timestamp),
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorRole,
      `"${l.actorBalai.replace(/"/g, '""')}"`,
      l.actionType,
      `"${l.summary.replace(/"/g, '""')}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      l.relatedId || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SiLussi_Log_Aktivitas_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Log Kegiatan Si-Lussi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <h2>REKAM JEJAK LOG KEGIATAN &amp; AUDIT TRAIL SI-LUSSI v2.0</h2>
        <p>Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah</p>
        <p>Tanggal Unduh: ${new Date().toLocaleString('id-ID')}</p>
        <table border="1">
          <thead>
            <tr style="background-color: #0B2C5F; color: #ffffff; font-weight: bold;">
              <th>Waktu</th>
              <th>Nama Aktor</th>
              <th>Peran</th>
              <th>Balai PSDA</th>
              <th>Tipe Aksi</th>
              <th>Ringkasan Kegiatan</th>
              <th>Detail / Skor / Catatan</th>
              <th>ID Terkait</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs
              .map(
                (l) => `
              <tr>
                <td>${formatTimestamp(l.timestamp)}</td>
                <td>${l.actorName}</td>
                <td>${l.actorRole}</td>
                <td>${l.actorBalai}</td>
                <td>${l.actionType}</td>
                <td>${l.summary}</td>
                <td>${l.detail}</td>
                <td>${l.relatedId || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SiLussi_Log_Kegiatan_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Institutional Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#1B65A6]">
                Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                Live Audit Trail
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B2C5F] mt-1 flex items-center gap-2.5">
              <History className="w-6 h-6 text-[#1B65A6]" />
              Log Rekam Jejak Kegiatan Sistem (Audit Trail)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catatan riwayat seluruh aktivitas masuk akun, penginputan blangko, pengeditan data, persetujuan akun inspektor, dan pembaruan status tindak lanjut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Excel (.xls)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Log Aktivitas
            </div>
            <div className="text-2xl font-extrabold text-[#0B2C5F] font-mono mt-1">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Tercatat pada database
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
            <div className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">
              Aktivitas Hari Ini
            </div>
            <div className="text-2xl font-extrabold text-[#1B65A6] font-mono mt-1">
              {stats.today}
            </div>
            <div className="text-[11px] text-sky-700 mt-0.5">
              Kegiatan tercatat hari ini
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Input &amp; Edit Blangko
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              {stats.inspections}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Blangko fisik &amp; prasarana
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Pendaftaran &amp; Akun
            </div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
              {stats.accounts}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Persetujuan &amp; pendaftar
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama petugas, NIP, ringkasan, atau keterangan kegiatan..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#1B65A6] focus:ring-1 focus:ring-[#1B65A6] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kategori / Tipe Aksi
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#1B65A6] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tipe Aksi</option>
              <option value="CREATE_INSPECTION">Input Blangko Baru (CREATE)</option>
              <option value="UPDATE_INSPECTION">Edit Data Blangko (UPDATE)</option>
              <option value="UPDATE_FOLLOWUP">Pembaruan Tindak Lanjut</option>
              <option value="APPROVE_ACCOUNT">Persetujuan Akun Inspektor</option>
              <option value="REJECT_ACCOUNT">Penolakan Akun Inspektor</option>
              <option value="REGISTER_ACCOUNT">Pendaftaran Akun Baru</option>
              <option value="LOGIN">Masuk Akun (LOGIN)</option>
              <option value="EXPORT_REPORT">Ekspor Dokumen Blangko</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Unit Kerja Balai PSDA
            </label>
            <select
              value={balaiFilter}
              onChange={(e) => setBalaiFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#1B65A6] outline-none cursor-pointer"
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
              Peran Akun
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#1B65A6] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Peran</option>
              <option value="admin">Administrator Pengelola</option>
              <option value="inspector">Inspektor Lapangan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Activity Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-bold text-[#0B2C5F]">
              Daftar Rekam Jejak Aktivitas
            </h2>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0B2C5F]/10 text-[#0B2C5F]">
              {filteredLogs.length} Entri
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Diurutkan dari aktivitas terbaru
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">Waktu &amp; Tanggal</th>
                <th className="py-3 px-4 whitespace-nowrap">Petugas / Aktor</th>
                <th className="py-3 px-4 whitespace-nowrap">Tipe Aksi</th>
                <th className="py-3 px-4">Ringkasan Kegiatan</th>
                <th className="py-3 px-4">Rincian Teknis / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      Tidak ada log kegiatan yang sesuai dengan filter.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Coba ubah kata kunci pencarian atau reset filter.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#0B2C5F] cursor-pointer"
                    >
                      Reset Semua Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] font-semibold text-[#0B2C5F] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {log.actorName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                log.actorRole === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.actorRole === 'admin'
                                ? 'Admin'
                                : 'Inspektor'}
                            </span>
                            <span>{log.actorBalai}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 leading-snug">
                        {log.summary}
                      </div>
                      {log.relatedId && (
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          ID: {log.relatedId}
                        </div>
                      )}
                    </td>

                    {/* Detail */}
                    <td className="py-3 px-4">
                      <div className="text-slate-600 text-[11px] leading-relaxed max-w-md">
                        {log.detail}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
