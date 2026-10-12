import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  LogIn,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { SiLussiLogo } from './SiLussiLogo';
import {
  BALAI_PSDA_OPTIONS,
  BalaiPSDA,
  UserAccount,
} from '../types/silussi';

interface AuthPortalProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterInspector: (
    newUser: Omit<UserAccount, 'id' | 'status' | 'registeredAt' | 'role'>
  ) => Promise<UserAccount> | UserAccount;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  users,
  onLoginSuccess,
  onRegisterInspector,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNoticeId, setPendingNoticeId] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJabatan, setRegJabatan] = useState('Inspektor Sungai Lapangan');
  const [regBalai, setRegBalai] = useState<BalaiPSDA>('BPSDA Jratun Seluna');
  const [regPassword, setRegPassword] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<UserAccount | null>(
    null
  );

  // Live lookup of registered user from real-time `users` prop
  const liveRegisteredUser = useMemo(() => {
    if (!registeredUser) return null;
    return (
      users.find(
        (u) =>
          u.id === registeredUser.id ||
          (u.role === 'inspector' &&
            u.nip.replace(/\s+/g, '') ===
              registeredUser.nip.replace(/\s+/g, ''))
      ) || registeredUser
    );
  }, [users, registeredUser]);

  const livePendingNoticeUser = useMemo(
    () =>
      pendingNoticeId
        ? users.find((u) => u.id === pendingNoticeId) || null
        : null,
    [users, pendingNoticeId]
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingNoticeId(null);

    const rawId = identifier.trim();
    const lowerId = rawId.toLowerCase();
    const compactId = rawId.replace(/\s+/g, '');

    // Match all candidate accounts with this NIP/email/name
    const candidates = users.filter(
      (u) =>
        u.nip.replace(/\s+/g, '') === compactId ||
        u.email.toLowerCase() === lowerId ||
        u.name.toLowerCase() === lowerId
    );

    // Prefer the one whose password matches
    const matched =
      candidates.find(
        (u) => u.password === password || u.password === password.trim()
      ) || candidates[0];

    if (
      !matched ||
      (matched.password !== password && matched.password !== password.trim())
    ) {
      setErrorMessage(
        'NIP / Email atau kata sandi tidak sesuai. Silakan periksa kembali.'
      );
      return;
    }

    if (matched.status === 'pending') {
      setPendingNoticeId(matched.id);
      return;
    }

    if (matched.status === 'rejected') {
      setErrorMessage(
        'Pengajuan akun Inspektor Anda ditolak oleh Administrator. Silakan daftar ulang pada tab Daftar Akun Inspektor.'
      );
      return;
    }

    onLoginSuccess(matched);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = regName.trim();
    const cleanNip = regNip.trim();
    const compactNip = cleanNip.replace(/\s+/g, '');
    const cleanEmail =
      regEmail.trim() || `${compactNip.toLowerCase()}@pupr.jatengprov.go.id`;
    const cleanPassword = regPassword.trim();

    if (!cleanName || !cleanNip || !cleanPassword) {
      setErrorMessage(
        'Mohon lengkapi Nama Lengkap, NIP / ID Petugas, dan Kata Sandi.'
      );
      return;
    }

    try {
      setRegSubmitting(true);
      const created = await onRegisterInspector({
        name: cleanName,
        nip: cleanNip,
        email: cleanEmail,
        jabatan: regJabatan.trim() || 'Inspektor Sungai Lapangan',
        balaiPsda: regBalai,
        password: cleanPassword,
      });

      setRegisteredUser(created);
      setRegName('');
      setRegNip('');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat mendaftarkan akun Inspektor.'
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071D42] via-[#0B2C5F] to-[#15528E] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
        {/* Centered Si-Lussi Logo & Direct Portal Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <SiLussiLogo size="lg" showText={true} />
          <h1 className="font-display text-base sm:text-lg font-extrabold text-[#0B2C5F] mt-3">
            Portal Akses Administrator Pengelola &amp; Inspektor Lapangan
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">
            Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#0B2C5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setPendingNoticeId(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#0B2C5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Daftar Akun Inspektor
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Real-Time Pending Account Notice on Login Tab */}
        {livePendingNoticeUser && mode === 'login' && (
          <div
            className={`mb-5 p-4 rounded-xl border text-xs ${
              livePendingNoticeUser.status === 'approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {livePendingNoticeUser.status === 'approved' ? (
              <>
                <div className="flex items-center gap-2 font-semibold text-emerald-800 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Akun Anda Telah Disetujui Administrator!
                </div>
                <p className="leading-relaxed">
                  Halo <strong>{livePendingNoticeUser.name}</strong>, akun
                  Inspektor Anda sudah aktif secara real-time.
                </p>
                <button
                  type="button"
                  onClick={() => onLoginSuccess(livePendingNoticeUser)}
                  className="mt-2.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Masuk Sekarang <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  Akun Menunggu Persetujuan Administrator (Real-Time)
                </div>
                <p className="leading-relaxed text-amber-800/90">
                  Halo <strong>{livePendingNoticeUser.name}</strong> (
                  {livePendingNoticeUser.balaiPsda}), pendaftaran akun Inspektor
                  Anda sudah masuk di{' '}
                  <strong>Antrean Persetujuan Akun Inspektor Baru</strong>.
                  Halaman ini akan otomatis aktif begitu Administrator menyetujui.
                </p>
              </>
            )}
          </div>
        )}

        {/* Registration Real-Time Status Notice */}
        {liveRegisteredUser && mode === 'register' && (
          <div
            className={`mb-5 p-4 rounded-xl border text-xs ${
              liveRegisteredUser.status === 'approved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {liveRegisteredUser.status === 'approved'
                  ? 'Akun Disetujui Administrator!'
                  : 'Pendaftaran Berhasil Masuk ke Antrean Real-Time'}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            </div>

            {liveRegisteredUser.status === 'approved' ? (
              <>
                <p className="leading-relaxed">
                  Akun Inspektor <strong>{liveRegisteredUser.name}</strong> (NIP:{' '}
                  <span className="font-mono">{liveRegisteredUser.nip}</span>)
                  telah disetujui oleh Administrator.
                </p>
                <button
                  type="button"
                  onClick={() => onLoginSuccess(liveRegisteredUser)}
                  className="mt-3 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Langsung Masuk ke Portal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <p className="leading-relaxed">
                  Akun atas nama <strong>{liveRegisteredUser.name}</strong> (NIP:{' '}
                  <span className="font-mono">{liveRegisteredUser.nip}</span> ·{' '}
                  {liveRegisteredUser.balaiPsda}) telah masuk secara{' '}
                  <strong>real-time</strong> ke urutan teratas{' '}
                  <span className="font-semibold underline">
                    Antrean Persetujuan Akun Inspektor Baru
                  </span>
                  .
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setIdentifier(liveRegisteredUser.nip);
                      setPendingNoticeId(liveRegisteredUser.id);
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#0B2C5F] hover:underline cursor-pointer"
                  >
                    Ke Halaman Login <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIP / Email / Nama Akun Terdaftar
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan NIP atau Email Kedinasan"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] focus:ring-2 focus:ring-[#1B65A6]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] focus:ring-2 focus:ring-[#1B65A6]/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0B2C5F] hover:bg-[#143d7d] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Masuk ke Portal Si-Lussi
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar Inspektor{' '}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: Adi Nugroho, S.T."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] focus:ring-2 focus:ring-[#1B65A6]/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Kerja Balai PSDA <span className="text-red-600">*</span>
                </label>
                <select
                  value={regBalai}
                  onChange={(e) => setRegBalai(e.target.value as BalaiPSDA)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                >
                  {BALAI_PSDA_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Kedinasan (Opsional)
                </label>
                <input
                  type="text"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@pupr.jatengprov.go.id"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] outline-none"
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
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Baru <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={regSubmitting}
              className="w-full py-2.5 px-4 bg-[#1B65A6] hover:bg-[#0B2C5F] disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {regSubmitting
                ? 'Mengirim Pendaftaran Real-Time...'
                : 'Ajukan Pendaftaran Akun Inspektor'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
