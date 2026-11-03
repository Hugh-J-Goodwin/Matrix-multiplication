import React,{useEffect,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import{Grid2X2,Plus,ChevronRight,Folder,BookOpen,Settings2,Download,X,PanelLeft,Copy,RotateCcw,Maximize2,Play,Trash2}from'lucide-react';
import{supabase}from'./supabase';
import{zero}from'./matrix';
import{calculateSeries,fractionText,fractionSum,rankRows,matrixDelimited}from'./fractions';
import{normalizeProject,resizeProject,sharedNames,newMatrix}from'./project';
import{formatNumber,precisionKey}from'./format';
import{MatrixEditor,ExpandedMatrix}from'./MatrixView';
import{OperationCard,CombinedPreview}from'./Operations';
import{DeleteProject}from'./DeleteProject';
import{createWriteQueue}from'./cloud-writes';
import './style.css';

const sample=[[0,1,1,0,1],[0,0,1,1,0],[0,0,0,1,1],[1,0,0,0,1],[0,1,0,0,0]];
const fresh=()=>normalizeProject({id:crypto.randomUUID(),name:'Dominance exploration',size:5,a:sample.map(row=>[...row]),b:zero(5),order:3,rule:'1/(2^n)',cumulative:true,secondary:false});
function initial(){try{const data=JSON.parse(localStorage.getItem('dominant-projects'));if(Array.isArray(data)&&data.length)return data.map(normalizeProject);}catch{}return[fresh()];}
function downloadText(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function App(){
 const[projects,setProjects]=useState(initial),[active,setActive]=useState(null),[matrixId,setMatrixId]=useState(null),[tab,setTab]=useState('workspace');
 const[modal,setModal]=useState(null),[expanded,setExpanded]=useState(null),[result,setResult]=useState(null),[error,setError]=useState(''),[removed,setRemoved]=useState(null);
 const[user,setUser]=useState(null),[sync,setSync]=useState('Saved locally');
 const[collapsed,setCollapsed]=useState(()=>localStorage.getItem('dominant-sidebar')==='collapsed'),[mobile,setMobile]=useState(false),[smallScreen,setSmallScreen]=useState(()=>window.innerWidth<=640);
 const[deleting,setDeleting]=useState(null),[deleted,setDeleted]=useState(null);
 const cloudWrite=useRef(createWriteQueue()),saveTimer=useRef(null),deletedIds=useRef(new Set());
 const ready=useRef(false),project=projects.find(value=>value.id===active)||projects[0];
 const current=project.matrices.find(matrix=>matrix.id===matrixId)||project.matrices[0];
 const labels=sharedNames(project),display=project.display;
 const expandedMatrix=project.matrices.find(matrix=>matrix.id===expanded);
 function patch(values,invalidate=true){setProjects(previous=>previous.map(value=>value.id===project.id?{...value,...values}:value));if(invalidate){setResult(null);setError('');}}
 function updateMatrix(id,values){patch({matrices:project.matrices.map(matrix=>matrix.id===id?{...matrix,...values}:matrix)});}
 function rename(index,value){const next=[...labels];next[index]=value;patch({labels:next},false);}
 function selectProject(id){setActive(id);setMatrixId(null);setTab('workspace');setResult(null);setError('');setRemoved(null);setMobile(false);}
 function create(){const next=fresh();next.name='Untitled project';next.matrices=next.matrices.map(matrix=>({...matrix,values:zero(next.size)}));setProjects(previous=>[...previous,next]);selectProject(next.id);}
 function duplicate(){const next={...structuredClone(project),id:crypto.randomUUID(),name:project.name+' copy'};setProjects(previous=>[...previous,next]);selectProject(next.id);}
 function addMatrix(){const next=newMatrix(project.size,project.nextMatrixNumber);patch({matrices:[...project.matrices,next],nextMatrixNumber:project.nextMatrixNumber+1});setMatrixId(next.id);}
 function removeMatrix(matrix){if(project.matrices.length===1)return;setRemoved({matrix,index:project.matrices.findIndex(value=>value.id===matrix.id),projectId:project.id});patch({matrices:project.matrices.filter(value=>value.id!==matrix.id)});if(current.id===matrix.id)setMatrixId(null);}
 function undoRemove(){if(!removed||removed.projectId!==project.id)return;const matrices=[...project.matrices];matrices.splice(removed.index,0,removed.matrix);patch({matrices});setRemoved(null);}
 async function deleteProject(){
  const target=deleting;
  if(!target)return;
  if(user&&supabase&&!ready.current)throw Error('Cloud sync is unavailable. Reconnect before deleting this project.');
  clearTimeout(saveTimer.current);
  deletedIds.current.add(target.id);
  try{
   if(user&&supabase){const response=await cloudWrite.current(()=>supabase.from('projects').delete().eq('id',target.id).eq('user_id',user.id));if(response.error)throw Error(`Could not delete the cloud project: ${response.error.message}`);}
   setDeleted({project:target,index:projects.findIndex(value=>value.id===target.id)});
   const blank=fresh();blank.name='Untitled project';blank.matrices=blank.matrices.map(matrix=>({...matrix,values:zero(blank.size)}));
   setProjects(previous=>{const remaining=previous.filter(value=>value.id!==target.id);return remaining.length?remaining:[blank];});
   if(project.id===target.id)selectProject(null);
   setDeleting(null);
  }catch(err){deletedIds.current.delete(target.id);setProjects(previous=>[...previous]);throw err;}
 }
 function undoDeleteProject(){
  if(!deleted)return;
  deletedIds.current.delete(deleted.project.id);
  setProjects(previous=>{if(previous.some(value=>value.id===deleted.project.id))return previous;const next=[...previous];next.splice(Math.min(deleted.index,next.length),0,deleted.project);return next;});
  selectProject(deleted.project.id);setDeleted(null);
 }
 function run(){try{setResult(calculateSeries(project.matrices));setError('');}catch(err){setError(err.message);}}
 function resize(size){if(Number.isInteger(size)&&size>=1&&size<=25)patch(resizeProject(project,size));}
 function exportMatrix(){downloadText(matrixDelimited(result||current.values,labels,',',value=>formatNumber(value,display)),`${project.name}-${result?'result':current.name}.csv`);}
 function toggleSidebar(){if(smallScreen)setMobile(value=>!value);else setCollapsed(value=>!value);}
 useEffect(()=>{const change=()=>setSmallScreen(window.innerWidth<=640);window.addEventListener('resize',change);return()=>window.removeEventListener('resize',change);},[]);
 useEffect(()=>{localStorage.setItem('dominant-sidebar',collapsed?'collapsed':'open');},[collapsed]);
 useEffect(()=>{
  try{localStorage.setItem('dominant-projects',JSON.stringify(projects));}catch{setError('Device storage is full. Export your work or sign in to save it online.');}
  if(!supabase||!user||!ready.current)return;
  setSync('Syncing…');
  const timer=setTimeout(async()=>{try{const response=await cloudWrite.current(()=>{const rows=projects.filter(value=>!deletedIds.current.has(value.id)).map(value=>({id:value.id,user_id:user.id,name:value.name,data:value,updated_at:new Date().toISOString()}));return rows.length?supabase.from('projects').upsert(rows):{error:null};});const{error}=response;setSync(error?'Sync failed · saved locally':'All changes synced');if(error)setError(error.message);}catch{setSync('Sync failed · saved locally');}},900);
  saveTimer.current=timer;return()=>clearTimeout(timer);
 },[projects,user]);
 useEffect(()=>{
  if(!supabase)return;let live=true;
  async function connect(session){ready.current=false;setUser(session?.user||null);if(!session){setSync('Saved locally');return;}try{const{data,error}=await supabase.from('projects').select('*').order('updated_at',{ascending:false});if(!live)return;if(error){setError(error.message);setSync('Cloud unavailable · saved locally');return;}if(data.length)setProjects(previous=>{const map=new Map(previous.map(value=>[value.id,value]));data.forEach(row=>{if(!deletedIds.current.has(row.id))map.set(row.id,normalizeProject(row.data));});return [...map.values()];});ready.current=true;setSync('All changes synced');setProjects(previous=>[...previous]);}catch{if(live)setSync('Cloud unavailable · saved locally');}}
  supabase.auth.getSession().then(({data})=>connect(data.session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setTimeout(()=>connect(session),0));return()=>{live=false;subscription.unsubscribe();};
 },[]);
 return <div className={`app ${collapsed?'sidebar-collapsed':''}`}>
  {mobile&&smallScreen&&<button className="sidebar-scrim" aria-label="Close sidebar" onClick={()=>setMobile(false)}/>}
  <aside className={`sidebar ${mobile?'open':''}`}>
   <div className="brand-row"><a className="brand" href="#" onClick={event=>{event.preventDefault();setTab('workspace');}}><span className="brand-icon"><Grid2X2 size={20}/></span>dominant.</a><button className="icon-button" aria-label="Collapse sidebar" onClick={()=>{setCollapsed(true);setMobile(false);}}><PanelLeft size={18}/></button></div>
   <button className={`nav ${tab==='workspace'?'selected':''}`} onClick={()=>{setTab('workspace');setMobile(false);}}><Grid2X2 size={17}/>Workspace</button>
   <div className="side-heading">PROJECTS<button title="New project" aria-label="New project" onClick={create}><Plus size={16}/></button></div>
   <div className="project-list">{projects.map(value=><div key={value.id} className={`project-row ${value.id===project.id?'active':''}`}><button className={`project ${value.id===project.id?'active':''}`} onClick={()=>selectProject(value.id)}><Folder size={16}/><span>{value.name}</span>{value.id===project.id&&<span className="active-dot"/>}</button><button className="project-delete icon-button" aria-label={`Delete project ${value.name}`} title={`Delete ${value.name}`} onClick={()=>setDeleting(value)}><Trash2 size={14}/></button></div>)}</div>
   <button className="new-project" onClick={create}><Plus size={16}/>New project</button>
   <div className="side-bottom"><button className={`nav ${tab==='guide'?'selected':''}`} onClick={()=>{setTab('guide');setMobile(false);}}><BookOpen size={17}/>Guide</button><button className="profile" onClick={()=>setModal('auth')}><span className="avatar">{user?user.email[0].toUpperCase():'G'}</span><span><strong>{user?user.email.split('@')[0]:'Guest'}</strong><small>{user?'Cloud sync':'Saved on this device'}</small></span><Settings2 size={16}/></button></div>
  </aside>
  <div className="main"><header><div className="breadcrumb"><button className="sidebar-toggle icon-button" aria-label="Toggle sidebar" aria-expanded={smallScreen?mobile:!collapsed} onClick={toggleSidebar}><PanelLeft size={18}/></button><span>Workspace</span><ChevronRight size={14}/><strong>{tab==='guide'?'Guide':project.name}</strong></div><div className="header-right"><span className="save-state"><span className="status-dot"/>{sync}</span><button className="sign-in" onClick={()=>setModal('auth')}>{user?'Account':'Sign in'}</button></div></header>
   <main>{tab==='guide'?<Guide/>:<>
    <div className="page-heading"><h1>Matrix workspace</h1><button className="button secondary" onClick={create}><Plus size={16}/>New project</button></div>
    <div className="project-bar"><div><Folder size={18}/><input aria-label="Project name" value={project.name} onChange={event=>patch({name:event.target.value},false)}/></div><button className="icon-button" aria-label="Duplicate project" title="Duplicate project" onClick={duplicate}><Copy size={17}/></button></div>
    {deleted&&<div className="undo-message" role="status">Project “{deleted.project.name}” deleted.<button onClick={undoDeleteProject}>Undo delete</button><button className="icon-button" aria-label="Dismiss deleted project" onClick={()=>setDeleted(null)}><X size={14}/></button></div>}
    <DisplaySettings display={display} onChange={values=>patch({display:{...display,...values}},false)}/>
    {error&&<div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={14}/></button></div>}
    {removed?.projectId===project.id&&<div className="undo-message" role="status">{removed.matrix.name} removed.<button onClick={undoRemove}>Undo</button><button className="icon-button" aria-label="Dismiss undo" onClick={()=>setRemoved(null)}><X size={14}/></button></div>}
    <div className="editor-layout"><section className="card matrix-card" aria-label="Matrix editor"><div className="card-title"><h2>Matrices</h2><button className="button secondary compact" onClick={addMatrix}><Plus size={15}/>Add matrix</button></div>
     <div className="matrix-toolbar"><div className="tabs" role="tablist" aria-label="Matrices">{project.matrices.map(matrix=><button key={matrix.id} role="tab" aria-selected={current.id===matrix.id} className={current.id===matrix.id?'chosen':''} onClick={()=>setMatrixId(matrix.id)}>{matrix.name}</button>)}</div><button className="icon-button" aria-label={`Clear ${current.name}`} title="Clear matrix" onClick={()=>updateMatrix(current.id,{values:zero(project.size)})}><RotateCcw size={15}/></button></div>
     <div className="dimensions"><label>Dimensions<select aria-label="Matrix size" value={project.size} onChange={event=>resize(+event.target.value)}>{Array.from({length:25},(_,index)=><option key={index} value={index+1}>{index+1} × {index+1}</option>)}</select></label>{project.matrices.length>1&&<button className="export-button" onClick={()=>removeMatrix(current)}><Trash2 size={13}/>Remove</button>}</div>
     <p className="names-hint">Names are shared across all matrices.</p><MatrixEditor key={`${project.id}-${current.id}`} display={display} labels={labels} onRename={rename} matrix={current.values} name={current.name} onChange={values=>updateMatrix(current.id,{values})}/>
     <div className="matrix-actions"><span>Enter → next · Shift+Enter → back</span><button className="export-button" onClick={()=>setExpanded(current.id)}><Maximize2 size={14}/>Expand {current.name}</button></div><div className="matrix-footer"><span>{current.values.flat().filter(value=>value!==0).length} non-zero entries</span><button onClick={()=>setModal('import')}>Paste matrix</button></div>
    </section><div className="operations-list"><section className="card calculation-controls"><div><h2>Calculation</h2><span>{project.matrices.filter(matrix=>matrix.enabled).length} of {project.matrices.length} matrices included</span></div><button className="button primary" onClick={run}><Play size={14} fill="currentColor"/>Calculate</button></section>
     {project.matrices.map(matrix=><OperationCard key={matrix.id} matrix={matrix} onChange={values=>updateMatrix(matrix.id,values)} onSelect={()=>setMatrixId(matrix.id)} canRemove={project.matrices.length>1} onRemove={()=>removeMatrix(matrix)}/>)}<CombinedPreview matrices={project.matrices}/><button className="button primary calculate" onClick={run}><Play size={14} fill="currentColor"/>Calculate result</button>
    </div></div>
    <section className="card result-card"><div className="card-title"><h2>Result</h2><div className="result-actions">{result&&<button className="export-button" onClick={()=>setExpanded('result')}><Maximize2 size={14}/>Expand result</button>}<button className="export-button" onClick={exportMatrix}><Download size={14}/>{result?'Export CSV':'Export matrix'}</button></div></div>{result?<><ResultTable matrix={result} labels={labels} display={display}/><Rankings matrix={result} labels={labels} display={display}/></>:<div className="empty-result"><Grid2X2 size={25}/><p>Enter matrix values and choose Calculate.</p></div>}</section>
   </>}</main>
  </div>
  {expanded&&(expanded==='result'?result:expandedMatrix)&&<ExpandedMatrix labels={labels} onRename={expanded==='result'?null:rename} display={display} name={expanded==='result'?'Result':expandedMatrix.name} matrix={expanded==='result'?result:expandedMatrix.values} onChange={expanded==='result'?null:values=>updateMatrix(expandedMatrix.id,{values})} close={()=>setExpanded(null)}/>}
  {deleting&&<DeleteProject project={deleting} cloud={Boolean(user&&supabase)} onConfirm={deleteProject} onClose={()=>setDeleting(null)}/>}
  {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><div className="modal" role="dialog" aria-modal="true" aria-label={modal==='auth'?'Account':'Paste matrix'} onClick={event=>event.stopPropagation()}><button className="close" aria-label="Close" onClick={()=>setModal(null)}><X size={20}/></button>{modal==='auth'?<Auth user={user} close={()=>setModal(null)}/>:<ImportMatrix apply={values=>{const resized=resizeProject(project,values.length);patch({...resized,matrices:resized.matrices.map(matrix=>matrix.id===current.id?{...matrix,values}:matrix)});setModal(null);}}/>}</div></div>}
 </div>;
}

function DisplaySettings({display,onChange}){
 const key=precisionKey(display.format);
 return <section className="card display-settings" aria-label="Number display settings"><label>Number format<select aria-label="Number format" value={display.format} onChange={event=>onChange({format:event.target.value})}><option value="decimal">Decimal</option><option value="fraction">Fraction</option><option value="scientific">Scientific</option></select></label><label>Decimal places<select aria-label="Decimal places" value={display[key]===null?'exact':display[key]} onChange={event=>onChange({[key]:event.target.value==='exact'?null:+event.target.value})}>{display.format==='fraction'&&<option value="exact">Exact fraction</option>}{Array.from({length:13},(_,index)=><option key={index} value={index}>{index}</option>)}</select></label><p>{display.format==='fraction'?'Exact keeps the full fraction. A place count rounds before conversion.':'Precision changes display and exports; calculations and rankings stay exact.'}</p></section>;
}
function ResultTable({matrix,labels,display}){return <div className="result-scroll"><table aria-label="Final matrix"><thead><tr><th>Row / column</th>{labels.map((label,index)=><th key={index}>{label||`Item ${index+1}`}</th>)}<th>Row total</th></tr></thead><tbody>{matrix.map((row,index)=><tr key={index}><th>{labels[index]||`Item ${index+1}`}</th>{row.map((value,column)=><td key={column} title={fractionText(value)}>{formatNumber(value,display)}</td>)}<td className="row-sum">{formatNumber(fractionSum(row),display)}</td></tr>)}</tbody></table></div>;}
function Rankings({matrix,labels,display}){
 const ranked=rankRows(matrix,labels);
 function exportRanking(){downloadText(['Rank,Name,Row total',...ranked.map(row=>`${row.rank},"${row.name.replaceAll('"','""')}",${formatNumber(row.total,display)}`)].join('\n'),'dominance-ranking.csv');}
 return <section className="rankings" aria-label="Dominance rankings"><div className="ranking-heading"><div><h2>Dominance ranking</h2><p>Highest row total first. Ties share a rank (1, 1, 3).</p></div><button className="export-button" onClick={exportRanking}><Download size={14}/>Export ranking</button></div><table aria-label="Ranked rows"><thead><tr><th>Rank</th><th>Name</th><th>Original row</th><th>Row total</th></tr></thead><tbody>{ranked.map(row=><tr key={row.index} className={row.rank===1?'top-ranked':''}><td>{row.rank}</td><th>{row.name}</th><td>{row.index+1}</td><td title={fractionText(row.total)}>{formatNumber(row.total,display)}</td></tr>)}</tbody></table></section>;
}
function Auth({user,close}){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(event){event.preventDefault();if(!supabase)return;setBusy(true);try{const{error}=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(error)setMessage(error.message);else if(signup)setMessage('Check your email to confirm your account, then sign in.');else close();}catch{setMessage('Unable to connect. Try again.');}finally{setBusy(false);}}
 return <><h2>{user?'Account':signup?'Create account':'Sign in'}</h2>{user?<><p>{user.email}</p><button className="button primary" onClick={async()=>{await supabase.auth.signOut();close();}}>Sign out</button></>:<>{!supabase?<div className="setup-note">Cloud sync is not configured. Your work saves on this device.</div>:<form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)}/></label><label>Password<input type="password" autoComplete={signup?'new-password':'current-password'} required minLength={6} value={password} onChange={event=>setPassword(event.target.value)}/></label><button className="button primary" disabled={busy}>{busy?'Connecting…':signup?'Create account':'Sign in'}</button><button type="button" className="text-button" onClick={()=>setSignup(value=>!value)}>{signup?'Already registered? Sign in':'Create an account'}</button></form>}{message&&<p role="status">{message}</p>}</>}</>;
}
function ImportMatrix({apply}){
 const[text,setText]=useState(''),[error,setError]=useState('');
 return <><h2>Paste matrix</h2><p>Separate values with commas, spaces, or tabs. Put each row on a new line. Dimensions resize all matrices; overlapping values and names are kept.</p><textarea aria-label="Matrix values" rows={8} placeholder={'0, 1, 1\n0, 0, 1\n1, 0, 0'} value={text} onChange={event=>setText(event.target.value)}/>{error&&<p className="error">{error}</p>}<button className="button primary" onClick={()=>{const matrix=text.trim().split(/\n/).map(row=>row.trim().split(/[\s,;]+/).map(Number));if(!text.trim()||matrix.length>25||matrix.some(row=>row.length!==matrix.length||row.some(value=>!Number.isFinite(value))))return setError('Enter a square matrix of numbers, up to 25 × 25.');apply(matrix);}}>Use matrix</button></>;
}
function Guide(){
 const sections=[['Matrices','Choose dimensions from 1 × 1 to 25 × 25. Add matrix creates another input with the same dimensions and row/column names. Edit either axis name to rename it everywhere. Enter moves across rows; Shift+Enter moves back. Enter decimal or scientific values when editing a cell.'],['Calculations','Each matrix has the same controls. Set its maximum order (1–100), coefficient rule, and whether to include orders 1 through n. Use Include to select which series contribute to the final sum. Removing a matrix offers Undo. Delete a project with the sidebar trash icon, then confirm. Undo delete restores it. Deleting the last project opens a blank project.'],['Rules','Use 1 for Aⁿ, 3 for 3Aⁿ, or 1/(2^n) for Aⁿ / 2ⁿ. Rules support n, parentheses, +, -, *, /, and ^. Enter only the scalar coefficient. Function and series previews show the calculation.'],['Display and ranking','Choose decimal, fraction, or scientific notation. Each format remembers its precision. Decimal places range from 0 to 12; fractions can remain exact or be rounded before conversion. Editing shows the stored input value. Calculations and rankings always use exact fractions, regardless of display precision. Highest row total ranks first; equal totals share a rank.'],['Save and export','Projects save on this device. Sign in to sync them to your account. Expand any matrix to edit or copy it, use browser fullscreen, or save a PNG containing all rows and columns. CSV, copied values, and PNG use the selected number format. Avoid editing the same project on two devices at once.']];
 return <div className="guide"><h1>Guide</h1>{sections.map(([title,body])=><section key={title} className="card guide-card"><div><h2>{title}</h2><p>{body}</p></div></section>)}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);
