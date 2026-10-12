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
import {
  createFirestoreActivityLog,
  subscribeFirestoreAccounts,
  subscribeFirestoreLogs,
  upsertFirestoreAccount,
} from './firebase';

const STORAGE_KEYS = {
  USERS: 'silussi_v2_jateng_users_v6',
  INSPECTIONS: 'silussi_v2_jateng_inspections_v6',
  LOGS: 'silussi_v2_jateng_logs_v6',
};

const LEGACY_USER_KEYS = [
  'silussi_v2_jateng_users_v6',
  'silussi_v2_jateng_users_v5',
  'silussi_v2_jateng_users_v4',
  'silussi_v2_jateng_users_v3',
];

const REALTIME_CHANNEL_NAME = 'silussi_v2_realtime_channel';

type ActiveTab =
  | 'dashboard'
  | 'input_fisik'
  | 'input_prasarana'
  | 'accounts';

function getAccountTimestamp(u: UserAccount): number {
  const regTime = new Date(u.registeredAt || 0).getTime() || 0;
  const appTime = u.approvedAt ? new Date(u.approvedAt).getTime() || 0 : 0;
  return Math.max(regTime, appTime);
}

function mergeUsersList(
  primary: UserAccount[],
  secondary: UserAccount[]
): UserAccount[] {
  const map = new Map<string, UserAccount>();
  for (const u of [...primary, ...secondary]) {
    if (!u || !u.nip) continue;
    // Key by role + compact NIP so admin account and inspector registrations never collide
    const key =
      u.id === 'usr-admin-01'
        ? 'admin:usr-admin-01'
        : `${u.role}:${u.nip.replace(/\s+/g, '')}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, u);
    } else {
      // Keep whichever version was modified/registered/approved more recently
      if (getAccountTimestamp(u) > getAccountTimestamp(existing)) {
        map.set(key, u);
      }
    }
  }
  return Array.from(map.values());
}

function loadInitialUsersFromAllKeys(): UserAccount[] {
  let merged: UserAccount[] = [...INITIAL_USERS];
  try {
    for (const key of LEGACY_USER_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          merged = mergeUsersList(parsed, merged);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  // Ensure admin account has latest credentials
  return merged.map((u) =>
    u.id === 'usr-admin-01'
      ? {
          ...u,
          name: 'Muhammad Irfan Rosyid, ST',
          nip: '199806232022031010',
          jabatan: 'Ahli Pertama - Teknik Pengairan',
          password: 'Silussi-v2',
          role: 'admin',
          status: 'approved',
        }
      : u
  );
}

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(
    loadInitialUsersFromAllKeys
  );

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
        const prevPendingKeys = new Set(
          prev
            .filter((u) => u.role === 'inspector' && u.status === 'pending')
            .map((u) => `${u.nip.replace(/\s+/g, '')}:${u.registeredAt}`)
        );
        const merged = mergeUsersList(incomingUsers, prev);
        const newlyAddedPending = merged.filter(
          (u) =>
            u.role === 'inspector' &&
            u.status === 'pending' &&
            !prevPendingKeys.has(
              `${u.nip.replace(/\s+/g, '')}:${u.registeredAt}`
            )
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`/api/users?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) {
        applyIncomingRealtimeUsers(data.users, data.activityLogs);
      }
    } catch {
      // Ignore network errors
    }
  }, [applyIncomingRealtimeUsers]);

  // Real-time synchronization: Cloud Firestore onSnapshot (cross-device) + Server API + BroadcastChannel + Storage Event
  useEffect(() => {
    let hasSeededFirestore = false;

    // 1. Subscribe to Cloud Firestore inspector_accounts for instant cross-device sync (ais-dev, ais-pre, mobile, desktop)
    const unsubAccounts = subscribeFirestoreAccounts((remoteAccounts) => {
      if (!hasSeededFirestore) {
        hasSeededFirestore = true;
        const remoteIds = new Set(remoteAccounts.map((u) => u.id));
        const remoteNips = new Set(
          remoteAccounts.map((u) => `${u.role}:${u.nip.replace(/\s+/g, '')}`)
        );
        for (const localUser of usersRef.current) {
          const nipKey = `${localUser.role}:${localUser.nip.replace(/\s+/g, '')}`;
          if (!remoteIds.has(localUser.id) && !remoteNips.has(nipKey)) {
            upsertFirestoreAccount(localUser).catch(() => {});
          }
        }
      }
      if (remoteAccounts.length > 0) {
        applyIncomingRealtimeUsers(remoteAccounts);
      }
    });

    // 2. Subscribe to Cloud Firestore activity_logs for cross-device audit log
    const unsubLogs = subscribeFirestoreLogs((remoteLogs) => {
      if (remoteLogs.length > 0) {
        setActivityLogs((prev) => {
          const map = new Map<string, ActivityLog>();
          for (const item of [...remoteLogs, ...prev]) {
            if (item && item.id) {
              map.set(item.id, item);
            }
          }
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
      }
    });

    // 3. Initial merge of client localStorage users into server store
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

    // 4. Fast polling fallback every 2s
    const pollTimer = setInterval(() => {
      syncUsersWithServer();
    }, 2000);

    // 5. BroadcastChannel for instant 0ms same-browser multi-tab sync
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

    // 6. Window storage event listener for cross-tab localStorage updates
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
      unsubAccounts();
      unsubLogs();
      clearInterval(pollTimer);
      bc?.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [applyIncomingRealtimeUsers, syncUsersWithServer]);

  // Also trigger immediate sync when navigating to Persetujuan Inspektor
  useEffect(() => {
    if (activeNav === 'accounts') {
      syncUsersWithServer();
    }
  }, [activeNav, syncUsersWithServer]);

  const broadcastLocalUsers = (
    updatedUsers: UserAccount[],
    updatedLogs?: ActivityLog[]
  ) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
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
    createFirestoreActivityLog(newLog).catch(() => {});
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveNav('dashboard');
    syncUsersWithServer();
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
    const nowIso = new Date().toISOString();
    const compactNip = (newUserData.nip || '')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const existingInspector = usersRef.current.find(
      (u) =>
        u.role === 'inspector' &&
        u.nip.replace(/\s+/g, '') === (newUserData.nip || '').replace(/\s+/g, '')
    );
    const accountId =
      existingInspector?.id ||
      (compactNip
        ? `usr-insp-${compactNip.slice(0, 48)}`
        : `usr-insp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

    const optimisticAccount: UserAccount = {
      ...newUserData,
      id: accountId,
      role: 'inspector',
      status: 'pending',
      registeredAt: nowIso,
    };

    // 1. Immediately apply optimistically to local state + localStorage + BroadcastChannel
    const optimisticUsers = mergeUsersList(
      [optimisticAccount],
      usersRef.current
    );
    setUsers(optimisticUsers);
    broadcastLocalUsers(optimisticUsers);

    // 2. Persist immediately to Cloud Firestore so ALL devices (phone, laptop, ais-pre, ais-dev) receive it via onSnapshot
    try {
      await upsertFirestoreAccount(optimisticAccount);
    } catch {
      // Handled by Firestore helper
    }

    appendActivityLog(
      optimisticAccount,
      'REGISTER_ACCOUNT',
      `Mengajukan pendaftaran akun Inspektor baru: ${optimisticAccount.name}`,
      `NIP ${optimisticAccount.nip} — Unit Kerja: ${optimisticAccount.balaiPsda} (Status: Menunggu Persetujuan Administrator)`
    );

    // 3. Also sync to local Express store
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUserData, id: optimisticAccount.id }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const serverUser: UserAccount = {
          ...(data.user || optimisticAccount),
          id: optimisticAccount.id,
        };
        const mergedUsers = Array.isArray(data.users)
          ? mergeUsersList([serverUser], data.users)
          : optimisticUsers;

        setUsers(mergedUsers);
        broadcastLocalUsers(mergedUsers);
      }
    } catch {
      // Cloud Firestore & local state already updated
    }

    if (currentUser?.role === 'admin') {
      showToast(
        `Akun Inspektor ${optimisticAccount.name} berhasil ditambahkan ke Antrean Persetujuan.`
      );
    }
    return optimisticAccount;
  };

  const handleApproveUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const approvedUser: UserAccount = {
      ...target,
      status: 'approved',
      approvedAt: nowIso,
      approvedBy: currentUser.name,
    };
    const updatedUsers = users.map((u) =>
      u.id === userId ? approvedUser : u
    );
    setUsers(updatedUsers);
    broadcastLocalUsers(updatedUsers);

    // 1. Update Cloud Firestore immediately for cross-device sync
    try {
      await upsertFirestoreAccount(approvedUser);
    } catch {
      // Handled by Firestore helper
    }

    appendActivityLog(
      currentUser,
      'APPROVE_ACCOUNT',
      `Menyetujui pendaftaran akun Inspektor ${target.name}`,
      `NIP ${target.nip} (${target.balaiPsda}) kini aktif dan dapat menginput blangko penilaian sungai.`
    );

    // 2. Also update local server store
    try {
      await fetch(`/api/users/${encodeURIComponent(userId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser.name }),
      });
    } catch {
      // Cloud Firestore & optimistic state already applied
    }

    showToast(`Akun Inspektor ${target.name} telah disetujui dan diaktifkan.`);
  };

  const handleRejectUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const rejectedUser: UserAccount = {
      ...target,
      status: 'rejected',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.name,
    };
    const updatedUsers = users.map((u) =>
      u.id === userId ? rejectedUser : u
    );
    setUsers(updatedUsers);
    broadcastLocalUsers(updatedUsers);

    // 1. Update Cloud Firestore immediately for cross-device sync
    try {
      await upsertFirestoreAccount(rejectedUser);
    } catch {
      // Handled by Firestore helper
    }

    appendActivityLog(
      currentUser,
      'REJECT_ACCOUNT',
      `Menolak pengajuan akun Inspektor ${target.name}`,
      `NIP ${target.nip} (${target.balaiPsda}) ditolak oleh Administrator.`
    );

    // 2. Also update local server store
    try {
      await fetch(`/api/users/${encodeURIComponent(userId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: currentUser.name }),
      });
    } catch {
      // Cloud Firestore & optimistic state already applied
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
