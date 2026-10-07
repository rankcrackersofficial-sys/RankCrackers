import * as admin from 'firebase-admin';
import {
  B3MaterializationPersistenceStore,
  B3PersistenceTransaction,
} from './b3MaterializationRepository';

function documentData(value: unknown): admin.firestore.DocumentData {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('B3_FIRESTORE_DOCUMENT_VALUE_REQUIRED');
  }
  return value as admin.firestore.DocumentData;
}

export class FirestoreB3MaterializationPersistenceStore
implements B3MaterializationPersistenceStore {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async get(path: string): Promise<unknown | undefined> {
    const snapshot = await this.db.doc(path).get();
    return snapshot.exists ? snapshot.data() : undefined;
  }

  async create(path: string, value: unknown): Promise<void> {
    await this.db.doc(path).create(documentData(value));
  }

  async runTransaction<T>(
    work: (transaction: B3PersistenceTransaction) => Promise<T>,
  ): Promise<T> {
    return this.db.runTransaction(async firestoreTransaction => {
      const transaction: B3PersistenceTransaction = {
        get: async path => {
          const snapshot = await firestoreTransaction.get(this.db.doc(path));
          return snapshot.exists ? snapshot.data() : undefined;
        },
        create: (path, value) => {
          firestoreTransaction.create(this.db.doc(path), documentData(value));
        },
        set: (path, value) => {
          firestoreTransaction.set(this.db.doc(path), documentData(value));
        },
      };
      return work(transaction);
    });
  }
}
