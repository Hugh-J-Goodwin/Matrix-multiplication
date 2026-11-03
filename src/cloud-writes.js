// Keep autosaves and project deletions in order so an older save cannot restore a deleted row.
export function createWriteQueue() {
  let pending = Promise.resolve();
  return operation => {
    const next = pending.then(operation, operation);
    pending = next.catch(() => {});
    return next;
  };
}
