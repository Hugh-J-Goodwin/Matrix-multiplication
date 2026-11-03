import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateFractions,fractionCoefficient,fractionText,addFractions,rankRows,matrixDelimited,rational} from './fractions.js';
import {normalizeProject,resizeProject} from './project.js';
const text = matrix => matrix.map(row=>row.map(fractionText));
test('exact weighted sums retain thirds and decimal values',()=>{
 assert.deepEqual(text(calculateFractions([[0,1],[1,0]],2,'1/(3^n)',true)),[['1/9','1/3'],['1/3','1/9']]);
 assert.deepEqual(text(calculateFractions([[0.1]],2,'1',false)),[['1/100']]);
 assert.equal(fractionText(rational(1e-7)),'1/10000000');
 assert.equal(fractionText(fractionCoefficient('-2^2',1)),'-4');
 assert.equal(fractionText(fractionCoefficient('4^(1/2)',1)),'2');
 assert.throws(()=>fractionCoefficient('2^(1/2)',1),/irrational/);
 assert.throws(()=>fractionCoefficient('1/0',1));
});
test('three independently weighted series combine exactly',()=>{
 const a=calculateFractions([[1]],1,'1/3',false),b=calculateFractions([[1]],1,'1/6',false),c=calculateFractions([[1]],1,'1/2',false);
 assert.deepEqual(text(addFractions(addFractions(a,b),c)),[['1']]);
});
test('rank rows by exact totals with competition ties and negative scores',()=>{
 const matrix=[[1,0,0,0],[0,3,0,0],[0,0,3,0],[0,0,0,-1]].map(row=>row.map(rational));
 const ranked=rankRows(matrix,['Alpha','Beta','Gamma','Delta']);
 assert.deepEqual(ranked.map(({name,rank,total})=>[name,rank,fractionText(total)]),[['Beta',1,'3'],['Gamma',1,'3'],['Alpha',3,'1'],['Delta',4,'-1']]);
 const close=rankRows([[rational('1/3')],[rational('3333333333333333/10000000000000000')]],['Exact','Rounded']);
 assert.deepEqual(close.map(r=>r.rank),[1,2]);
});
test('migrate saved projects and resize all three matrices and shared names',()=>{
 const legacy={size:2,a:[[1,2],[3,4]],b:[[5,6],[7,8]]};
 const migrated=normalizeProject(legacy);
 assert.deepEqual(migrated.c,[[0,0],[0,0]]);
 migrated.labels=['Alpha','Beta'];
 const bigger=resizeProject(migrated,3);
 assert.deepEqual(bigger.labels,['Alpha','Beta','Item 3']);
 assert.deepEqual(bigger.a,[[1,2,0],[3,4,0],[0,0,0]]);
 assert.equal(bigger.c.length,3);
 assert.deepEqual(resizeProject(bigger,1).labels,['Alpha']);
 assert.equal(normalizeProject({...migrated,tertiary:true}).tertiary,true);
});
test('exports include matching named axes and fraction values with escaped labels',()=>{
 assert.equal(matrixDelimited([[rational('1/3')]],['A, "name"']), '"","A, ""name"""\n"A, ""name""","1/3"');
});
test('25 by 25 rational workflow and high-order denominators remain exact',()=>{
 const identity=Array.from({length:25},(_,i)=>Array.from({length:25},(_,j)=>+(i===j)));
 const output=calculateFractions(identity,3,'1/2^n',true);
 assert.equal(fractionText(output[24][24]),'7/8');
 assert.equal(rankRows(output,identity.map((_,i)=>`Item ${i+1}`)).length,25);
 assert.equal(fractionText(calculateFractions([[1]],100,'1/2^n',false)[0][0]),'1/1267650600228229401496703205376');
});
