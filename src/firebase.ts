import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ActivityLog, UserAccount } from './types/silussi';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

function sanitizeAccountPayload(account: UserAccount): Record<string, string> {
  const safeId = (account.id || `usr-insp-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const payload: Record<string, string> = {
    id: safeId,
    name: (account.name || 'Inspektor Baru').trim().slice(0, 160),
    email: (
      account.email ||
      `${(account.nip || 'petugas').replace(/\s+/g, '').toLowerCase()}@pupr.jatengprov.go.id`
    )
      .trim()
      .slice(0, 160),
    password: (account.password || 'password123').trim().slice(0, 128),
    nip: (account.nip || `${Date.now()}`).trim().slice(0, 64),
    jabatan: (account.jabatan || 'Inspektor Sungai Lapangan')
      .trim()
      .slice(0, 160),
    balaiPsda: account.balaiPsda || 'BPSDA Jratun Seluna',
    role: safeId === 'usr-admin-01' ? 'admin' : 'inspector',
    status: account.status || 'pending',
    registeredAt: (account.registeredAt || new Date().toISOString()).slice(
      0,
      64
    ),
  };

  if (account.approvedAt) {
    payload.approvedAt = account.approvedAt.slice(0, 64);
  }
  if (account.approvedBy) {
    payload.approvedBy = account.approvedBy.slice(0, 160);
  }
  return payload;
}

function sanitizeLogPayload(log: ActivityLog): Record<string, string> {
  const safeId = (log.id || `log-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
  const payload: Record<string, string> = {
    id: safeId,
    timestamp: (log.timestamp || new Date().toISOString()).slice(0, 64),
    actorId: (log.actorId || 'usr-insp').slice(0, 128),
    actorName: (log.actorName || 'Petugas Si-Lussi').slice(0, 160),
    actorRole: log.actorRole === 'admin' ? 'admin' : 'inspector',
    actorBalai: log.actorBalai || 'BPSDA Jratun Seluna',
    actionType: log.actionType || 'REGISTER_ACCOUNT',
    summary: (log.summary || 'Aktivitas Si-Lussi v2').slice(0, 500),
    detail: (log.detail || '-').slice(0, 1000),
  };

  if (log.relatedId) {
    payload.relatedId = log.relatedId.slice(0, 128);
  }
  return payload;
}

export async function upsertFirestoreAccount(
  account: UserAccount
): Promise<void> {
  const payload = sanitizeAccountPayload(account);
  const path = `inspector_accounts/${payload.id}`;
  try {
    await setDoc(doc(db, 'inspector_accounts', payload.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createFirestoreActivityLog(
  log: ActivityLog
): Promise<void> {
  const payload = sanitizeLogPayload(log);
  const path = `activity_logs/${payload.id}`;
  try {
    await setDoc(doc(db, 'activity_logs', payload.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeFirestoreAccounts(
  onUpdate: (accounts: UserAccount[]) => void
): () => void {
  const path = 'inspector_accounts';
  const q = query(
    collection(db, path),
    where('role', 'in', ['admin', 'inspector'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const accounts: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserAccount;
        if (data && data.id && data.nip) {
          accounts.push(data);
        }
      });
      onUpdate(accounts);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export function subscribeFirestoreLogs(
  onUpdate: (logs: ActivityLog[]) => void
): () => void {
  const path = 'activity_logs';
  const q = query(
    collection(db, path),
    where('actorRole', 'in', ['admin', 'inspector'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ActivityLog;
        if (data && data.id && data.timestamp) {
          logs.push(data);
        }
      });
      logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onUpdate(logs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}
