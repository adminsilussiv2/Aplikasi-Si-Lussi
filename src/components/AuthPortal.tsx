import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
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
  ) => UserAccount;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  users,
  onLoginSuccess,
  onRegisterInspector,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<UserAccount | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJabatan, setRegJabatan] = useState('Inspektor Sungai Lapangan');
  const [regBalai, setRegBalai] = useState<BalaiPSDA>('BPSDA Jratun Seluna');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccessUser, setRegSuccessUser] = useState<UserAccount | null>(
    null
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingNotice(null);

    const trimmedEmail = email.trim().toLowerCase();
    const matched = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!matched || matched.password !== password) {
      setErrorMessage(
        'Email atau kata sandi tidak sesuai. Silakan periksa kembali atau gunakan tombol akses cepat di bawah.'
      );
      return;
    }

    if (matched.status === 'pending') {
      setPendingNotice(matched);
      return;
    }

    if (matched.status === 'rejected') {
      setErrorMessage(
        'Pengajuan akun Inspektor Anda ditolak oleh Administrator. Silakan hubungi pengelola Balai PSDA terkait.'
      );
      return;
    }

    onLoginSuccess(matched);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !regName.trim() ||
      !regNip.trim() ||
      !regEmail.trim() ||
      !regPassword.trim()
    ) {
      setErrorMessage(
        'Mohon lengkapi seluruh kolom pendaftaran akun Inspektor.'
      );
      return;
    }

    const exists = users.some(
      (u) => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      setErrorMessage('Alamat email tersebut sudah terdaftar di sistem Si-Lussi.');
      return;
    }

    const created = onRegisterInspector({
      name: regName.trim(),
      nip: regNip.trim(),
      email: regEmail.trim(),
      jabatan: regJabatan.trim() || 'Inspektor Sungai Lapangan',
      balaiPsda: regBalai,
      password: regPassword,
    });

    setRegSuccessUser(created);
    setRegName('');
    setRegNip('');
    setRegEmail('');
    setRegPassword('');
  };

  const handleQuickDemoLogin = (targetUser: UserAccount) => {
    setErrorMessage(null);
    setPendingNotice(null);
    onLoginSuccess(targetUser);
  };

  const adminDemo = users.find(
    (u) => u.role === 'admin' && u.status === 'approved'
  );
  const approvedInspectors = users.filter(
    (u) => u.role === 'inspector' && u.status === 'approved'
  );
  const pendingCount = users.filter(
    (u) => u.role === 'inspector' && u.status === 'pending'
  ).length;

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
              setPendingNotice(null);
              setRegSuccessUser(null);
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
              setPendingNotice(null);
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

        {/* Pending Account Notice */}
        {pendingNotice && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              Akun Menunggu Persetujuan Administrator
            </div>
            <p className="leading-relaxed text-amber-800/90">
              Halo <strong>{pendingNotice.name}</strong> ({pendingNotice.balaiPsda}
              ), pendaftaran akun Inspektor Anda sedang menunggu verifikasi dari{' '}
              <strong>Administrator Pengelola</strong>.
            </p>
          </div>
        )}

        {/* Registration Success Notice */}
        {regSuccessUser && mode === 'register' && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Pendaftaran Akun Inspektor Berhasil Dikirim
            </div>
            <p className="leading-relaxed">
              Akun atas nama <strong>{regSuccessUser.name}</strong> (
              {regSuccessUser.balaiPsda}) kini berstatus{' '}
              <span className="font-semibold underline">
                Menunggu Persetujuan Administrator
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setEmail(regSuccessUser.email);
              }}
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-[#0B2C5F] hover:underline cursor-pointer"
            >
              Kembali ke halaman Login <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Akun Kedinasan / Terdaftar
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@pupr.jatengprov.go.id"
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
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar Inspektor
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
                  NIP / ID Petugas
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
                  Unit Kerja Balai PSDA
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
                  Email Kedinasan
                </label>
                <input
                  type="email"
                  required
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
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#1B65A6] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#1B65A6] hover:bg-[#0B2C5F] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Ajukan Pendaftaran Akun Inspektor
            </button>
          </form>
        )}

        {/* Quick Role Access Panel */}
        <div className="mt-7 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">
              Akses Cepat Masuk Akun
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {pendingCount} antrean akun
            </span>
          </div>

          <div className="space-y-2">
            {adminDemo && (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(adminDemo)}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0B2C5F] bg-slate-50 hover:bg-sky-50/60 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#0B2C5F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1B65A6]" />
                    Administrator — {adminDemo.name}
                  </div>
                  <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                    {adminDemo.jabatan}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    NIP: {adminDemo.nip}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B2C5F] shrink-0" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {approvedInspectors.slice(0, 2).map((insp) => (
                <button
                  key={insp.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(insp)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#1B65A6] bg-white hover:bg-sky-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-[#0B2C5F] truncate">
                    Inspektor: {insp.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {insp.balaiPsda}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
