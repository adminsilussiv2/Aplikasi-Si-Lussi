import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT) || 3000;
const STORE_PATH = path.resolve(process.cwd(), '.silussi-realtime-store.json');

type BalaiPSDA =
  | 'BPSDA Pemali Comal'
  | 'BPSDA Bodri Kuto'
  | 'BPSDA Jratun Seluna'
  | 'BPSDA Bengawan Solo'
  | 'BPSDA Progo Bogowonto Lukulo'
  | 'BPSDA Serayu Bogowonto';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  nip: string;
  jabatan: string;
  balaiPsda: BalaiPSDA;
  role: 'admin' | 'inspector';
  status: 'approved' | 'pending' | 'rejected';
  registeredAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'inspector';
  actorBalai: BalaiPSDA;
  actionType:
    | 'LOGIN'
    | 'REGISTER_ACCOUNT'
    | 'APPROVE_ACCOUNT'
    | 'REJECT_ACCOUNT'
    | 'CREATE_INSPECTION'
    | 'UPDATE_INSPECTION'
    | 'UPDATE_FOLLOWUP'
    | 'EXPORT_REPORT';
  summary: string;
  detail: string;
  relatedId?: string;
}

interface RealtimeStore {
  users: UserAccount[];
  activityLogs: ActivityLog[];
  updatedAt: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    name: 'Muhammad Irfan Rosyid, ST',
    email: 'admin@pupr.jatengprov.go.id',
    password: 'Silussi-v2',
    nip: '199806232022031010',
    jabatan: 'Ahli Pertama - Teknik Pengairan',
    balaiPsda: 'BPSDA Jratun Seluna',
    role: 'admin',
    status: 'approved',
    registeredAt: '2026-01-10T08:00:00.000Z',
    approvedAt: '2026-01-10T08:00:00.000Z',
    approvedBy: 'Sistem DPUPR Jateng',
  },
  {
    id: 'usr-insp-01',
    name: 'Budi Santoso, S.T.',
    email: 'budi.santoso@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19890618 201402 1 002',
    jabatan: 'Inspektor Sungai Lapangan',
    balaiPsda: 'BPSDA Pemali Comal',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-02-05T09:15:00.000Z',
    approvedAt: '2026-02-05T10:00:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-02',
    name: 'Siti Rahmawati, S.T., M.Eng.',
    email: 'siti.rahmawati@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19911124 201503 2 005',
    jabatan: 'Inspektor Operasi & Pemeliharaan',
    balaiPsda: 'BPSDA Jratun Seluna',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-02-12T08:30:00.000Z',
    approvedAt: '2026-02-12T11:20:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-03',
    name: 'Agus Prasetyo, S.T.',
    email: 'agus.prasetyo@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19870309 201201 1 008',
    jabatan: 'Inspektor Hidrologi & Alur',
    balaiPsda: 'BPSDA Bengawan Solo',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-03-01T08:00:00.000Z',
    approvedAt: '2026-03-01T09:45:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-04',
    name: 'Dewi Lestari, S.T.',
    email: 'dewi.lestari@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19930815 201802 2 001',
    jabatan: 'Inspektor Sungai & Sempadan',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-03-10T08:00:00.000Z',
    approvedAt: '2026-03-10T10:15:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-pending-01',
    name: 'Rizky Pratama, S.T.',
    email: 'rizky.pratama@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19950214 202203 1 003',
    jabatan: 'Inspektor Pemantau Lapangan',
    balaiPsda: 'BPSDA Pemali Comal',
    role: 'inspector',
    status: 'pending',
    registeredAt: '2026-10-09T14:20:00.000Z',
  },
  {
    id: 'usr-insp-pending-02',
    name: 'Wahyu Nugroho, S.T.',
    email: 'wahyu.nugroho@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19940928 202102 1 007',
    jabatan: 'Inspektor Morfologi Sungai',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    role: 'inspector',
    status: 'pending',
    registeredAt: '2026-10-10T07:45:00.000Z',
  },
];

