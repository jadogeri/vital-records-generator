import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readStore, updateStore, removeRecentFile, clearRecentFiles } from '../src/main/storage'
test('history recovers from missing/corrupt data and serializes concurrent updates', async () => {
  const dir = await mkdtemp(join(tmpdir(),'vital-test-'))
  try {
    assert.deepEqual(await readStore(dir),{recent:[],activity:[]})
    await writeFile(join(dir,'activity-v2.json'),'invalid')
    assert.deepEqual(await readStore(dir),{recent:[],activity:[]})
    await Promise.all(Array.from({length:10},(_,i) => updateStore(dir,store => {
      store.activity.push({at:'2020-01-01',action:'Test',detail:String(i)})
    })))
    assert.equal((await readStore(dir)).activity.length,10)
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('remove and clear file history persist without changing source files or activity', async () => {
  const dir = await mkdtemp(join(tmpdir(),'vital-history-'))
  try {
    const txt = join(dir,'source.txt'), csv = join(dir,'source.csv')
    await writeFile(txt,'original text')
    await writeFile(csv,'original csv')
    await updateStore(dir,store => {
      store.recent = [txt,csv].map(path => ({path,name:path.endsWith('.txt')?'source.txt':'source.csv',importedAt:'2026-01-01'}))
      store.activity = [{at:'2026-01-01',action:'File imported',detail:'source.txt'}]
    })
    await assert.rejects(removeRecentFile(dir,undefined),/Invalid history file/)
    assert.equal((await readStore(dir)).recent.length,2)
    assert.equal((await removeRecentFile(dir,txt)).length,1)
    assert.deepEqual((await readStore(dir)).recent.map(file => file.path),[csv])
    // Removing an already-forgotten entry is safe and idempotent.
    assert.equal((await removeRecentFile(dir,txt)).length,1)
    assert.deepEqual(await clearRecentFiles(dir),[])
    const final = await readStore(dir)
    assert.deepEqual(final.recent,[])
    assert.equal(final.activity.length,1)
    assert.equal(await readFile(txt,'utf8'),'original text')
    assert.equal(await readFile(csv,'utf8'),'original csv')
  } finally { await rm(dir,{recursive:true,force:true}) }
})
test('queued history removal does not resurrect a file when activity is written', async () => {
  const dir = await mkdtemp(join(tmpdir(),'vital-history-'))
  try {
    await updateStore(dir,store => { store.recent = [{path:'/a.txt',name:'a.txt',importedAt:'2026-01-01'}] })
    await Promise.all([clearRecentFiles(dir),updateStore(dir,store => {
      store.activity.push({at:'2026-01-01',action:'Test',detail:'Concurrent event'})
    })])
    assert.deepEqual((await readStore(dir)).recent,[])
    assert.equal((await readStore(dir)).activity.length,1)
  } finally { await rm(dir,{recursive:true,force:true}) }
})
