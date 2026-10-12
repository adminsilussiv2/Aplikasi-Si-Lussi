import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ACTIVITY_LOGS, INITIAL_USERS } from './src/data/initialUsers';
import { ActivityLog, BalaiPSDA, UserAccount } from './src/types/silussi';

const PORT = 3000;
const STORE_PATH = path.resolve(process.cwd(), '.silussi-realtime-store.json');

interface RealtimeStore {
  users: UserAccount[];
  activityLogs: ActivityLog[];
  updatedAt: string;
}

function loadStore(): RealtimeStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as RealtimeStore;
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        // Ensure admin account always has current credentials
        const hasAdmin = parsed.users.some((u) => u.id === 'usr-admin-01');
        if (!hasAdmin) {
          parsed.users.unshift(INITIAL_USERS[0]);
        } else {
          parsed.users = parsed.users.map((u) =>
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
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  return {
    users: [...INITIAL_USERS],
    activityLogs: [...INITIAL_ACTIVITY_LOGS],
    updatedAt: new Date().toISOString(),
  };
}

let store: RealtimeStore = loadStore();

function saveStore() {
  store.updatedAt = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

// Active SSE clients for instant real-time push
const sseClients = new Set<express.Response>();

function broadcastRealtime(eventType: string, extraPayload: Record<string, unknown> = {}) {
  const message = JSON.stringify({
    type: eventType,
    users: store.users,
    activityLogs: store.activityLogs,
    updatedAt: store.updatedAt,
    ...extraPayload,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${message}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Real-time SSE stream for instant updates across browsers/tabs/devices
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const initMsg = JSON.stringify({
      type: 'INIT',
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
    res.write(`data: ${initMsg}\n\n`);

    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Get current authoritative users & activity logs
  app.get('/api/users', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  // Register a new Inspector account (immediately visible in real-time to Admin)
  app.post('/api/users/register', (req, res) => {
    const { name, nip, email, jabatan, balaiPsda, password } = req.body as {
      name?: string;
      nip?: string;
      email?: string;
      jabatan?: string;
      balaiPsda?: BalaiPSDA;
      password?: string;
    };

    const cleanName = (name || '').trim();
    const cleanNip = (nip || '').trim();
    const compactNip = cleanNip.replace(/\s+/g, '');
    const cleanEmail =
      (email || '').trim() ||
      `${compactNip.toLowerCase()}@pupr.jatengprov.go.id`;
    const cleanJabatan = (jabatan || '').trim() || 'Inspektor Sungai Lapangan';
    const cleanBalai: BalaiPSDA = balaiPsda || 'BPSDA Jratun Seluna';
    const cleanPassword = (password || '').trim();

    if (!cleanName || !cleanNip || !cleanPassword) {
      res.status(400).json({
        error: 'Mohon lengkapi Nama Lengkap, NIP, dan Kata Sandi.',
      });
      return;
    }

    const existingIdx = store.users.findIndex(
      (u) =>
        u.nip.replace(/\s+/g, '') === compactNip ||
        (Boolean(email?.trim()) &&
          u.email.toLowerCase() === cleanEmail.toLowerCase())
    );

    if (existingIdx !== -1) {
      const existingUser = store.users[existingIdx];
      // If previously rejected, allow re-submission as pending
      if (existingUser.status === 'rejected') {
        const updatedUser: UserAccount = {
          ...existingUser,
          name: cleanName,
          nip: cleanNip,
          email: cleanEmail,
          jabatan: cleanJabatan,
          balaiPsda: cleanBalai,
          password: cleanPassword,
          status: 'pending',
          registeredAt: new Date().toISOString(),
        };
        store.users[existingIdx] = updatedUser;
        saveStore();
        broadcastRealtime('USER_REGISTERED', { newUser: updatedUser });
        res.status(200).json({
          user: updatedUser,
          users: store.users,
          activityLogs: store.activityLogs,
        });
        return;
      }

      res.status(409).json({
        error: `Akun dengan NIP "${cleanNip}" sudah terdaftar (${
          existingUser.status === 'pending'
            ? 'sedang menunggu persetujuan Administrator'
            : 'sudah aktif, silakan langsung masuk/login'
        }).`,
        existingUser,
      });
      return;
    }

    const newAccount: UserAccount = {
      id: `usr-insp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      nip: cleanNip,
      email: cleanEmail,
      jabatan: cleanJabatan,
      balaiPsda: cleanBalai,
      password: cleanPassword,
      role: 'inspector',
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: newAccount.id,
      actorName: newAccount.name,
      actorRole: 'inspector',
      actorBalai: newAccount.balaiPsda,
      actionType: 'REGISTER_ACCOUNT',
      summary: `Mengajukan pendaftaran akun Inspektor baru: ${newAccount.name}`,
      detail: `NIP ${newAccount.nip} — Unit Kerja: ${newAccount.balaiPsda} (Status: Menunggu Persetujuan Administrator)`,
    };

    store.users = [newAccount, ...store.users];
    store.activityLogs = [newLog, ...store.activityLogs];
    saveStore();

    broadcastRealtime('USER_REGISTERED', { newUser: newAccount });

    res.status(201).json({
      user: newAccount,
      users: store.users,
      activityLogs: store.activityLogs,
    });
  });

  // Approve an Inspector account
  app.post('/api/users/:id/approve', (req, res) => {
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

    broadcastRealtime('USER_APPROVED', { userId: id });

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
    });
  });

  // Reject an Inspector account
  app.post('/api/users/:id/reject', (req, res) => {
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

    broadcastRealtime('USER_REJECTED', { userId: id });

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
    });
  });

  // Merge any client-side cached users into server store (idempotent)
  app.post('/api/users/sync', (req, res) => {
    const { clientUsers } = (req.body || {}) as { clientUsers?: UserAccount[] };
    let changed = false;

    if (Array.isArray(clientUsers)) {
      for (const cu of clientUsers) {
        if (!cu || !cu.nip) continue;
        const compactNip = cu.nip.replace(/\s+/g, '');
        const exists = store.users.some(
          (u) => u.id === cu.id || u.nip.replace(/\s+/g, '') === compactNip
        );
        if (!exists) {
          store.users.unshift(cu);
          changed = true;
        }
      }
    }

    if (changed) {
      saveStore();
      broadcastRealtime('USERS_SYNCED');
    }

    res.json({
      users: store.users,
      activityLogs: store.activityLogs,
      updatedAt: store.updatedAt,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Si-Lussi v2 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
