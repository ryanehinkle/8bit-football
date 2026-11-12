"use strict";
const TEAMS=[
["ari",22,"Arizona","Cardinals","NFC","West","#97233f","#ffb612"],["atl",1,"Atlanta","Falcons","NFC","South","#a71930","#ffffff"],
["bal",33,"Baltimore","Ravens","AFC","North","#241773","#ffb81c"],["buf",2,"Buffalo","Bills","AFC","East","#00338d","#c60c30"],
["car",29,"Carolina","Panthers","NFC","South","#0085ca","#101820"],["chi",3,"Chicago","Bears","NFC","North","#0b162a","#c83803"],
["cin",4,"Cincinnati","Bengals","AFC","North","#fb4f14","#111111"],["cle",5,"Cleveland","Browns","AFC","North","#311d00","#ff3c00"],
["dal",6,"Dallas","Cowboys","NFC","East","#003594","#a2aaad"],["den",7,"Denver","Broncos","AFC","West","#fb4f14","#002244"],
["det",8,"Detroit","Lions","NFC","North","#0076b6","#b0b7bc"],["gb",9,"Green Bay","Packers","NFC","North","#203731","#ffb612"],
["hou",34,"Houston","Texans","AFC","South","#03202f","#a71930"],["ind",11,"Indianapolis","Colts","AFC","South","#002c5f","#ffffff"],
["jax",30,"Jacksonville","Jaguars","AFC","South","#006778","#d7a22a"],["kc",12,"Kansas City","Chiefs","AFC","West","#e31837","#ffb81c"],
["lv",13,"Las Vegas","Raiders","AFC","West","#31373d","#a5acaf"],["lac",24,"Los Angeles","Chargers","AFC","West","#0080c6","#ffc20e"],
["lar",14,"Los Angeles","Rams","NFC","West","#003594","#ffd100"],["mia",15,"Miami","Dolphins","AFC","East","#008e97","#fc4c02"],
["min",16,"Minnesota","Vikings","NFC","North","#4f2683","#ffc62f"],["ne",17,"New England","Patriots","AFC","East","#002244","#c60c30"],
["no",18,"New Orleans","Saints","NFC","South","#101820","#d3bc8d"],["nyg",19,"New York","Giants","NFC","East","#0b2265","#a71930"],
["nyj",20,"New York","Jets","AFC","East","#125740","#ffffff"],["phi",21,"Philadelphia","Eagles","NFC","East","#004c54","#a5acaf"],
["pit",23,"Pittsburgh","Steelers","AFC","North","#101820","#ffb612"],["sf",25,"San Francisco","49ers","NFC","West","#aa0000","#b3995d"],
["sea",26,"Seattle","Seahawks","NFC","West","#002244","#69be28"],["tb",27,"Tampa Bay","Buccaneers","NFC","South","#d50a0a","#ff7900"],
["ten",10,"Tennessee","Titans","AFC","South","#0c2340","#4b92db"],["wsh",28,"Washington","Commanders","NFC","East","#5a1414","#ffb612"]
].map(function(x){return {slug:x[0],id:x[1],city:x[2],name:x[3],conference:x[4],division:x[5],primary:x[6],secondary:x[7]};});
const BY_SLUG=Object.fromEntries(TEAMS.map(function(t){return [t.slug,t];}));
const UNITS=["offense","defense","special"];
const OFFENSE=new Set(["QB","RB","FB","WR","TE","LT","LG","C","RG","RT","OT","OG","G","OL"]);
const SPECIAL=new Set(["K","P","LS","KR","PR"]);
const ORDER=["QB","RB","FB","WR","TE","LT","LG","C","RG","RT","OT","OG","G","OL","DE","DT","NT","EDGE","OLB","ILB","LB","MLB","CB","FS","SS","S","DB","K","P","LS","KR","PR"];
const LABELS={QB:"QUARTERBACK",RB:"RUNNING BACK",FB:"FULLBACK",WR:"WIDE RECEIVER",TE:"TIGHT END",LT:"LEFT TACKLE",LG:"LEFT GUARD",C:"CENTER",RG:"RIGHT GUARD",RT:"RIGHT TACKLE",OT:"OFFENSIVE TACKLE",OG:"OFFENSIVE GUARD",G:"GUARD",OL:"OFFENSIVE LINE",DE:"DEFENSIVE END",DT:"DEFENSIVE TACKLE",NT:"NOSE TACKLE",EDGE:"EDGE",OLB:"OUTSIDE LINEBACKER",ILB:"INSIDE LINEBACKER",LB:"LINEBACKER",MLB:"MIDDLE LINEBACKER",CB:"CORNERBACK",FS:"FREE SAFETY",SS:"STRONG SAFETY",S:"SAFETY",DB:"DEFENSIVE BACK",K:"KICKER",P:"PUNTER",LS:"LONG SNAPPER",KR:"KICK RETURNER",PR:"PUNT RETURNER"};
const $=function(id){return document.getElementById(id);};
let activeTeam="chi",unit="offense",snapshot=null,teamData=null,opened=null,requestId=0;