const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-006',
    timestamp: '2026-10-10T08:15:00.000Z',
    actorId: 'usr-insp-04',
    actorName: 'Dewi Lestari, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Serayu Bogowonto',
    actionType: 'CREATE_INSPECTION',
    summary: 'Menginput Kinerja Prasarana Sungai Progo (Groundsill)',
    detail:
      'Skor Kinerja 85.00% — Risiko Rendah (RR) / Kinerja Baik (WS Probolo, Kab. Magelang)',
    relatedId: 'insp-2026-006',
  },
  {
    id: 'log-005',
    timestamp: '2026-10-10T07:45:00.000Z',
    actorId: 'usr-insp-pending-02',
    actorName: 'Wahyu Nugroho, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Serayu Bogowonto',
    actionType: 'REGISTER_ACCOUNT',
    summary: 'Mengajukan pendaftaran akun Inspektor baru',
    detail:
      'NIP 19940928 202102 1 007 — Unit Kerja: BPSDA Serayu Bogowonto (Status: Menunggu Persetujuan Admin)',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-09T17:30:00.000Z',
    actorId: 'usr-admin-01',
    actorName: 'Muhammad Irfan Rosyid, ST',
    actorRole: 'admin',
    actorBalai: 'BPSDA Jratun Seluna',
    actionType: 'UPDATE_FOLLOWUP',
    summary: 'Memperbarui status tindak lanjut Sungai Bodri (Ruas Bdr-03)',
    detail:
      'Status diubah menjadi "Selesai Ditindaklanjuti" setelah verifikasi dokumentasi.',
    relatedId: 'insp-2026-005',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-09T14:20:00.000Z',
    actorId: 'usr-insp-pending-01',
    actorName: 'Rizky Pratama, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Pemali Comal',
    actionType: 'REGISTER_ACCOUNT',
    summary: 'Mengajukan pendaftaran akun Inspektor baru',
    detail:
      'NIP 19950214 202203 1 003 — Unit Kerja: BPSDA Pemali Comal (Status: Menunggu Persetujuan Admin)',
  },
];

