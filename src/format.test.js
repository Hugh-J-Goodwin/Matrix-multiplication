import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatNumber} from './format.js';
import {rational,calculateSeries,fractionText,matrixDelimited,rankRows} from './fractions.js';
import {newMatrix,normalizeProject,resizeProject} from './project.js';
test('decimal formatting rounds exact fractions and keeps requested trailing places',()=>{
 assert.equal(formatNumber(rational('1/3'),{format:'decimal',decimalPlaces:4}),'0.3333');
 assert.equal(formatNumber(-1.005,{format:'decimal',decimalPlaces:2}),'-1.01');
 assert.equal(formatNumber(-0.0001,{format:'decimal',decimalPlaces:2}),'0.00');
 assert.equal(formatNumber('1e500',{format:'decimal',decimalPlaces:0}),'1'+'0'.repeat(500));
});
test('scientific formatting handles carry, signs, zero, and numbers beyond float range',()=>{
 assert.equal(formatNumber(rational('1/3'),{format:'scientific',scientificPlaces:4}),'3.3333e-1');
 assert.equal(formatNumber('9.9999',{format:'scientific',scientificPlaces:3}),'1.000e+1');
 assert.equal(formatNumber('-1e-400',{format:'scientific',scientificPlaces:2}),'-1.00e-400');
 assert.equal(formatNumber('1e500',{format:'scientific',scientificPlaces:2}),'1.00e+500');
 assert.equal(formatNumber(0,{format:'scientific',scientificPlaces:0}),'0e+0');
});
test('fraction display is exact by default with optional decimal-place rounding',()=>{
 assert.equal(formatNumber(rational('1/3')),'1/3');
 assert.equal(formatNumber(rational('1/3'),{format:'fraction',fractionPlaces:2}),'33/100');
 assert.equal(formatNumber('-1.005',{format:'fraction',fractionPlaces:2}),'-101/100');
 assert.equal(matrixDelimited([[rational('1/3')]],['A'],',',v=>formatNumber(v,{format:'decimal',decimalPlaces:2})),'"","A"\n"A","0.33"');
});
test('add, include, and resize any number of matrix series; exclude disabled matrices',()=>{
 const project=normalizeProject({size:1,a:[[1]],b:[[1]],order:1,rule:'1/3',cumulative:false,secondary:true,orderB:1,ruleB:'1/6',cumulativeB:false});
 for(let number=3;number<=30;number++){const matrix=newMatrix(1,number);matrix.values=[[1]];matrix.order=1;matrix.rule='1/2';matrix.cumulative=false;project.matrices.push(matrix);}
 assert.equal(fractionText(calculateSeries(project.matrices)[0][0]),'29/2');
 project.matrices[29].enabled=false;
 assert.equal(fractionText(calculateSeries(project.matrices)[0][0]),'14');
 assert.equal(resizeProject(project,25).matrices[29].values.length,25);
 assert.throws(()=>calculateSeries(project.matrices.map(matrix=>({...matrix,enabled:false}))),/Include at least/);
 assert.throws(()=>calculateSeries([{...project.matrices[0],order:0}]),/Matrix A: Choose/);
});
test('display rounding never changes stored values or exact row ranks',()=>{
 const matrix=[[rational('1/3')],[rational('333/1000')]];
 assert.equal(formatNumber(matrix[0][0],{format:'decimal',decimalPlaces:2}),formatNumber(matrix[1][0],{format:'decimal',decimalPlaces:2}));
 assert.deepEqual(rankRows(matrix,['A','B']).map(row=>row.rank),[1,2]);
 assert.equal(fractionText(matrix[0][0]),'1/3');
});
