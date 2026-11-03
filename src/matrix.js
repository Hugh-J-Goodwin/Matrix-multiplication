export const zero = n => Array.from({length:n},()=>Array(n).fill(0));
export function multiply(a,b){const c=zero(a.length);for(let i=0;i<a.length;i++)for(let k=0;k<a.length;k++)for(let j=0;j<a.length;j++)c[i][j]+=a[i][k]*b[k][j];return c;}
export const add=(a,b)=>a.map((r,i)=>r.map((v,j)=>v+b[i][j]));
export const scale=(a,s)=>a.map(r=>r.map(v=>v*s));
// Small scalar expression parser: no JavaScript evaluation or property access.
export function coefficient(expression,n){
 const tokens=expression.replace(/\s/g,'').match(/(?:\d*\.?\d+(?:e[+-]?\d+)?|n|[()+\-*/^])/gi)||[];
 if(tokens.join('')!==expression.replace(/\s/g,''))throw Error('Use numbers, n, parentheses, and + − * / ^ in your rule.');
 let p=0;function atom(){let t=tokens[p++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='('){let v=sum();if(tokens[p++]!==')')throw Error('Unclosed parentheses.');return v;}if(t==='n')return n;if(t===undefined||!Number.isFinite(Number(t)))throw Error('Invalid coefficient rule.');return Number(t);}
 function power(){let v=atom();if(tokens[p]==='^'){p++;v=v**power();}return v;}
 function product(){let v=power();while(['*','/'].includes(tokens[p])){let op=tokens[p++],r=power();v=op==='*'?v*r:v/r;}return v;}
 function sum(){let v=product();while(['+','-'].includes(tokens[p])){let op=tokens[p++],r=product();v=op==='+'?v+r:v-r;}return v;}
 const v=sum();if(p!==tokens.length||!Number.isFinite(v))throw Error('Rule must produce a finite number.');return v;
}
export function calculate(a,order,rule,cumulative){if(!Number.isInteger(order)||order<1||order>100)throw Error('Choose an order from 1 to 100.');if(a.some(r=>r.some(v=>!Number.isFinite(v))))throw Error('All matrix cells must be finite numbers.');let power=zero(a.length);power.forEach((r,i)=>r[i]=1);let result=zero(a.length);for(let n=1;n<=order;n++){power=multiply(power,a);if(cumulative||n===order)result=add(result,scale(power,coefficient(rule,n)));}if(result.some(r=>r.some(v=>!Number.isFinite(v))))throw Error('The result exceeds numeric limits. Reduce the order or coefficient.');return result;}
