export interface EditingLease {
  release(): void;
}

export interface EditingLock {
  acquire(): Promise<EditingLease | null>;
}

export function browserEditingLock(manager: LockManager): EditingLock {
  return {
    acquire: () =>
      new Promise((resolve, reject) => {
        void manager
          .request('songbird:current-song:writer', { ifAvailable: true }, (lock) => {
            if (!lock) {
              resolve(null);
              return;
            }
            return new Promise<void>((release) => resolve({ release }));
          })
          .catch(reject);
      }),
  };
}
