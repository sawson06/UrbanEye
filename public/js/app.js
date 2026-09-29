const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const I={pin:"M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",alert:"M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01",clock:"M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",check:"M22 11.1V12a10 10 0 11-5.9-9.1M22 4L12 14l-3-3",nav:"M3 11l19-9-9 19-2-8-8-2z",search:"M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.3-4.3",plus:"M12 5v14M5 12h14",minus:"M5 12h14",loc:"M12 2a10 10 0 100 20 10 10 0 000-20zM22 12h-4M6 12H2M12 6V2M12 22v-4",eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 100 6 3 3 0 000-6z",off:"M17.9 17.9A10.9 10.9 0 0112 20C5 20 1 12 1 12a18 18 0 015.1-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2M1 1l22 22",x:"M18 6L6 18M6 6l12 12",up:"M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${I[n]}"/></svg>`;
const SV=['Low','Medium','High','Critical'],C=['#4ade80','#facc15','#fb923c','#f43f5e'];
const PL=[['Andheri East',19.1136,72.8697],['Marol',19.1180,72.8790],['Powai',19.1176,72.9060],['Saki Naka',19.1040,72.8890],['Jogeshwari',19.1360,72.8490],['Vile Parle',19.0990,72.8490]];
const LM={'Andheri East':'Near Western Express Hwy flyover','Marol':'Marol Naka junction','Powai':'Hiranandani Gardens gate','Saki Naka':'Saki Naka metro station','Jogeshwari':'Jogeshwari Link Road','Vile Parle':'Vile Parle flyover'};
const OC={'Andheri East':[450,330],'Marol':[560,250],'Powai':[780,180],'Saki Naka':[720,380],'Jogeshwari':[250,300],'Vile Parle':[330,470]},K=.00006;
/* Detection data comes from the server/API, not simulated pins. The AI payload may optionally include severity/status; missing fields stay unclassified/unresolved rather than being invented. */
let D=[];
let dataSignature='';
const REGION_RADIUS_KM=3;
const nearestRegion=(lat,lng)=>PL.reduce((best,p)=>{const d=L.latLng(lat,lng).distanceTo([p[1],p[2]]);return d<best.d?{name:p[0],d}:best},{name:'Unknown',d:Infinity}).name;
const regionDistanceKm=(p,r)=>L.latLng(p.lat,p.lng).distanceTo([r[1],r[2]])/1000;
const inSelectedRegion=p=>!!cur&&regionDistanceKm(p,cur)<=REGION_RADIUS_KM;
const parseSeverity=v=>{if(v===undefined||v===null||v==='')return null;if(typeof v==='number'&&v>=0&&v<=3)return Math.round(v);const x=String(v).toLowerCase();if(x.includes('critical'))return 3;if(x.includes('high')||x.includes('severe'))return 2;if(x.includes('medium')||x.includes('moderate'))return 1;if(x.includes('low')||x.includes('minor'))return 0;return null};
const normalizeDetection=(r,i)=>{const lat=Number(r.lat),lng=Number(r.lon??r.lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;const c=Number(r.confidence);return{id:r.id!==undefined?String(r.id):`det-${Date.now()}-${i}`,frame:r.frame??null,timestamp_sec:Number(r.timestamp_sec??0),lat,lng,c:Number.isFinite(c)?(c<=1?Math.round(c*100):Math.round(c)):0,s:parseSeverity(r.severity??r.level??r.priority),st:r.status||'Unresolved',frames_tracked:r.frames_tracked??null,bbox_xyxy:Array.isArray(r.bbox_xyxy)?r.bbox_xyxy:null,a:nearestRegion(lat,lng),n:0}};
const applyDetections=rows=>{const next=(Array.isArray(rows)?rows:rows?.detections||[]).map(normalizeDetection).filter(Boolean);const sig=JSON.stringify(next.map(p=>[p.id,p.lat,p.lng,p.c,p.st,p.s,p.frame]));const changed=sig!==dataSignature;D=next;if(changed){dataSignature=sig;D.forEach(p=>{if(!p.n)p.n=1});}cards();pins();list();if(changed&&next.length)toast(`Loaded ${next.length} AI detections from server`);setTimeout(()=>D.forEach(p=>p.n=0),1200);};
async function loadDetections(){try{const r=await fetch('/api/detections',{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);applyDetections(await r.json())}catch(e){toast('Detection server is not connected');}}
let dataPoll=null;
function startDetectionPolling(){loadDetections();clearInterval(dataPoll);dataPoll=setInterval(loadDetections,3000);}
let sel=null,cur=PL[0],rec=['Andheri East','Powai','Marol'];
const bdg=s=>s==null?'<span class="bd"><i style="background:#8ba2c4"></i>Unclassified</span>':`<span class="bd"><i style="background:${C[s]}"></i>${SV[s]}</span>`;
const tw=(ms,f,done)=>{if(RM)ms=0;const t0=performance.now();(function s(t){const p=ms?Math.min(1,(t-t0)/ms):1;f(p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2);p<1?requestAnimationFrame(s):done&&done()})(t0)};
const mapEl=$('#map'),map=L.map(mapEl,{zoomControl:false,minZoom:3,maxZoom:19,zoomSnap:.5}).setView([cur[1],cur[2]],15);
/* Real map data without a Google API key.
   Street layer: Esri World Street Map (public tile service; no API key in this setup).
   Satellite layer: Esri World Imagery + transportation/place labels. */
const ES='https://server.arcgisonline.com/ArcGIS/rest/services/';
const TL={
  map:()=>[
    L.tileLayer(ES+'World_Street_Map/MapServer/tile/{z}/{y}/{x}',{
      maxZoom:19,
      attribution:'&copy; Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community'
    })
  ],
  sat:()=>[
    L.tileLayer(ES+'World_Imagery/MapServer/tile/{z}/{y}/{x}',{
      maxZoom:19,
      attribution:'Imagery &copy; Esri'
    }),
    L.tileLayer(ES+'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{
      maxZoom:19,
      attribution:''
    }),
    L.tileLayer(ES+'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{
      maxZoom:19,
      attribution:''
    })
  ]
};
let bl=[];const base=(m,t)=>{bl.forEach(l=>m.removeLayer(l));bl=TL[t]().map(l=>l.addTo(m))};base(map,'map');
map.createPane('heatPane').style.cssText='z-index:350;pointer-events:none;filter:blur(7px)';
const hl=L.layerGroup().addTo(map),ml=L.layerGroup().addTo(map),mk={};
const cnt=(el,to)=>{const f=el._v||0;el._v=to;tw(900,e=>el.textContent=Math.round(f+(to-f)*e))};
const fl=p=>[['Severity',bdg(p.s)],['Coordinates',`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`],['Frame',p.frame??'—'],['Video time',Number.isFinite(p.timestamp_sec)?p.timestamp_sec.toFixed(2)+' s':'—'],['Detection confidence',p.c+'%'],['Frames tracked',p.frames_tracked??'—'],['Bounding box',p.bbox_xyxy?p.bbox_xyxy.map(v=>Number(v).toFixed(1)).join(', '):'—'],['Status',`<span class="stt ${p.st} ">${p.st}</span>`]].map(([k,v])=>`<div><span>${k}</span>${v}</div>`).join('');
function cards(){
const A=D.filter(inSelectedRegion),n=A.length,critical=A.filter(p=>p.s===3&&p.st!=='Resolved').length,resolved=A.filter(p=>p.st==='Resolved').length;
const v=[n,critical,resolved],L=[['Total Potholes','pin','AI detections in this area'],['Critical Potholes','alert','AI-labelled critical issues'],['Resolved Potholes','check','Resolved detections in this area']];
if(!$('#cds').children.length)$('#cds').innerHTML=L.map(l=>`<div class="pn cd"><div class="top">${l[0]}${ic(l[1])}</div><b>0</b><div class="tn">${ic('up')}${l[2]}</div></div>`).join('');
$$('#cds b').forEach((b,i)=>cnt(b,v[i]))
}
function pins(){const ids=new Set(D.map(p=>String(p.id)));
for(const id in mk)if(!ids.has(String(id))){ml.removeLayer(mk[id]);delete mk[id]}
D.forEach(p=>{const cls=`pkw${p.id==sel?' sel':''}${p.st=='Resolved'?' rs':''}${p.n?' nw':''}`,sig=cls+String(p.s),color=C[p.s]||'#22d3ee',critical=p.s===3&&p.st!='Resolved',
ic=()=>L.divIcon({className:cls,iconSize:[30,30],iconAnchor:[15,15],html:`<div class="pk" style="--c:${color}">${critical?'<u></u>':''}<i></i><b></b></div>`});
let m=mk[p.id];if(!m)m=mk[p.id]=L.marker([p.lat,p.lng],{icon:ic(),keyboard:false}).on('click',()=>sp(p.id,true)).addTo(ml);
else{m.setLatLng([p.lat,p.lng]);if(m._sig!=sig)m.setIcon(ic())}
m._sig=sig;m.setZIndexOffset(p.id==sel?1000:0)});
hl.clearLayers();D.filter(p=>p.st!='Resolved').forEach(p=>{const r=110+(p.s||0)*70;[[1,'#22d3ee',.16],[.62,'#fb923c',.22],[.3,'#f43f5e',.3]].forEach(([k,c,o])=>L.circle([p.lat,p.lng],{radius:r*k,pane:'heatPane',interactive:false,stroke:false,fillColor:c,fillOpacity:o+(p.s||0)*.04}).addTo(hl))})}
function list(){$('#tb').innerHTML=[...D].sort((a,b)=>b.id-a.id).map(p=>`<tr data-id="${p.id}" tabindex="0" class="${p.id==sel?'sel':''}"><td>PS-${p.id}</td><td>${p.a}</td><td>${bdg(p.s)}</td><td>${p.c}%</td><td><span class="stt ${p.st}">${p.st}</span></td></tr>`).join('')}
function detail(){const p=D.find(q=>q.id==sel),dt=$('#dt');if(!p)return dt.classList.remove('open');dt.classList.add('open');
$('#dc').innerHTML=`<div class="dc"><div class="hd"><h3>Pothole #PS-${p.id}</h3><button class="gl x2" id="cl" aria-label="Close">${ic('x')}</button></div>
<svg class="pv" viewBox="0 0 240 140" role="img" aria-label="AI detection preview"><defs><linearGradient id="as" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3648"/><stop offset="1" stop-color="#171f2e"/></linearGradient></defs><rect width="240" height="140" fill="url(#as)"/><path d="M0 118h240" stroke="#fff3" stroke-dasharray="10 8"/><ellipse cx="120" cy="90" rx="40" ry="18" fill="#0b0f18" stroke="#3d4a63" stroke-width="3"/><path d="M80 82l-20-12M160 80l24-12M120 108l6 18M98 104l-18 12" stroke="#0b0f18" stroke-width="2" fill="none"/><rect x="68" y="62" width="104" height="54" rx="4" fill="none" stroke="${C[p.s]||'#22d3ee'}" stroke-width="2" stroke-dasharray="5 3"/><rect x="68" y="50" width="84" height="12" fill="${C[p.s]||'#22d3ee'}"/><text x="72" y="59.5" font-size="9" font-weight="700" fill="#04121f">pothole ${p.c}%</text><text x="8" y="132" font-size="8" fill="#8ba2c4">AI model frame</text></svg>
<div class="dl">${fl(p)}</div><div class="ac"><button class="b2 p" id="vr">View Full Report</button><button class="b2" id="mr">Mark as Resolved</button><button class="b2" id="ri">Report Issue</button></div></div>`}
function sp(id,f){sel=id;const p=D.find(q=>String(q.id)===String(id));if(f&&p)map.flyTo([p.lat,p.lng],Math.max(map.getZoom(),17),{duration:.8});pins();list();detail()}
function toast(m){const t=$('#ts');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
function an(){const T=D.length,ln=(v,c,f)=>{const mx=Math.max(...v),mn=Math.min(...v),X=i=>10+i*300/(v.length-1),Y=x=>120-(x-mn)/(mx-mn||1)*95,d=v.map((x,i)=>(i?'L':'M')+X(i)+' '+Y(x)).join(''),g='a'+c.slice(1);
return`<svg viewBox="0 0 320 140"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d}L310 130L10 130Z" fill="url(#${g})"/><path class="dr" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${v.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x)}" r="8" fill="transparent" data-t="${f(x,i)}"/><circle cx="${X(i)}" cy="${Y(x)}" r="2.5" fill="${c}" pointer-events="none"/>`).join('')}</svg>`};
const RD=D.filter(inSelectedRegion);const cs=[0,1,2,3].map(s=>RD.filter(p=>p.s==s).length);const unclassified=RD.filter(p=>p.s==null).length;let o=0;
const dn=`<svg viewBox="0 0 320 140"><g transform="translate(70 70) rotate(-90)">${cs.map((c,s)=>{const l=c/T*251.3,e=`<circle class="dn" r="40" fill="none" stroke="${C[s]}" stroke-width="16" stroke-dasharray="${l} 251.3" stroke-dashoffset="${-o}" data-t="${SV[s]}: ${c} potholes"/>`;o+=l;return e}).join('')}</g><text x="70" y="76" text-anchor="middle" fill="#e6eefb" font-size="18" font-weight="800">${T}</text>${cs.map((c,s)=>`<circle cx="160" cy="${40+s*24}" r="5" fill="${C[s]}"/><text x="172" y="${44+s*24}" fill="#8ba2c4" font-size="12">${SV[s]}: ${c}</text>`).join('')}</svg>`;
const ar=PL.map(p=>[p[0],RD.filter(q=>q.a==p[0]).length]),mx=Math.max(1,...ar.map(a=>a[1]));
const bars=`<svg viewBox="0 0 320 150">${ar.map(([n,c],i)=>`<text x="0" y="${17+i*24}" fill="#8ba2c4" font-size="11">${n}</text><rect class="br" x="84" y="${6+i*24}" width="${c/mx*226}" height="14" rx="4" fill="#3b82f6" data-t="${n}: ${c} potholes"/>`).join('')}</svg>`;
const rs=RD.filter(p=>p.st=='Resolved').length,un=T-rs,av=T?Math.round(RD.reduce((a,p)=>a+p.c,0)/T):0;
const rv=`<svg viewBox="0 0 320 90"><rect class="br" x="10" y="20" width="${rs/T*300}" height="26" rx="6" fill="#4ade80" data-t="Resolved: ${rs}"/><rect class="br" x="${10+rs/T*300}" y="20" width="${un/T*300}" height="26" fill="#f43f5e" data-t="Unresolved: ${un}"/><text x="10" y="72" fill="#8ba2c4" font-size="12">Resolved ${rs}   Unresolved ${un}</text></svg>`;
const gg=`<svg viewBox="0 0 320 140"><g transform="translate(70 70) rotate(-90)"><circle r="42" fill="none" stroke="#ffffff1a" stroke-width="12"/><circle class="dn" r="42" fill="none" stroke="#22d3ee" stroke-width="12" stroke-linecap="round" stroke-dasharray="${av/100*263.9} 263.9" data-t="Average confidence ${av}%"/></g><text x="70" y="77" text-anchor="middle" fill="#e6eefb" font-size="22" font-weight="800">${av}%</text><text x="140" y="70" fill="#8ba2c4" font-size="12">Across ${T} detections</text></svg>`;
$('#an').innerHTML=[['Potholes detected over time',ln([12,18,15,22,19,27,24,31,28,35,30,38,34,41],'#3b82f6',(x,i)=>`Sep ${15+i}: ${x} detected`)],['Severity distribution',dn],['Potholes by area',bars],['Resolved vs unresolved',rv],['Average detection confidence',gg],['Road-condition trend',ln([58,60,59,63,66,65,69,72],'#22d3ee',(x,i)=>`Week ${i+1}: health score ${x}`)]].map(([t,s])=>`<div class="pn"><h3>${t}</h3>${s}</div>`).join('')}
function rep(){const p=D.find(q=>q.id==sel);$('#rp').innerHTML=p?`<h3>Full report: PS-${p.id}</h3><div class="dl">${fl(p)}</div><p style="margin-bottom:14px">Recommended action: ${p.s==null?'AI severity not provided; manual assessment required':['Routine patch in next cycle','Repair within 2 weeks','Repair within 7 days','Priority repair within 48 hours'][p.s]}.</p><button class="b2 p" onclick="print()">Export report</button>`:'<div class="mu">Select a pothole on the map or in the list to generate its report.</div>'}
function go(t){$('#dash').dataset.t=t;$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));if(t=='a')an();if(t=='r')rep();scrollTo(0,0);map.invalidateSize()}
const show=id=>{$$('.v').forEach(v=>v.classList.toggle('on',v.id==id));document.body.classList.toggle('d',id=='dash')};
function chips(){$('#rc').innerHTML='<span class="mu">Recent</span>'+rec.map(n=>`<button class="chip">${n}</button>`).join('')}
let zmap;
function pick(p){cur=p;rec=[p[0],...rec.filter(n=>n!=p[0])].slice(0,4);chips();const z=$('#zm');z.classList.add('on');
if(!zmap){zmap=L.map('zmap',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false});TL.map().forEach(l=>l.addTo(zmap))}
zmap.invalidateSize();zmap.setView([p[1],p[2]],10,{animate:false});$('#lt').textContent=`Scanning roads in ${p[0]}…`;
$('.pd').classList.remove('go');$('.bar').classList.remove('go');void z.offsetWidth;$('.bar').classList.add('go');
setTimeout(()=>zmap.flyTo([p[1],p[2]],16,{duration:1.8}),80);setTimeout(()=>$('.pd').classList.add('go'),1500);
setTimeout(()=>{
  show('dash');
  z.classList.remove('on');
  $('#lc').textContent=p[0];
  go('d');
  map.invalidateSize();
  map.setView([p[1],p[2]],12,{animate:false});
  map.flyTo([p[1],p[2]],15,{duration:1.4});
  if(p[0]!=='My Location' && L.latLng(p[1],p[2]).distanceTo([19.115,72.875])>60000)
    toast('Demo detections are only available around Mumbai');
},2900)}
const find=q=>PL.filter(p=>p[0].toLowerCase().includes(q.toLowerCase().trim()));
const showErr=m=>{$('#serr').textContent=m;$('#serr').classList.add('on')};
const clearErr=()=>$('#serr').classList.remove('on');
const indiaResult=r=>r&&r.address&&String(r.address.country_code||'').toLowerCase()=='in';
let sugTimer=0,sugBusy=0,gBusy=false;
function renderSuggestions(items){
  $('#sug').innerHTML=items.map((r,i)=>`<button type="button" data-gi="${i}">${ic('pin')}<span class="stx"><b>${r.name}</b><small>${r.display_name}</small></span></button>`).join('');
}
$('#q').oninput=e=>{
  const v=e.target.value.trim();clearErr();clearTimeout(sugTimer);
  if(!v){$('#sug').innerHTML='';return}
  const local=find(v);
  if(local.length){
    $('#sug').innerHTML=local.map((p,i)=>`<button type="button" data-i="${PL.indexOf(p)}">${ic('pin')}<span class="stx"><b>${p[0]}</b><small>Mumbai, Maharashtra, India</small></span></button>`).join('');
    return;
  }
  $('#sug').innerHTML='<button type="button" disabled>'+ic('search')+'<span class="stx"><small>Searching India…</small></span></button>';
  const token=++sugBusy;
  sugTimer=setTimeout(async()=>{
    try{
      const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&accept-language=en&countrycodes=in&q='+encodeURIComponent(v);
      const j=await (await fetch(u)).json();
      if(token!==sugBusy)return;
      const india=j.filter(indiaResult).map(r=>({name:r.name||r.display_name.split(',')[0],display_name:r.display_name,lat:+r.lat,lon:+r.lon}));
      $('#sug').innerHTML=india.map((r,i)=>`<button type="button" data-gi="${i}" data-name="${r.name.replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}" data-lat="${r.lat}" data-lon="${r.lon}">${ic('pin')}<span class="stx"><b>${r.name}</b><small>${r.display_name}</small></span></button>`).join('');
      if(!india.length) $('#sug').innerHTML='<button type="button" disabled>'+ic('pin')+'<span class="stx"><small>No matching location found in India</small></span></button>';
    }catch(err){if(token===sugBusy)$('#sug').innerHTML=''}
  },260);
};
/* Search is intentionally restricted to India. Known demo areas use stored coordinates; other places use Nominatim with countrycodes=in and an explicit country check. */
async function goTo(v){
  v=v.trim();if(!v||gBusy)return;clearErr();
  const r=find(v);if(r[0])return pick(r[0]);
  gBusy=true;$('#sug').innerHTML='';
  try{
    const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&accept-language=en&countrycodes=in&q='+encodeURIComponent(v);
    const j=await (await fetch(u)).json();
    const india=j.find(indiaResult);
    if(india){
      pick([india.name||india.display_name.split(',')[0],+india.lat,+india.lon]);
    }else{
      showErr('That location is outside India or could not be found. Please enter a location in India.');
    }
  }catch(err){showErr('Could not search right now. Please check your internet connection and try again.')}
  gBusy=false;
}
$('#q').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();goTo(e.target.value)}};
$('#sug').onclick=e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.i!==undefined){pick(PL[+b.dataset.i]);return;}
  const raw={name:b.dataset.name,lat:+b.dataset.lat,lon:+b.dataset.lon};
  if(raw.name&&Number.isFinite(raw.lat)&&Number.isFinite(raw.lon)){pick([raw.name,raw.lat,raw.lon]);return;}
};
$('#sug').addEventListener('mousedown',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const v=b.querySelector('b')?.textContent||'';if(v)$('#q').value=v;
});
$('#rc').onclick=e=>{if(e.target.matches('.chip'))pick(PL.find(p=>p[0]==e.target.textContent))};
$('#ul').onclick=()=>goTo($('#q').value);
$('nav').onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.t)};
$('#zi').onclick=()=>map.zoomIn();$('#zo').onclick=()=>map.zoomOut();$('#ce').onclick=()=>map.flyTo([cur[1],cur[2]],15,{duration:.8});
$('#tb').onclick=e=>{const r=e.target.closest('tr');if(r){sp(r.dataset.id,true);if(innerWidth<1000)mapEl.scrollIntoView({behavior:'smooth',block:'nearest'})}};
$('#tb').onkeydown=e=>{if(e.key=='Enter'&&e.target.dataset.id)sp(e.target.dataset.id,true)};
$('#md').onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#md button').forEach(x=>x.classList.toggle('on',x==b));$('#mw').classList.toggle('hm',b.dataset.m=='heat')};
$('#st').onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#st button').forEach(x=>x.classList.toggle('on',x==b));base(map,b.dataset.m)};
$('#sh').onchange=e=>$('#md button[data-m='+(e.target.checked?'heat':'pin')+']').click();
$('#ms').onkeydown=e=>{if(e.key!='Enter')return;const v=e.target.value.trim();if(!v)return;const m=v.match(/^(?:ps-?)?(\d{4})$/i),p=m&&D.find(q=>q.id==m[1]);if(p)sp(p.id,true);else{goTo(v);e.target.value=''}};
$('#dt').onclick=e=>{const b=e.target.closest('button');if(!b)return;const p=D.find(q=>q.id==sel);if(b.id=='cl'){sel=null;pins();list();detail()}
if(b.id=='vr'){go('r')}if(b.id=='ri')toast('Issue reported to the city road desk');if(b.id=='mr'){p.st='Resolved';toast(`PS-${p.id} marked as resolved`);cards();pins();list();detail()}};
document.addEventListener('pointerover',e=>{const t=e.target.dataset&&e.target.dataset.t,tp=$('#tp');tp.textContent=t||'';tp.style.opacity=t?1:0});
document.addEventListener('pointermove',e=>{const tp=$('#tp');tp.style.left=e.clientX+12+'px';tp.style.top=e.clientY+12+'px'});
$('#si').innerHTML=ic('search');
$('#ui').innerHTML=ic('search');
$('#li').innerHTML=ic('pin');
$('#mi').innerHTML=ic('search');
$('#zi').innerHTML=ic('plus');
$('#zo').innerHTML=ic('minus');
$('#ce').innerHTML=ic('loc');
chips();cards();pins();list();startDetectionPolling();
