import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Radio,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  BalaiPSDA,
  UserAccount,
} from '../types/silussi';

interface AdminManagementViewProps {
  currentUser: UserAccount;
  users: UserAccount[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onRegisterInspector: (
    newUser: Omit<UserAccount, 'id' | 'status' | 'registeredAt' | 'role'>
  ) => Promise<UserAccount> | UserAccount;
  onManualRefresh?: () => void;
  onNavigateToRekap?: () => void;
  onNavigateToLogs?: () => void;
  totalInspectionsCount?: number;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  currentUser,
  users,
  onApproveUser,
  onRejectUser,
  onRegisterInspector,
  onManualRefresh,
  onNavigateToRekap,
  onNavigateToLogs,
  totalInspectionsCount,
}) => {
  const [balaiFilter, setBalaiFilter] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Inspector form state
  const [regName, setRegName] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJabatan, setRegJabatan] = useState('Inspektor Sungai Lapangan');
  const [regBalai, setRegBalai] = useState<BalaiPSDA>('BPSDA Jratun Seluna');
  const [regPassword, setRegPassword] = useState('');
  const [formMsg, setFormMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingUsers = useMemo(
    () =>
      users
        .filter((u) => u.role === 'inspector' && u.status === 'pending')
        .sort(
          (a, b) =>
            new Date(b.registeredAt).getTime() -
            new Date(a.registeredAt).getTime()
        ),
    [users]
  );

  const directoryUsers = useMemo(() => {
    return users.filter((u) => {
      if (balaiFilter !== 'ALL' && u.balaiPsda !== balaiFilter) return false;
      return true;
    });
  }, [users, balaiFilter]);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleAdminAddInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const cleanName = regName.trim();
    const cleanNip = regNip.trim();
    const compactNip = cleanNip.replace(/\s+/g, '');
    const cleanEmail =
      regEmail.trim() || `${compactNip.toLowerCase()}@pupr.jatengprov.go.id`;
    const cleanPassword = regPassword.trim();

    if (!cleanName || !cleanNip || !cleanPassword) {
      setFormMsg({
        type: 'error',
        text: 'Mohon lengkapi Nama Lengkap, NIP, dan Kata Sandi.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const created = await onRegisterInspector({
        name: cleanName,
        nip: cleanNip,
        email: cleanEmail,
        jabatan: regJabatan.trim() || 'Inspektor Sungai Lapangan',
        balaiPsda: regBalai,
        password: cleanPassword,
      });

      setFormMsg({
        type: 'success',
        text: `Pendaftaran Inspektor "${created.name}" (NIP: ${created.nip}) berhasil ditambahkan secara real-time ke Antrean Persetujuan.`,
      });
      setRegName('');
      setRegNip('');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setFormMsg({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Gagal mendaftarkan akun Inspektor.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#1B65A6]">
            Tata Kelola Akun Pengguna
          </div>
          <h1 className="font-display text-lg font-bold text-[#0B2C5F]">
            Verifikasi Pendaftaran Akun Inspektor &amp; Direktori Petugas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {onNavigateToRekap && (
            <button
              type="button"
              onClick={onNavigateToRekap}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Buka pilihan rekap seluruh inputan blangko penilaian"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Pilihan Rekap Semua Inputan {totalInspectionsCount !== undefined ? `(${totalInspectionsCount})` : ''}
            </button>
          )}

          {onNavigateToLogs && (
            <button
              type="button"
              onClick={onNavigateToLogs}
              className="px-3.5 py-2 rounded-lg bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Buka rekam jejak log aktivitas sistem (Audit Trail)"
            >
              <History className="w-3.5 h-3.5 text-amber-300" />
              Log Kegiatan Sistem
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setFormMsg(null);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#1B65A6] hover:bg-[#0B2C5F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showAddForm ? 'Tutup Form Pendaftaran' : 'Daftarkan Akun Inspektor'}
          </button>

          <div className="px-3.5 py-2 rounded-lg bg-[#0B2C5F] text-white text-xs font-semibold inline-flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Persetujuan Akun ({pendingUsers.length} Menunggu)
          </div>
        </div>
      </div>

      {/* Collapsible Direct Inspector Registration Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-sky-200 p-5 shadow-xs">
          <h2 className="font-display text-sm font-bold text-[#0B2C5F] mb-1">
            Form Pendaftaran Akun Inspektor Baru
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Daftarkan akun Inspektor baru secara langsung (atau dari halaman Portal Login). Pendaftar akan langsung muncul secara real-time pada Antrean Persetujuan di bawah.
          </p>

          {formMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs font-medium border ${
                formMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {formMsg.text}
            </div>
          )}

          <form
            onSubmit={handleAdminAddInspector}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: Adi Nugroho, S.T."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / ID Petugas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={regNip}
                onChange={(e) => setRegNip(e.target.value)}
                placeholder="19920410 201903 1 002"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Kerja Balai PSDA <span className="text-red-600">*</span>
              </label>
              <select
                value={regBalai}
                onChange={(e) => setRegBalai(e.target.value as BalaiPSDA)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
              >
                {BALAI_PSDA_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Kedinasan (Opsional)
              </label>
              <input
                type="text"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="nama@pupr.jatengprov.go.id"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Tugas
              </label>
              <input
                type="text"
                value={regJabatan}
                onChange={(e) => setRegJabatan(e.target.value)}
                placeholder="Inspektor Sungai Lapangan"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Akun <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Kata sandi login inspektor"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#0B2C5F] hover:bg-[#1B65A6] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {submitting
                  ? 'Menambahkan...'
                  : 'Tambahkan ke Antrean Persetujuan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {/* Pending Approvals Section (Real-Time) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/40">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0B2C5F] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Antrean Persetujuan Akun Inspektor Baru ({pendingUsers.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Setiap akun Inspektor yang mendaftar pada portal awal langsung tampil secara real-time di antrean ini untuk disetujui oleh Administrator.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Real-Time Aktif
              </span>
              {onManualRefresh && (
                <button
                  type="button"
                  onClick={onManualRefresh}
                  className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                  title="Segarkan Data Sekarang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada pengajuan akun Inspektor baru yang menunggu persetujuan saat ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {u.name}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-semibold text-amber-700">
                        Menunggu Verifikasi Administrator
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      NIP: {u.nip} · Email: {u.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      Unit Kerja:{' '}
                      <strong className="text-[#0B2C5F]">{u.balaiPsda}</strong>{' '}
                      · Jabatan: {u.jabatan} · Terdaftar:{' '}
                      {formatTimestamp(u.registeredAt)}
                    </div>
                  </div>

                  {currentUser.role === 'admin' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onApproveUser(u.id)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Setujui Akun Inspektor
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectUser(u.id)}
                        className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-amber-700">
                      Menunggu Keputusan Admin
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Registered Accounts Directory */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0B2C5F]">
                Direktori Akun Pengelola &amp; Inspektor Terdaftar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nama dan NIP Inspektor otomatis terikat saat petugas login dan menginput blangko penilaian sungai.
              </p>
            </div>

            <select
              value={balaiFilter}
              onChange={(e) => setBalaiFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
            >
              <option value="ALL">Semua Balai ({users.length})</option>
              {BALAI_PSDA_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold">
                    Nama Lengkap &amp; Jabatan
                  </th>
                  <th className="py-3 px-3 text-left font-mono font-semibold">
                    NIP / Email
                  </th>
                  <th className="py-3 px-3 text-left font-semibold">
                    Unit Balai
                  </th>
                  <th className="py-3 px-3 text-left font-semibold">
                    Peran Akses
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">
                    Status Verifikasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {directoryUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500">{u.jabatan}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-800">{u.nip}</div>
                      <div className="text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#0B2C5F]">
                      {u.balaiPsda}
                    </td>
                    <td className="py-3 px-3">
                      {u.role === 'admin' ? (
                        <span className="font-bold text-[#0B2C5F]">
                          Administrator Pengelola
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700">
                          Inspektor Lapangan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.status === 'approved' ? (
                        <div>
                          <span className="font-semibold text-emerald-700">
                            Disetujui / Aktif
                          </span>
                          {u.approvedBy && (
                            <div className="text-[11px] text-slate-400">
                              Oleh: {u.approvedBy}
                            </div>
                          )}
                        </div>
                      ) : u.status === 'pending' ? (
                        <span className="font-semibold text-amber-700">
                          Menunggu Persetujuan
                        </span>
                      ) : (
                        <span className="font-semibold text-red-700">
                          Ditolak Administrator
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
