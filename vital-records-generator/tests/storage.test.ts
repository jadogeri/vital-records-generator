import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readStore, updateStore } from '../src/main/storage'
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
