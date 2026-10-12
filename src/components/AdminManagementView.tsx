import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  UserAccount,
} from '../types/silussi';

interface AdminManagementViewProps {
  currentUser: UserAccount;
  users: UserAccount[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  currentUser,
  users,
  onApproveUser,
  onRejectUser,
}) => {
  const [balaiFilter, setBalaiFilter] = useState<string>('ALL');

  const pendingUsers = useMemo(
    () => users.filter((u) => u.role === 'inspector' && u.status === 'pending'),
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

        <div className="px-3.5 py-2 rounded-lg bg-[#0B2C5F] text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Users className="w-3.5 h-3.5" />
          Persetujuan Akun ({pendingUsers.length} Menunggu)
        </div>
      </div>

      <div className="space-y-6">
        {/* Pending Approvals Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/40">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0B2C5F] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Antrean Persetujuan Akun Inspektor Baru ({pendingUsers.length})
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Setiap akun Inspektor yang mendaftar pada portal awal harus disetujui oleh Administrator sebelum dapat menginput blangko lapangan.
              </p>
            </div>
            {currentUser.role !== 'admin' && (
              <span className="text-xs font-semibold text-amber-800">
                Mode Baca Saja (Hanya Administrator yang dapat menyetujui)
              </span>
            )}
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
