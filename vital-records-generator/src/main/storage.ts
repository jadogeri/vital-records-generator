import { readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import type { Activity, RecentFile } from '../shared/records'

export type Store = { recent: RecentFile[]; activity: Activity[] }
export async function readStore(directory: string): Promise<Store> {
  try {
    const value = JSON.parse(await readFile(join(directory, 'activity-v2.json'), 'utf8'))
    return { recent: Array.isArray(value.recent) ? value.recent.slice(0,10) : [],
      activity: Array.isArray(value.activity) ? value.activity.slice(0,200) : [] }
  } catch { return { recent: [], activity: [] } }
}
let pending = Promise.resolve()
export function updateStore(directory: string, update: (store: Store) => void): Promise<void> {
  const next = pending.then(async () => {
    const store = await readStore(directory)
    update(store)
    await mkdir(directory, { recursive: true })
    const temporary = join(directory, 'activity-v2.tmp')
    await writeFile(temporary, JSON.stringify(store), { mode: 0o600 })
    await rename(temporary, join(directory, 'activity-v2.json'))
  })
  pending = next.catch(() => {})
  return next
}

// Only forget metadata; never unlink, truncate, or otherwise modify a source file.
export async function removeRecentFile(directory: string, path: unknown): Promise<RecentFile[]> {
  if (typeof path !== 'string' || !path || path.length > 32768) throw new Error('Invalid history file.')
  let recent: RecentFile[] = []
  await updateStore(directory, store => {
    store.recent = store.recent.filter(file => file.path !== path)
    recent = store.recent
  })
  return recent
}

export async function clearRecentFiles(directory: string): Promise<RecentFile[]> {
  await updateStore(directory, store => { store.recent = [] })
  return []
}
