import {test} from 'node:test';import assert from 'node:assert/strict';import {calculate,coefficient,add} from './matrix.js';
test('weighted powers and cumulative dominance',()=>{const a=[[0,1],[1,0]];assert.deepEqual(calculate(a,2,'1',false),[[1,0],[0,1]]);assert.deepEqual(calculate(a,2,'1/(2^n)',true),[[.25,.5],[.5,.25]]);});
test('independent sums combine',()=>assert.deepEqual(add(calculate([[2]],2,'1',true),calculate([[3]],2,'1',true)),[[18]]));
test('25 by 25 and safety',()=>{const a=Array.from({length:25},(_,i)=>Array.from({length:25},(_,j)=>+(i===j)));assert.deepEqual(calculate(a,10,'1',false),a);assert.throws(()=>coefficient('globalThis.x',1));assert.throws(()=>calculate(a,0,'1',true));assert.throws(()=>coefficient('1/0',1));});
