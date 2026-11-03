import {zero} from './matrix.js';
export const sharedNames = (project, size = project.size) => Array.from({length:size}, (_, i) => project.labels?.[i] ?? `Item ${i + 1}`);
export const defaultDisplay = {format:'fraction', decimalPlaces:4, scientificPlaces:4, fractionPlaces:null};
export function newMatrix(size, number) {
  return {id:crypto.randomUUID(), name:number===1?'Matrix A':number===2?'Matrix B':`Matrix ${number}`, values:zero(size), order:3, rule:'1/(2^n)', cumulative:true, enabled:true};
}
export function normalizeProject(project) {
  const {a,b,c,order,rule,cumulative,secondary,orderB,ruleB,cumulativeB,tertiary,orderC,ruleC,cumulativeC,...rest}=project;
  let matrices=project.matrices;
  if (!Array.isArray(matrices) || !matrices.length) {
    matrices=[{id:'matrix-a',name:'Matrix A',values:a??zero(project.size),order:order??3,rule:rule??'1/(2^n)',cumulative:cumulative??true,enabled:true},
      {id:'matrix-b',name:'Matrix B',values:b??zero(project.size),order:orderB??2,rule:ruleB??'1/(2^n)',cumulative:cumulativeB??true,enabled:secondary??false}];
    // Keep existing third-matrix work without retaining a fixed C slot.
    if(tertiary || c?.some(row=>row.some(value=>value!==0))) matrices.push({id:'matrix-3',name:'Matrix 3',values:c??zero(project.size),order:orderC??2,rule:ruleC??'1/(2^n)',cumulative:cumulativeC??true,enabled:tertiary??false});
  }
  return {...rest,matrices,labels:sharedNames(project),nextMatrixNumber:Math.max(project.nextMatrixNumber??3,matrices.length+1),display:{...defaultDisplay,...project.display}};
}
export function resizeProject(project, size) {
  const fit = matrix => Array.from({length:size}, (_, i) => Array.from({length:size}, (_, j) => matrix?.[i]?.[j] ?? 0));
  return {size, matrices:project.matrices.map(matrix=>({...matrix,values:fit(matrix.values)})), labels:sharedNames(project, size)};
}
