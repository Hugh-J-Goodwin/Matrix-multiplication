import React from 'react';
import{Trash2}from'lucide-react';
export function SeriesTerm({matrix}){
 const {name,order,rule,cumulative}=matrix;
 return cumulative?<span className="series-term"><span className="sigma">Σ<small>k = 1</small><sup>{order||'n'}</sup></span><span>({rule.replaceAll('n','k')}) {name==='Matrix A'?'A':name==='Matrix B'?'B':name.replace('Matrix ','M')}<sup>k</sup></span></span>:<span className="series-term">({rule.replaceAll('n',`(${order||'n'})`)}) {name==='Matrix A'?'A':name==='Matrix B'?'B':name.replace('Matrix ','M')}<sup>{order||'n'}</sup></span>;
}
export function OperationCard({matrix,onChange,onRemove,canRemove,onSelect}){
 const {name,order,rule,cumulative,enabled}=matrix;
 const symbol=name==='Matrix A'?'A':name==='Matrix B'?'B':`M${name.replace('Matrix ','')}`;
 function updateOrder(value){onChange({order:value});}
 const orderId=`order-${matrix.id}`,ruleId=`rule-${matrix.id}`;
 return <section className={`card operations-card ${enabled?'':'series-disabled'}`} aria-label={`${name} settings`}>
  <div className="card-title"><button className="series-select" onClick={onSelect}>{name}</button><div className="series-actions"><label className="include-series"><input type="checkbox" checked={enabled} onChange={e=>onChange({enabled:e.target.checked})}/>Include</label>{canRemove&&<button className="icon-button" aria-label={`Remove ${name}`} title={`Remove ${name}`} onClick={onRemove}><Trash2 size={15}/></button>}</div></div>
  <div className="operation-content">
   <div className="order-row"><label className="field-label" htmlFor={orderId}>Maximum order <i>n</i></label><div className="stepper"><button aria-label={`Decrease ${name} order`} onClick={()=>updateOrder(Math.max(1,Number(order)-1))}>−</button><input id={orderId} aria-label={`${name} order`} type="number" min="1" max="100" value={order} onFocus={e=>e.target.select()} onClick={e=>e.target.select()} onChange={e=>updateOrder(e.target.value===''?'':+e.target.value)} onBlur={()=>{const next=Math.min(100,Math.max(1,Math.trunc(Number(order)||1)));if(next!==order)updateOrder(next);}}/><button aria-label={`Increase ${name} order`} onClick={()=>updateOrder(Math.min(100,Number(order)+1))}>+</button></div></div>
   <label className="field-label" htmlFor={ruleId}>Coefficient rule</label><div className="rule-input"><span>f(n) =</span><input id={ruleId} aria-label={`${name} coefficient`} value={rule} onChange={e=>onChange({rule:e.target.value})}/></div><p className="helper">Use n for the order. Example: 1/(2^n).</p>
   <div className="toggle-row"><div><strong>Include previous orders</strong><p>Sum orders 1 through n</p></div><button aria-label={`${name} include previous orders`} role="switch" aria-checked={cumulative} className={`toggle ${cumulative?'on':''}`} onClick={()=>onChange({cumulative:!cumulative})}><span/></button></div>
   <div className="formula series-preview" aria-label={`${name} function and series preview`}><span>FUNCTION</span><div><span>f<sub>{symbol}</sub>(n) = ({rule}) {symbol}<sup>n</sup></span></div><span>SERIES · ORDER {order||'—'}</span><div><span>S<sub>{symbol}</sub> = </span><SeriesTerm matrix={matrix}/></div></div>
  </div>
 </section>;
}
export function CombinedPreview({matrices}){
 const enabled=matrices.filter(matrix=>matrix.enabled);
 return <div className="formula combined-preview" aria-label="Combined series preview"><span>RESULT EXPRESSION</span><div className="combined-terms">{enabled.length?enabled.map((matrix,index)=><React.Fragment key={matrix.id}>{index>0&&<span>+</span>}<SeriesTerm matrix={matrix}/></React.Fragment>):<span>Select at least one matrix to include.</span>}</div></div>;
}
