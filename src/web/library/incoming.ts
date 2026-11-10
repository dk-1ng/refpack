export type Incoming = { files: File[]; folders: string[] };

// Files and folders carried by a paste or a drop, in the order the browser lists them.
export function readIncoming(data: DataTransfer | null): Incoming {
  const incoming: Incoming = { files: [], folders: [] };
  if (data === null) return incoming;
  for (const item of Array.from(data.items)) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry();
    if (entry?.isDirectory === true) {
      incoming.folders.push(entry.name);
      continue;
    }
    const file = item.getAsFile();
    if (file !== null) incoming.files.push(file);
  }
  return incoming;
}
