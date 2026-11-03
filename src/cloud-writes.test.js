import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWriteQueue} from './cloud-writes.js';
test('cloud writes finish autosave before delete and continue after a failed request',async()=>{
 const queue=createWriteQueue(),events=[];
 let finish;
 const waiting=new Promise(resolve=>{finish=resolve;});
 const save=queue(async()=>{events.push('save started');await waiting;events.push('save finished');});
 const deletion=queue(async()=>{events.push('delete');});
 await Promise.resolve();
 assert.deepEqual(events,['save started']);
 finish();await Promise.all([save,deletion]);
 assert.deepEqual(events,['save started','save finished','delete']);
 await assert.rejects(queue(async()=>{throw Error('offline');}),/offline/);
 assert.equal(await queue(async()=>'restored'),'restored');
});