function escapeHTML(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function foreground(hex){
  let s=hex.replace("#",""),rgb=[0,2,4].map(function(i){return parseInt(s.slice(i,i+2),16)/255;}).map(function(v){return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.38?"#071422":"#ffffff";
}
function selected(){return BY_SLUG[activeTeam];}
function helmet(t){
  const a=escapeHTML(t.primary),b=escapeHTML(t.secondary),c=escapeHTML(t.slug.toUpperCase());
  return '<svg viewBox="0 0 106 96" shape-rendering="crispEdges" aria-hidden="true"><path d="M26 10H76V16H88V24H94V59H86V69H61V75H29V68H17V56H11V33H17V21H26Z" fill="#03070c"/>'+
  '<path d="M29 15H73V21H83V29H89V55H80V63H59V70H31V63H22V55H16V33H22V24H29Z" fill="'+a+'"/>'+
  '<path d="M35 16H49V23H34V29H23V40H18V31H25V22H35Z M47 16H56V35H47Z" fill="'+b+'"/>'+
  '<path d="M60 46H89V52H96V58H88V64H78V72H62V67H76V59H85V55H60Z" fill="#04080d"/>'+
  '<path d="M60 48H86V52H92V55H85V61H75V67H63V63H72V57H80V54H60Z" fill="#f6f3e6"/>'+
  '<path d="M58 45H64V54H58Z" fill="#d6e0dc"/><rect x="28" y="39" width="43" height="20" fill="#02050a" opacity=".55"/>'+
  '<text x="49" y="53" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="14" font-weight="900">'+c+'</text></svg>';
}
function jersey(p,t){
  const n=escapeHTML(p.number==null||p.number===""?"--":String(p.number).slice(0,3)),a=escapeHTML(t.primary),b=escapeHTML(t.secondary);
  return '<svg viewBox="0 0 52 56" shape-rendering="crispEdges" aria-hidden="true"><path d="M12 4H19V8H33V4H40V9H45V14H49V23H43V30H37V49H15V30H9V23H3V14H7V9H12Z" fill="#050a10"/>'+
  '<path d="M13 8H20V12H32V8H39V12H44V16H47V22H41V28H35V46H17V28H11V22H5V16H8V12H13Z" fill="'+a+'"/>'+
  '<path d="M11 15H17V21H11Z M35 15H41V21H35Z M15 42H37V46H15Z" fill="'+b+'"/>'+
  '<path d="M20 8H32V13H20Z" fill="#172535"/><text x="26" y="34" text-anchor="middle" fill="'+foreground(t.primary)+'" font-family="monospace" font-size="18" font-weight="900">'+n+'</text></svg>';
}
function fromHash(){
  const m=location.hash.match(/^#([a-z]+)(?:\/(offense|defense|special))?$/);
  return m&&BY_SLUG[m[1]]?{slug:m[1],unit:m[2]||"offense"}:null;
}
function saveURL(replace){
  const hash="#"+activeTeam+"/"+unit;
  if(location.hash!==hash)history[replace?"replaceState":"pushState"](null,"",hash);
}
function renderTeam(){
  const t=selected();
  document.documentElement.style.setProperty("--team",t.primary);
  document.documentElement.style.setProperty("--trim",t.secondary);
  $("teamHelmet").innerHTML=helmet(t);
  $("teamCity").textContent=t.city.toUpperCase();
  $("teamName").textContent=t.name.toUpperCase();
  $("teamDivision").textContent=t.conference+" "+t.division.toUpperCase();
  document.title=t.city+" "+t.name+" | 8-Bit Football";
  document.querySelectorAll("[data-unit]").forEach(function(b){
    const on=b.dataset.unit===unit;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));
  });
}
function setTeam(slug,push){
  if(!BY_SLUG[slug])return;
  activeTeam=slug;opened=null;
  try{localStorage.setItem("8bit-last-team",slug);}catch(e){}
  saveURL(!push);hidePicker();renderTeam();loadTeam();
}
function setUnit(next,push){
  if(!UNITS.includes(next))return;
  unit=next;opened=null;saveURL(!push);renderTeam();renderPositions();
}
function cycle(delta){
  const i=TEAMS.findIndex(function(t){return t.slug===activeTeam;});
  setTeam(TEAMS[(i+delta+TEAMS.length)%TEAMS.length].slug,true);
}
function showPicker(){
  $("picker").hidden=false;document.body.classList.add("modal-open");
  $("teamSearch").value="";drawChoices("");
  requestAnimationFrame(function(){$("teamSearch").focus();});
}
function hidePicker(){
  if($("picker").hidden)return;
  $("picker").hidden=true;document.body.classList.remove("modal-open");
  $("selectTeam").focus({preventScroll:true});
}
function drawChoices(q){
  const search=q.trim().toLowerCase();let html="";
  ["AFC","NFC"].forEach(function(conf){
    ["East","North","South","West"].forEach(function(div){
      const teams=TEAMS.filter(function(t){return t.conference===conf&&t.division===div&&(t.city+" "+t.name+" "+t.slug+" "+conf+" "+div).toLowerCase().includes(search);});
      if(!teams.length)return;
      html+='<div class="division-heading">'+conf+" "+div.toUpperCase()+'</div><div class="choices">';
      teams.forEach(function(t){
        html+='<button type="button" class="choice'+(t.slug===activeTeam?" chosen":"")+'" data-team="'+t.slug+'" style="--c:'+t.primary+';--ct:'+foreground(t.primary)+'">'+
        '<span class="choice-flag">'+escapeHTML(t.slug.toUpperCase())+'</span><span class="choice-info"><span class="choice-city">'+escapeHTML(t.city)+'</span><span class="choice-name">'+escapeHTML(t.name)+'</span></span></button>';
      });
      html+='</div>';
    });
  });
  $("teamGrid").innerHTML=html||'<p class="message">NO TEAMS FOUND.</p>';
}
function rosterFallback(response){
  const data={kind:"roster",updatedAt:new Date().toISOString(),offense:[],defense:[],special:[]};
  const maps={offense:new Map(),defense:new Map(),special:new Map()};
  (response.athletes||[]).forEach(function(section){
    const items=Array.isArray(section.items)?section.items:[section];
    items.forEach(function(p){
      if(!p||!p.displayName)return;
      const pos=p.position||{},code=String(pos.abbreviation||"").toUpperCase();
      const group=SPECIAL.has(code)?"special":OFFENSE.has(code)?"offense":"defense";
      if(!maps[group].has(code))maps[group].set(code,{code:code||"OTHER",label:LABELS[code]||pos.name||"OTHER",players:[]});
      maps[group].get(code).players.push({id:String(p.id||""),name:p.displayName,number:p.jersey||"",position:code,rank:null,
        experience:p.experience&&p.experience.years,college:p.college&&p.college.name,height:p.displayHeight,weight:p.displayWeight,status:p.status&&p.status.name});
    });
  });
  UNITS.forEach(function(cat){
    data[cat]=Array.from(maps[cat].values()).sort(function(a,b){
      const ia=ORDER.indexOf(a.code),ib=ORDER.indexOf(b.code);
      return (ia<0?99:ia)-(ib<0?99:ib);
    });
  });
  return data;
}
async function readSnapshot(){
  try{
    const response=await fetch("./data/depthcharts.json",{cache:"no-store"});
    if(!response.ok)throw Error("no cache");
    const json=await response.json();
    snapshot=json&&json.teams?json:null;
  }catch(e){snapshot=null;}
}
async function loadTeam(){
  const id=++requestId,t=selected();
  teamData=null;$("count").innerHTML="--<small>PLAYERS</small>";
  $("dataStatus").textContent="LOADING LINEUP...";
  $("positions").innerHTML='<div class="message"><span class="football">◆</span>LOADING ROSTER...</div>';
  if(snapshot&&snapshot.teams[t.id]){
    teamData=snapshot.teams[t.id];renderPositions();return;
  }
  try{
    const response=await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/"+t.id+"/roster",{cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const data=await response.json();
    if(id!==requestId)return;
    teamData=rosterFallback(data);renderPositions();
  }catch(error){
    if(id!==requestId)return;
    $("dataStatus").textContent="ROSTER NOT AVAILABLE";
    $("positions").innerHTML='<div class="message">COULD NOT LOAD THIS TEAM.<br>CHECK YOUR CONNECTION.<button type="button" id="retry" class="retry">RETRY ↻</button></div>';
  }
}
function dateText(iso){
  if(!iso)return "";
  const d=new Date(iso);
  return isNaN(d.getTime())?"":d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
}
function extra(p,g){
  const bits=[];
  if(p.position||g.code)bits.push("POS <b>"+escapeHTML(p.position||g.code)+"</b>");
  if(p.experience!=null)bits.push("EXP <b>"+escapeHTML(p.experience)+" YR</b>");
  if(p.height)bits.push("HT <b>"+escapeHTML(p.height)+"</b>");
  if(p.weight)bits.push("WT <b>"+escapeHTML(p.weight)+"</b>");
  if(p.college)bits.push("COLLEGE <b>"+escapeHTML(p.college)+"</b>");
  if(p.status&&p.status.toLowerCase()!=="active")bits.push("STATUS <b>"+escapeHTML(p.status)+"</b>");
  if(/^\d+$/.test(String(p.id||"")))bits.push('<a href="https://www.espn.com/nfl/player/_/id/'+escapeHTML(p.id)+'" target="_blank" rel="noopener noreferrer">PLAYER PROFILE ↗</a>');
  return bits.map(function(x){return "<div>"+x+"</div>";}).join("");
}
function renderPositions(){
  if(!teamData)return;
  const groups=Array.isArray(teamData[unit])?teamData[unit]:[],t=selected();
  const count=groups.reduce(function(total,g){return total+(g.players||[]).length;},0);
  $("count").innerHTML=String(count).padStart(2,"0")+'<small>PLAYERS</small>';
  $("dataStatus").textContent=(teamData.kind==="depth"?"DEPTH CHART":"TEAM ROSTER · ORDER UNVERIFIED")+
    (teamData.updatedAt?" · "+dateText(teamData.updatedAt):"")+" · ESPN";
  if(!count){$("positions").innerHTML='<div class="message">NO PLAYERS LISTED.<br>TRY ANOTHER CATEGORY.</div>';return;}
  let html="";
  groups.forEach(function(group,gi){
    if(!group.players||!group.players.length)return;
    const code=String(group.code||"?").toUpperCase(),title=String(group.label||LABELS[code]||code).toUpperCase();
    html+='<details class="position" open><summary><span class="pos-badge">'+escapeHTML(code.slice(0,2))+'</span><span class="pos-label">'+escapeHTML(title)+'</span><span class="pos-qty">'+group.players.length+'</span><span class="caret">▼</span></summary><div class="player-list">';
    group.players.forEach(function(p,pi){
      const key=gi+":"+pi,expanded=opened===key;
      const rank=p.rank==null?"--":String(p.rank).padStart(2,"0");
      html+='<div class="player"><button type="button" class="player-button" data-player="'+key+'" aria-expanded="'+expanded+'">'+
        '<span class="player-rank">'+escapeHTML(rank)+'</span><span class="jersey">'+jersey(p,t)+'</span>'+
        '<span class="player-detail"><span class="player-name">'+escapeHTML(p.name||"Unknown player")+'</span><span class="player-meta">'+escapeHTML(code)+(p.rank===1&&teamData.kind==="depth"?" · STARTER":"")+'</span></span>'+
        '<span class="player-arrow">▶</span></button>';
      if(expanded)html+='<div class="extra">'+extra(p,group)+'</div>';
      html+='</div>';
    });
    html+='</div></details>';
  });
  $("positions").innerHTML=html;
}
$("prevTeam").addEventListener("click",function(){cycle(-1);});
$("nextTeam").addEventListener("click",function(){cycle(1);});
$("selectTeam").addEventListener("click",showPicker);
$("closePicker").addEventListener("click",hidePicker);
$("shade").addEventListener("click",hidePicker);
$("teamSearch").addEventListener("input",function(){drawChoices(this.value);});
$("teamGrid").addEventListener("click",function(e){const choice=e.target.closest("[data-team]");if(choice)setTeam(choice.dataset.team,true);});
document.querySelectorAll("[data-unit]").forEach(function(b){b.addEventListener("click",function(){setUnit(b.dataset.unit,true);});});
$("reload").addEventListener("click",async function(){await readSnapshot();loadTeam();});
$("positions").addEventListener("click",function(e){
  if(e.target.closest("#retry")){loadTeam();return;}
  const row=e.target.closest("[data-player]");if(!row)return;
  opened=opened===row.dataset.player?null:row.dataset.player;renderPositions();
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!$("picker").hidden)hidePicker();});
window.addEventListener("hashchange",function(){
  const h=fromHash();if(!h)return;
  const changed=h.slug!==activeTeam;activeTeam=h.slug;unit=h.unit;opened=null;
  renderTeam();if(changed)loadTeam();else renderPositions();
});
(async function(){
  const h=fromHash();let last="";
  try{last=localStorage.getItem("8bit-last-team")||"";}catch(e){}
  activeTeam=h?h.slug:BY_SLUG[last]?last:"chi";unit=h?h.unit:"offense";
  saveURL(true);renderTeam();await readSnapshot();loadTeam();
})();
