/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  Waves,
  Building2,
} from 'lucide-react';
import {
  ActivityLog,
  FollowUpStatus,
  InspectionCategory,
  RiverInspection,
  UserAccount,
} from './types/silussi';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_INSPECTIONS,
  INITIAL_USERS,
} from './data/seedData';
import { SiLussiBrandMark } from './components/SiLussiLogo';
import { AuthPortal } from './components/AuthPortal';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { InspectionInputWorkspace } from './components/InspectionInputWorkspace';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { AdminManagementView } from './components/AdminManagementView';

const STORAGE_KEYS = {
  USERS: 'silussi_v2_jateng_users_v6',
  INSPECTIONS: 'silussi_v2_jateng_inspections_v6',
  LOGS: 'silussi_v2_jateng_logs_v6',
};

const REALTIME_CHANNEL_NAME = 'silussi_v2_realtime_channel';

type ActiveTab =
  | 'dashboard'
  | 'input_fisik'
  | 'input_prasarana'
  | 'accounts';

function mergeUsersList(
  primary: UserAccount[],
  secondary: UserAccount[]
): UserAccount[] {
  const map = new Map<string, UserAccount>();
  for (const u of [...primary, ...secondary]) {
    if (!u || !u.nip) continue;
    const key = u.nip.replace(/\s+/g, '');
    const existing = map.get(key);
    if (!existing) {
      map.set(key, u);
    } else {
      // Prefer approved status or newer registration
      if (u.status === 'approved' && existing.status !== 'approved') {
        map.set(key, u);
      } else if (
        existing.status !== 'approved' &&
        new Date(u.registeredAt).getTime() >
          new Date(existing.registeredAt).getTime()
      ) {
        map.set(key, u);
      }
    }
  }
  return Array.from(map.values());
}

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [inspections, setInspections] = useState<RiverInspection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      return saved ? JSON.parse(saved) : INITIAL_INSPECTIONS;
    } catch {
      return INITIAL_INSPECTIONS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeNav, setActiveNav] = useState<ActiveTab>('dashboard');
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    string | null
  >(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const usersRef = useRef<UserAccount[]>(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const currentUserRef = useRef<UserAccount | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const showToast = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(null), 4500);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // Ignore storage quota issues
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.INSPECTIONS,
        JSON.stringify(inspections)
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [inspections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
    } catch {
      // Ignore
    }
  }, [activityLogs]);

  // Apply incoming real-time users list & notify Admin if a new pending inspector arrived
  const applyIncomingRealtimeUsers = useCallback(
    (incomingUsers: UserAccount[], incomingLogs?: ActivityLog[]) => {
      if (!Array.isArray(incomingUsers) || incomingUsers.length === 0) return;

      setUsers((prev) => {
        const prevPendingIds = new Set(
          prev
            .filter((u) => u.role === 'inspector' && u.status === 'pending')
            .map((u) => u.id)
        );
        const merged = mergeUsersList(incomingUsers, prev);
        const newlyAddedPending = merged.filter(
          (u) =>
            u.role === 'inspector' &&
            u.status === 'pending' &&
            !prevPendingIds.has(u.id)
        );

        if (
          newlyAddedPending.length > 0 &&
          currentUserRef.current?.role === 'admin'
        ) {
          const newest = newlyAddedPending[0];
          showToast(
            `Pendaftar Inspektor baru masuk (Real-Time): ${newest.name} (NIP: ${newest.nip} · ${newest.balaiPsda})`
          );
        }
        return merged;
      });

      if (Array.isArray(incomingLogs) && incomingLogs.length > 0) {
        setActivityLogs(incomingLogs);
      }
    },
    [showToast]
  );

  // Fetch & sync users with backend server
  const syncUsersWithServer = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) {
        applyIncomingRealtimeUsers(data.users, data.activityLogs);
      }
    } catch {
      // Ignore network errors if offline
    }
  }, [applyIncomingRealtimeUsers]);

  // Real-time synchronization: Server-Sent Events (/api/events) + Polling + BroadcastChannel + Storage Event
  useEffect(() => {
    // 1. Initial merge of client localStorage users into server store
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientUsers: usersRef.current }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          applyIncomingRealtimeUsers(data.users, data.activityLogs);
        }
      })
      .catch(() => {});

    // 2. Server-Sent Events stream for instant real-time updates across devices/browsers
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (Array.isArray(payload.users)) {
            applyIncomingRealtimeUsers(payload.users, payload.activityLogs);
          }
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Fallback to polling
    }

    // 3. Fast polling every 2.5s to guarantee real-time sync even behind buffering proxies
    const pollTimer = setInterval(() => {
      syncUsersWithServer();
    }, 2500);

    // 4. BroadcastChannel for instant same-browser multi-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && Array.isArray(ev.data.users)) {
          applyIncomingRealtimeUsers(ev.data.users, ev.data.activityLogs);
        }
      };
    } catch {
      // Ignore if BroadcastChannel unsupported
    }

    // 5. Window storage event listener for cross-tab localStorage updates
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            applyIncomingRealtimeUsers(parsed);
          }
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      es?.close();
      clearInterval(pollTimer);
      bc?.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [applyIncomingRealtimeUsers, syncUsersWithServer]);

  const broadcastLocalUsers = (
    updatedUsers: UserAccount[],
    updatedLogs?: ActivityLog[]
  ) => {
    try {
      const bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.postMessage({ users: updatedUsers, activityLogs: updatedLogs });
      bc.close();
    } catch {
      // Ignore
    }
  };

  const appendActivityLog = (
    actor: UserAccount,
    actionType: ActivityLog['actionType'],
    summary: string,
    detail: string,
    relatedId?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorBalai: actor.balaiPsda,
      actionType,
      summary,
      detail,
      relatedId,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveNav('dashboard');
    appendActivityLog(
      user,
      'LOGIN',
      `Masuk ke portal Si-Lussi v2 sebagai ${
        user.role === 'admin' ? 'Administrator Pengelola' : 'Inspektor Lapangan'
      }`,
      `Sesi aktif — Unit Kerja: ${user.balaiPsda}`
    );
    showToast(`Selamat datang di Si-Lussi v2, ${user.name}!`);
  };

  const handleRegisterInspector = async (
    newUserData: Omit<UserAccount, 'id' | 'status' | 'registeredAt' | 'role'>
  ): Promise<UserAccount> => {
    // 1. Try server-authoritative real-time registration first
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Gagal mendaftarkan akun Inspektor baru.'
        );
      }

      const createdUser: UserAccount = data.user;
      const updatedUsers: UserAccount[] = Array.isArray(data.users)
        ? data.users
        : [createdUser, ...usersRef.current];

      setUsers(updatedUsers);
      if (Array.isArray(data.activityLogs)) {
        setActivityLogs(data.activityLogs);
      }
      broadcastLocalUsers(updatedUsers, data.activityLogs);

      if (currentUser?.role === 'admin') {
        showToast(
          `Akun Inspektor ${createdUser.name} berhasil didaftarkan ke Antrean Persetujuan.`
        );
      }
      return createdUser;
    } catch (err) {
      if (err instanceof Error && err.message.includes('sudah terdaftar')) {
        throw err;
      }
      // Fallback local registration if server unreachable
      const fallbackAccount: UserAccount = {
        ...newUserData,
        id: `usr-insp-${Date.now()}`,
        role: 'inspector',
        status: 'pending',
        registeredAt: new Date().toISOString(),
      };

      const nextUsers = [fallbackAccount, ...usersRef.current];
      setUsers(nextUsers);
      appendActivityLog(
        fallbackAccount,
        'REGISTER_ACCOUNT',
        'Mengajukan pendaftaran akun Inspektor baru',
        `NIP ${fallbackAccount.nip} — Unit Kerja: ${fallbackAccount.balaiPsda} (Status: Menunggu Persetujuan Administrator)`
      );
      broadcastLocalUsers(nextUsers);
      return fallbackAccount;
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updatedUsers = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            status: 'approved' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.name,
          }
        : u
    );
    setUsers(updatedUsers);
    broadcastLocalUsers(updatedUsers);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          broadcastLocalUsers(data.users, data.activityLogs);
        }
      }
    } catch {
      // Optimistic state already applied
    }

    showToast(`Akun Inspektor ${target.name} telah disetujui dan diaktifkan.`);
  };

  const handleRejectUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'rejected' as const } : u
    );
    setUsers(updatedUsers);
    broadcastLocalUsers(updatedUsers);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: currentUser.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          broadcastLocalUsers(data.users, data.activityLogs);
        }
      }
    } catch {
      // Optimistic state already applied
    }

    showToast(`Pengajuan akun ${target.name} telah ditolak.`);
  };

  const handleSaveInspection = (newInspection: RiverInspection) => {
    if (!currentUser) return;

    setInspections((prev) => [newInspection, ...prev]);
    setActiveNav('dashboard');

    const jenisLabel =
      newInspection.category === 'kinerja_prasarana'
        ? 'Kinerja Prasarana Sungai'
        : 'Kondisi Fisik Sungai';

    appendActivityLog(
      currentUser,
      'CREATE_INSPECTION',
      `Menginput ${jenisLabel}: ${newInspection.namaSungai} (${newInspection.noRuas})`,
      `Skor ${newInspection.nkfTotal.toFixed(2)}% — ${newInspection.riskLevel} / ${newInspection.performanceLevel} (${newInspection.namaWs}, ${newInspection.balaiPsda})`,
      newInspection.id
    );

    showToast(
      `Data ${jenisLabel} (${newInspection.namaSungai} — ${newInspection.nkfTotal.toFixed(2)}%) berhasil disimpan dan dipetakan di Dashboard!`
    );
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const target = inspections.find((i) => i.id === inspectionId);
    if (!target) return;

    setInspections((prev) => prev.filter((item) => item.id !== inspectionId));
    if (selectedInspectionId === inspectionId) {
      setSelectedInspectionId(null);
    }

    showToast(
      `Data inspeksi ${target.namaSungai} (${target.noRuas}) telah dihapus oleh Administrator.`
    );
  };

  const handleUpdateFollowUp = (
    inspectionId: string,
    newStatus: FollowUpStatus,
    notes?: string
  ) => {
    if (!currentUser) return;
    const target = inspections.find((i) => i.id === inspectionId);
    if (!target) return;

    setInspections((prev) =>
      prev.map((item) =>
        item.id === inspectionId
          ? {
              ...item,
              followUpStatus: newStatus,
              followUpNotes:
                notes !== undefined ? notes : item.followUpNotes,
              verifiedBy: currentUser.name,
              verifiedAt: new Date().toISOString(),
            }
          : item
      )
    );

    appendActivityLog(
      currentUser,
      'UPDATE_FOLLOWUP',
      `Memperbarui status tindak lanjut ${target.namaSungai} (${target.noRuas})`,
      `Status diubah menjadi "${newStatus}". ${notes ? `Catatan: ${notes}` : ''}`,
      target.id
    );

    showToast(
      `Status tindak lanjut ${target.namaSungai} diperbarui menjadi "${newStatus}".`
    );
  };

  const handleLogExport = (format: string, inspection?: RiverInspection) => {
    if (!currentUser) return;
    appendActivityLog(
      currentUser,
      'EXPORT_REPORT',
      `Mengunduh laporan ${format}`,
      inspection
        ? `Dokumen: ${inspection.namaSungai} — ${inspection.noRuas} (${inspection.kodeInspeksi})`
        : 'Rekapitulasi seluruh ruas sungai Dinas PU dan Penataan Ruang Prov. Jawa Tengah'
    );
  };

  const pendingAccountsCount = useMemo(
    () =>
      users.filter((u) => u.role === 'inspector' && u.status === 'pending')
        .length,
    [users]
  );

  const selectedInspection = useMemo(
    () => inspections.find((i) => i.id === selectedInspectionId) || null,
    [inspections, selectedInspectionId]
  );

  if (!currentUser) {
    return (
      <AuthPortal
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterInspector={handleRegisterInspector}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="no-print lg:w-64 bg-[#0B2C5F] text-white flex flex-col justify-between shrink-0 border-r border-white/10">
        <div>
          <div className="p-5 border-b border-white/15 flex items-center justify-between">
            <SiLussiBrandMark variant="light" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-sky-200 hover:bg-white/10"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } lg:block p-4 space-y-1.5`}
          >
            <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-sky-300/80">
              Menu Utama &amp; Inspeksi
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveNav('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNav === 'dashboard'
                  ? 'bg-[#1B65A6] text-white shadow-xs'
                  : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard Analitik &amp; Peta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('input_fisik');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNav === 'input_fisik'
                  ? 'bg-[#1B65A6] text-white shadow-xs'
                  : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Waves className="w-4 h-4 shrink-0 text-sky-300" />
              <span>Input Kondisi Fisik Sungai</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('input_prasarana');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNav === 'input_prasarana'
                  ? 'bg-[#1B65A6] text-white shadow-xs'
                  : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-sky-300" />
              <span>Input Kinerja Prasarana</span>
            </button>

            {/* Administrator-Only Navigation Items */}
            {isAdmin && (
              <>
                <div className="pt-4 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-sky-300/80">
                  Khusus Administrator
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('accounts');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeNav === 'accounts'
                      ? 'bg-[#1B65A6] text-white shadow-xs'
                      : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Persetujuan Inspektor</span>
                  </span>
                  {pendingAccountsCount > 0 && (
                    <span className="font-mono text-[11px] font-bold text-amber-300">
                      ({pendingAccountsCount})
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Active User Session Card at Bottom of Sidebar */}
        <div
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block p-4 border-t border-white/15 bg-[#08224B]`}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B65A6] flex items-center justify-center shrink-0 mt-0.5">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-white" />
              ) : (
                <UserCheck className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-sky-300 truncate">
                {currentUser.jabatan}
              </div>
              <div className="text-[10px] font-mono text-sky-200/80 truncate mt-0.5">
                NIP: {currentUser.nip}
              </div>
              <div className="text-[10px] font-mono text-sky-200/60 truncate">
                {currentUser.balaiPsda}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="mt-3 w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar / Ganti Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8 sticky top-0 z-30">
          {/* Zone 1: Institutional Name */}
          <div className="text-sm font-bold text-[#0B2C5F] truncate whitespace-nowrap shrink-0">
            DPUPR Provinsi Jawa Tengah
          </div>

          {/* Zone 2: Direct Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveNav('dashboard')}
              className={`hover:text-[#0B2C5F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'text-[#0B2C5F] font-bold underline underline-offset-4'
                  : ''
              }`}
            >
              Dashboard Analitik
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('input_fisik')}
              className={`hover:text-[#0B2C5F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'input_fisik'
                  ? 'text-[#0B2C5F] font-bold underline underline-offset-4'
                  : ''
              }`}
            >
              Input Kondisi Fisik Sungai
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('input_prasarana')}
              className={`hover:text-[#0B2C5F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'input_prasarana'
                  ? 'text-[#0B2C5F] font-bold underline underline-offset-4'
                  : ''
              }`}
            >
              Input Kinerja Prasarana
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveNav('accounts')}
                className={`hover:text-[#0B2C5F] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeNav === 'accounts'
                    ? 'text-[#0B2C5F] font-bold underline underline-offset-4'
                    : ''
                }`}
              >
                Persetujuan Inspektor ({pendingAccountsCount})
              </button>
            )}
          </nav>
        </header>

        {/* Toast Banner */}
        {toastBanner && (
          <div className="no-print mx-6 mt-4 p-3.5 rounded-xl bg-[#0B2C5F] text-white text-xs font-semibold flex items-center justify-between shadow-md">
            <span>{toastBanner}</span>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="text-sky-200 hover:text-white ml-4 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardAnalytics
              inspections={inspections}
              currentUser={currentUser}
              pendingAccountsCount={pendingAccountsCount}
              onOpenInspectionCategory={(cat: InspectionCategory) =>
                setActiveNav(
                  cat === 'kinerja_prasarana'
                    ? 'input_prasarana'
                    : 'input_fisik'
                )
              }
              onSelectInspection={(insp) => setSelectedInspectionId(insp.id)}
              onQuickUpdateFollowUp={(id, status) =>
                handleUpdateFollowUp(id, status)
              }
              onDeleteInspection={handleDeleteInspection}
              onNavigateAdmin={() => {
                if (isAdmin) setActiveNav('accounts');
              }}
              onLogExport={handleLogExport}
            />
          )}

          {(activeNav === 'input_fisik' || activeNav === 'input_prasarana') && (
            <InspectionInputWorkspace
              currentUser={currentUser}
              initialCategory={
                activeNav === 'input_prasarana'
                  ? 'kinerja_prasarana'
                  : 'fisik_sungai'
              }
              existingCount={inspections.length}
              onChangeCategory={(cat) =>
                setActiveNav(
                  cat === 'kinerja_prasarana'
                    ? 'input_prasarana'
                    : 'input_fisik'
                )
              }
              onSaveInspection={handleSaveInspection}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {isAdmin && activeNav === 'accounts' && (
            <AdminManagementView
              currentUser={currentUser}
              users={users}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              onRegisterInspector={handleRegisterInspector}
              onManualRefresh={syncUsersWithServer}
            />
          )}
        </main>

        {/* Quiet Institutional Footer */}
        <footer className="no-print border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 flex items-center justify-between gap-2">
          <div>
            <strong>Si-Lussi v2.0</strong> — Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
          </div>
        </footer>
      </div>

      {/* Modal: Detail Blangko & Cetak PDF / Excel */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          currentUser={currentUser}
          onClose={() => setSelectedInspectionId(null)}
          onUpdateFollowUp={handleUpdateFollowUp}
          onDeleteInspection={handleDeleteInspection}
          onLogExport={handleLogExport}
        />
      )}
    </div>
  );
}