function ensureAdminAccount(users: UserAccount[]): UserAccount[] {
  const adminTemplate = INITIAL_USERS[0];
  const hasAdmin = users.some((u) => u.id === 'usr-admin-01');
  if (!hasAdmin) {
    return [adminTemplate, ...users];
  }
  return users.map((u) =>
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

function loadStore(): RealtimeStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as RealtimeStore;
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        const filtered = parsed.users.filter(
          (u) => u.nip !== '199601012023031001' || u.name !== 'Tes Inspektor'
        );
        return {
          users: ensureAdminAccount(filtered),
          activityLogs: Array.isArray(parsed.activityLogs)
            ? parsed.activityLogs
            : [...INITIAL_ACTIVITY_LOGS],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback to initial seed
  }
  return {
    users: ensureAdminAccount([...INITIAL_USERS]),
    activityLogs: [...INITIAL_ACTIVITY_LOGS],
    updatedAt: new Date().toISOString(),
  };
}

const store: RealtimeStore = loadStore();

function saveStore() {
  store.updatedAt = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

saveStore();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Get current authoritative users & activity logs
  app.get('/api/users', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  // Register a new Inspector account — places at top of pending queue
  app.post('/api/users/register', (req: Request, res: Response) => {
    const { id, name, nip, email, jabatan, balaiPsda, password } =
      (req.body || {}) as {
        id?: string;
        name?: string;
        nip?: string;
        email?: string;
        jabatan?: string;
        balaiPsda?: BalaiPSDA;
        password?: string;
      };

    const cleanName = (name || '').trim() || 'Inspektor Baru';
    const cleanNip = (nip || '').trim() || `${Date.now()}`;
    const compactNip = cleanNip.replace(/\s+/g, '');
    const cleanEmail =
      (email || '').trim() ||
      `${compactNip.toLowerCase()}@pupr.jatengprov.go.id`;
    const cleanJabatan = (jabatan || '').trim() || 'Inspektor Sungai Lapangan';
    const cleanBalai: BalaiPSDA = balaiPsda || 'BPSDA Jratun Seluna';
    const cleanPassword = (password || '').trim() || 'password123';
    const nowIso = new Date().toISOString();

    const existingInspectorIdx = store.users.findIndex(
      (u) =>
        u.role === 'inspector' && u.nip.replace(/\s+/g, '') === compactNip
    );

    let registeredAccount: UserAccount;

    if (existingInspectorIdx !== -1) {
      const existing = store.users[existingInspectorIdx];
      registeredAccount = {
        ...existing,
        name: cleanName,
        nip: cleanNip,
        email: cleanEmail,
        jabatan: cleanJabatan,
        balaiPsda: cleanBalai,
        password: cleanPassword,
        role: 'inspector',
        status: 'pending',
        registeredAt: nowIso,
      };
      const remaining = store.users.filter(
        (_item, idx) => idx !== existingInspectorIdx
      );
      store.users = [registeredAccount, ...remaining];
    } else {
      registeredAccount = {
        id:
          id ||
          `usr-insp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        nip: cleanNip,
        email: cleanEmail,
        jabatan: cleanJabatan,
        balaiPsda: cleanBalai,
        password: cleanPassword,
        role: 'inspector',
        status: 'pending',
        registeredAt: nowIso,
      };
      store.users = [registeredAccount, ...store.users];
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowIso,
      actorId: registeredAccount.id,
      actorName: registeredAccount.name,
      actorRole: 'inspector',
      actorBalai: registeredAccount.balaiPsda,
      actionType: 'REGISTER_ACCOUNT',
      summary: `Mengajukan pendaftaran akun Inspektor baru: ${registeredAccount.name}`,
      detail: `NIP ${registeredAccount.nip} — Unit Kerja: ${registeredAccount.balaiPsda} (Status: Menunggu Persetujuan Administrator)`,
    };

    store.activityLogs = [newLog, ...store.activityLogs];
    saveStore();

    res.status(201).json({
      user: registeredAccount,
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  // Approve an Inspector account
  app.post('/api/users/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy } = (req.body || {}) as { approvedBy?: string };
    const target = store.users.find((u) => u.id === id);

    if (!target) {
      res.status(404).json({ error: 'Akun tidak ditemukan.' });
      return;
    }

    const approverName = approvedBy || 'Muhammad Irfan Rosyid, ST';
    store.users = store.users.map((u) =>
      u.id === id
        ? {
            ...u,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: approverName,
          }
        : u
    );

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr-admin-01',
      actorName: approverName,
      actorRole: 'admin',
      actorBalai: 'BPSDA Jratun Seluna',
      actionType: 'APPROVE_ACCOUNT',
      summary: `Menyetujui pendaftaran akun Inspektor ${target.name}`,
      detail: `NIP ${target.nip} (${target.balaiPsda}) kini aktif dan dapat menginput blangko penilaian sungai.`,
    };

    store.activityLogs = [newLog, ...store.activityLogs];
    saveStore();

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  // Reject an Inspector account
  app.post('/api/users/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectedBy } = (req.body || {}) as { rejectedBy?: string };
    const target = store.users.find((u) => u.id === id);

    if (!target) {
      res.status(404).json({ error: 'Akun tidak ditemukan.' });
      return;
    }

    const actorName = rejectedBy || 'Muhammad Irfan Rosyid, ST';
    store.users = store.users.map((u) =>
      u.id === id ? { ...u, status: 'rejected' } : u
    );

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr-admin-01',
      actorName,
      actorRole: 'admin',
      actorBalai: 'BPSDA Jratun Seluna',
      actionType: 'REJECT_ACCOUNT',
      summary: `Menolak pengajuan akun Inspektor ${target.name}`,
      detail: `NIP ${target.nip} (${target.balaiPsda}) ditolak oleh Administrator.`,
    };

    store.activityLogs = [newLog, ...store.activityLogs];
    saveStore();

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  // Merge client-side cached users into server store
  app.post('/api/users/sync', (req: Request, res: Response) => {
    const { clientUsers } = (req.body || {}) as { clientUsers?: UserAccount[] };
    let changed = false;

    if (Array.isArray(clientUsers)) {
      for (const cu of clientUsers) {
        if (!cu || !cu.nip || cu.id === 'usr-admin-01') continue;
        const existsById = store.users.some((u) => u.id === cu.id);
        const existsByNip = store.users.some(
          (u) =>
            u.role === 'inspector' &&
            u.nip.replace(/\s+/g, '') === cu.nip.replace(/\s+/g, '')
        );
        if (!existsById && !existsByNip) {
          store.users = [cu, ...store.users];
          changed = true;
        }
      }
    }

    if (changed) {
      saveStore();
    }

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  const distPath = path.join(process.cwd(), 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (process.env.npm_lifecycle_event !== 'dev' && fs.existsSync(distIndexPath));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(distIndexPath);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Si-Lussi v2 server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    const fallbackPort = Number(process.env.DEFAULT_APP_PORT) || 3000;
    if (err.code === 'EADDRINUSE' && PORT !== fallbackPort) {
      app.listen(fallbackPort, '0.0.0.0', () => {
        console.log(
          `Si-Lussi v2 server running on fallback http://0.0.0.0:${fallbackPort}`
        );
      });
    }
  });
}

startServer();
