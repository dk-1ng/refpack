// Files carried by a paste or a drop, in the order the browser lists them.
export function readIncoming(data: DataTransfer | null): File[] {
  if (data === null) return [];
  const files: File[] = [];
  for (const item of Array.from(data.items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file !== null) files.push(file);
  }
  return files;
}
