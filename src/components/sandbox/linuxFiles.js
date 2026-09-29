// v86 0.5.462: the public API reads/writes files; directory enumeration uses
// its pinned 9p adapter. Keep that small compatibility surface in this file.
export function listFiles(vm, path = '/') {
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

export async function saveNote(vm, path, content) {
  const parts = path.replace(/^\/+/, '').split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || !/^[\w .-]+$/.test(part))) throw new Error('Use letters, numbers, spaces, dots, or dashes in file names.');
  const bytes = new TextEncoder().encode(content);
  if (bytes.length > 128 * 1024) throw new Error('Keep Notes files under 128 KB.');
  await vm.create_file(parts.join('/'), bytes);
}
