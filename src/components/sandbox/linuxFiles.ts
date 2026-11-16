// v86 0.5.462: the public API reads/writes files; directory enumeration uses
// its pinned 9p adapter. Keep that small compatibility surface in this file.

// The `v86` package ships no types; this describes only the members used here.
interface V86Inode { mode: number; size: number; direntries: Map<string, number> }
export interface V86Emulator {
  fs9p: { SearchPath(path: string): { id: number }; GetInode(id: number): V86Inode };
  create_file(path: string, data: Uint8Array): Promise<void>;
  read_file(path: string): Promise<Uint8Array<ArrayBuffer>>;
  run(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  serial0_send(data: string): void;
  serial_send_bytes(port: number, data: Uint8Array): void;
  add_listener(event: 'download-progress', listener: (progress: { loaded: number; total: number }) => void): void;
  add_listener(event: 'serial0-output-byte' | 'serial1-output-byte', listener: (byte: number) => void): void;
  add_listener(event: 'download-error' | 'emulator-ready' | '9p-write-end', listener: () => void): void;
  remove_listener(event: 'serial1-output-byte', listener: (byte: number) => void): void;
}
export interface LinuxFileEntry { name: string; directory: boolean; size: number; path: string }

export function listFiles(vm: V86Emulator, path = '/'): LinuxFileEntry[] {
  const fs = vm.fs9p;
  const found = fs.SearchPath(path);
  if (found.id < 0) throw new Error('This folder no longer exists.');
  const inode = fs.GetInode(found.id);
  if ((inode.mode & 0xf000) !== 0x4000) throw new Error('That path is not a folder.');
  return [...inode.direntries].filter(([name]) => name !== '.' && name !== '..').map(([name, id]) => {
    const item = fs.GetInode(id);
    return { name, directory: (item.mode & 0xf000) === 0x4000, size: item.size, path: (path === '/' ? '' : path) + '/' + name };
  }).sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}

export async function saveNote(vm: V86Emulator, path: string, content: string): Promise<void> {
  const parts = path.replace(/^\/+/, '').split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || !/^[\w .-]+$/.test(part))) throw new Error('Use letters, numbers, spaces, dots, or dashes in file names.');
  const bytes = new TextEncoder().encode(content);
  if (bytes.length > 128 * 1024) throw new Error('Keep Notes files under 128 KB.');
  await vm.create_file(parts.join('/'), bytes);
}
