import {rational} from './fractions.js';
import {defaultDisplay} from './project.js';
const pow10=n=>10n**BigInt(n);
const places=value=>Math.min(12,Math.max(0,Math.trunc(Number(value)||0)));
function roundedUnits(value, precision){
 const f=rational(value),scaled=f.n*pow10(precision),whole=scaled/f.d,remainder=scaled%f.d;
 return {magnitude:whole+(remainder*2n>=f.d?1n:0n),sign:f.s<0n?'-':''};
}
export function formatNumber(value, settings=defaultDisplay){
 const f=rational(value),config={...defaultDisplay,...settings};
 if(config.format==='fraction'){
  if(config.fractionPlaces===null)return f.toFraction();
  const count=places(config.fractionPlaces),{magnitude,sign}=roundedUnits(f,count);
  return rational(`${sign}${magnitude}`).div(pow10(count)).toFraction();
 }
 if(config.format==='decimal'){
  const count=places(config.decimalPlaces),{magnitude,sign}=roundedUnits(f,count),digits=magnitude.toString().padStart(count+1,'0');
  return `${magnitude===0n?'':sign}${count?digits.slice(0,-count)+'.'+digits.slice(-count):digits}`;
 }
 const count=places(config.scientificPlaces);
 if(f.n===0n)return `${count?'0.'+'0'.repeat(count):'0'}e+0`;
 let exponent=f.n.toString().length-f.d.toString().length;
 if(exponent>=0 ? f.n<f.d*pow10(exponent) : f.n*pow10(-exponent)<f.d)exponent--;
 let numerator=f.n,denominator=f.d;
 const shift=count-exponent;
 if(shift>=0)numerator*=pow10(shift);else denominator*=pow10(-shift);
 let units=numerator/denominator+(numerator%denominator*2n>=denominator?1n:0n);
 if(units>=pow10(count+1)){units/=10n;exponent++;}
 const digits=units.toString().padStart(count+1,'0');
 return `${f.s<0n?'-':''}${digits[0]}${count?'.'+digits.slice(1):''}e${exponent>=0?'+':''}${exponent}`;
}
export const precisionKey=format=>format==='decimal'?'decimalPlaces':format==='scientific'?'scientificPlaces':'fractionPlaces';
