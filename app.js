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
  const main=escapeHTML(t.primary),trim=escapeHTML(t.secondary);
  const short=escapeHTML(t.slug.toUpperCase());
  return '<span class="helmet-art"><svg viewBox="0 0 108 92" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path d="M29 4H72V9H83V14H92V24H98V53H93V61H84V67H59V73H36V68H25V63H16V52H11V29H16V18H22V10H29Z" fill="#03070c"/>' +
    '<path d="M29 10H72V15H82V20H88V28H94V51H88V56H80V62H60V68H37V63H26V57H21V50H16V29H21V20H29Z" fill="'+main+'"/>' +
    '<path d="M30 10H72V15H82V20H48V15H30Z M21 29H27V51H21Z" fill="'+trim+'"/>' +
    '<path d="M28 20H36V25H28Z M21 27H27V39H21Z M27 16H33V20H27Z" fill="#ffffff" opacity=".45"/>' +
    '<path d="M61 50H95V55H102V61H96V67H82V75H71V81H58V75H69V69H77V63H86V59H61Z" fill="#020408"/>' +
    '<path d="M62 51H93V56H99V60H92V63H80V69H72V75H62V71H69V65H76V59H84V56H62Z" fill="#ecebe7"/>' +
    '<path d="M65 54H82V58H65Z M79 64H84V69H79Z" fill="#a8b3bb"/>' +
    '<rect x="56" y="44" width="8" height="13" fill="#05090c"/><rect x="58" y="46" width="6" height="7" fill="'+trim+'"/>' +
    '<rect x="35" y="64" width="20" height="4" fill="#05090c"/>' +
    '</svg><span class="helmet-mark-fallback">'+short+'</span><canvas class="helmet-logo" width="20" height="20" aria-hidden="true"></canvas></span>';
}
function renderHelmetLogo(t){
  const target=$("teamHelmet"),canvas=target&&target.querySelector("canvas");
  if(!canvas)return;
  const image=new Image();
  // Rasterize the genuine team mark into 20x20 pixels, then scale with nearest-neighbor.
  // Drawing an external image is fine for display; pixel data is never read/exported.
  image.onload=function(){
    if(!canvas.isConnected||activeTeam!==t.slug)return;
    try{
      const ctx=canvas.getContext("2d");
      ctx.clearRect(0,0,20,20);
      ctx.imageSmoothingEnabled=false;
      const ratio=Math.min(18/image.naturalWidth,18/image.naturalHeight);
      const w=Math.max(1,Math.floor(image.naturalWidth*ratio));
      const h=Math.max(1,Math.floor(image.naturalHeight*ratio));
      ctx.drawImage(image,Math.floor((20-w)/2),Math.floor((20-h)/2),w,h);
      canvas.classList.add("loaded");
      const label=target.querySelector(".helmet-mark-fallback");if(label)label.hidden=true;
    }catch(error){/* Keep the pixel fallback if the CDN fails. */}
  };
  image.src="https://a.espncdn.com/i/teamlogos/nfl/500/"+encodeURIComponent(t.slug)+".png";
}
function jersey(p,t){
  const n=escapeHTML(p.number==null||p.number===""?"--":String(p.number).slice(0,2));
  const main=escapeHTML(t.primary),trim=escapeHTML(t.secondary);
  const text=foreground(t.primary);
  return '<svg viewBox="0 0 56 62" shape-rendering="crispEdges" aria-hidden="true">' +
    '<path d="M14 5H21V9H35V5H42V10H47V15H52V21H56V32H47V38H43V55H13V38H9V32H0V21H4V15H9V10H14Z" fill="#03070b"/>' +
    '<path d="M15 10H22V13H34V10H41V14H46V19H50V23H52V29H45V34H40V52H16V34H11V29H4V23H6V19H10V14H15Z" fill="'+main+'"/>' +
    '<path d="M16 10H22V15H34V10H40V15H35V19H21V15H16Z" fill="'+trim+'"/>' +
    '<path d="M5 22H12V26H5Z M44 22H51V26H44Z M6 29H13V32H6Z M43 29H50V32H43Z M16 47H40V51H16Z" fill="'+trim+'"/>' +
    '<path d="M16 19H21V23H16Z M35 19H40V23H35Z" fill="#ffffff" opacity=".32"/>' +
    '<rect x="17" y="52" width="22" height="3" fill="#03070b"/>' +
    '<text x="28" y="40" text-anchor="middle" font-family="Pixelify Sans,monospace" font-size="23" font-weight="700" paint-order="stroke" stroke="'+main+'" stroke-width="2.5" fill="'+text+'">'+n+'</text></svg>';
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
  renderHelmetLogo(t);
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

function normalizeRosterPlayer(p,code){
  const pos=p.position||{};
  return {
    id:String(p.id||""),name:p.displayName||p.fullName||p.name||"",
    number:String(p.jersey||p.number||""),position:code||String(pos.abbreviation||"").toUpperCase(),
    rank:null,experience:p.experience&&p.experience.years,college:p.college&&p.college.name,
    height:p.displayHeight||"",weight:p.displayWeight||"",status:p.status&&p.status.name||""
  };
}
function rosterFallback(response){
  const data={kind:"roster",updatedAt:new Date().toISOString(),offense:[],defense:[],special:[]};
  const maps={offense:new Map(),defense:new Map(),special:new Map()};
  const athleteGroups=Array.isArray(response.athletes)?response.athletes:[];
  athleteGroups.forEach(function(section){
    const items=Array.isArray(section.items)?section.items:[section];
    items.forEach(function(p){
      if(!p||!(p.displayName||p.fullName))return;
      const pos=p.position||{},code=String(pos.abbreviation||section.abbreviation||"").toUpperCase();
      const category=SPECIAL.has(code)?"special":OFFENSE.has(code)?"offense":"defense";
      if(!maps[category].has(code))maps[category].set(code,{
        code:code||"OTHER",label:LABELS[code]||pos.name||section.position||"OTHER",players:[]
      });
      maps[category].get(code).players.push(normalizeRosterPlayer(p,code));
    });
  });
  UNITS.forEach(function(category){
    data[category]=Array.from(maps[category].values()).sort(function(a,b){
      const ia=ORDER.indexOf(a.code),ib=ORDER.indexOf(b.code);
      return (ia<0?99:ia)-(ib<0?99:ib);
    });
  });
  return data;
}
function parseLiveDepthChart(payload, roster){
  if(!payload||!Array.isArray(payload.depthCharts))return null;
  const units={offense:[],defense:[],special:[]};
  const byId=new Map();
  if(roster)UNITS.forEach(function(category){
    (roster[category]||[]).forEach(function(group){
      (group.players||[]).forEach(function(p){if(p.id)byId.set(String(p.id),p);});
    });
  });
  payload.depthCharts.forEach(function(chart){
    const name=String(chart.name||chart.displayName||"").toLowerCase();
    const category=name.includes("special")?"special":name.includes("defen")?"defense":"offense";
    const positions=chart.positions||{};
    Object.keys(positions).forEach(function(key){
      const pos=positions[key];if(!pos||!Array.isArray(pos.athletes))return;
      const meta=pos.position||{};
      const code=String(meta.abbreviation||key).toUpperCase();
      const players=pos.athletes.map(function(entry,i){
        const athlete=entry.athlete||entry;
        const prior=byId.get(String(athlete.id||""))||{};
        return Object.assign({},prior,{
          id:String(athlete.id||prior.id||""),
          name:athlete.displayName||athlete.fullName||prior.name||"",
          number:String(athlete.jersey||prior.number||""),
          position:code,rank:entry.rank||i+1
        });
      }).filter(function(p){return !!p.name;});
      if(players.length)units[category].push({code,label:meta.name||LABELS[code]||key,players});
    });
  });
  if(!UNITS.some(function(category){return units[category].length;}))return null;
  return Object.assign({kind:"depth",updatedAt:new Date().toISOString(),live:true},units);
}
function overlayRoster(chart,roster){
  if(!chart||chart.kind!=="depth"||!roster)return chart;
  const byId=new Map();
  UNITS.forEach(function(category){
    (roster[category]||[]).forEach(function(group){
      (group.players||[]).forEach(function(p){if(p.id)byId.set(String(p.id),p);});
    });
  });
  const result=Object.assign({},chart);
  UNITS.forEach(function(category){
    result[category]=(chart[category]||[]).map(function(group){
      return Object.assign({},group,{players:(group.players||[]).map(function(player){
        const current=byId.get(String(player.id));
        return current?Object.assign({},player,{
          name:current.name||player.name,number:current.number||player.number,
          college:current.college||player.college,experience:current.experience!=null?current.experience:player.experience,
          height:current.height||player.height,weight:current.weight||player.weight,status:current.status||player.status
        }):player;
      })});
    });
  });
  return result;
}

/* Sleeper supplies depth-chart ranks for many NFL skill positions.
   Cache its large roster locally for 24h, per Sleeper API recommendations.
   Never invent a rank for players missing from its published data. */
let sleeperIndex=null,sleeperRequest=null;
function sleeperTeam(slug){
  return ({wsh:"WAS",lar:"LAR",jax:"JAX",lv:"LV"})[slug]||slug.toUpperCase();
}
function normalizeName(value){
  return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
}
async function loadSleeper(){
  if(sleeperIndex)return sleeperIndex;
  if(sleeperRequest)return sleeperRequest;
  sleeperRequest=(async function(){
    try{
      const cache=JSON.parse(localStorage.getItem("8bit-sleeper-day")||"null");
      if(cache&&cache.data&&Date.now()-cache.saved<23*3600*1000){
        sleeperIndex=cache.data;return sleeperIndex;
      }
    }catch(error){}
    try{
      const response=await fetch("https://api.sleeper.app/v1/players/nfl?active=true",{cache:"default"});
      if(!response.ok)throw Error("Sleeper HTTP "+response.status);
      const all=await response.json(),compact={};
      Object.values(all).forEach(function(player){
        const rank=Number(player.depth_chart_order);
        if(!player.team||!player.active||!player.position||!Number.isInteger(rank)||rank<1)return;
        const team=String(player.team).toUpperCase();
        if(!compact[team])compact[team]=[];
        compact[team].push([
          normalizeName(player.full_name||[player.first_name,player.last_name].filter(Boolean).join(" ")),
          String(player.position).toUpperCase(),rank,
          String(player.espn_id||""),String(player.number||"")
        ]);
      });
      sleeperIndex=compact;
      try{localStorage.setItem("8bit-sleeper-day",JSON.stringify({saved:Date.now(),data:compact}));}catch(error){}
      return sleeperIndex;
    }catch(error){return null;}
  })();
  return sleeperRequest;
}
function addSleeperDepth(roster,t){
  if(!roster||!sleeperIndex||roster.kind==="depth")return roster;
  const aliases=[sleeperTeam(t.slug)];
  if(t.slug==="wsh")aliases.push("WSH");
  if(t.slug==="lar")aliases.push("LA");
  if(t.slug==="jax")aliases.push("JAC");
  const players=aliases.flatMap(function(team){return sleeperIndex[team]||[];});
  if(!players.length)return roster;
  const byESPN=new Map(),byName=new Map();
  players.forEach(function(row){
    if(row[3])byESPN.set(row[3],row);
    if(row[0])byName.set(row[0],row);
  });
  const output=Object.assign({},roster);
  let ranked=0;
  UNITS.forEach(function(category){
    output[category]=(roster[category]||[]).map(function(group){
      const members=(group.players||[]).map(function(p){
        const matched=byESPN.get(String(p.id||""))||byName.get(normalizeName(p.name));
        if(!matched||matched[2]==null)return p;
        ranked++;
        return Object.assign({},p,{rank:matched[2],number:p.number||matched[4]||""});
      });
      members.sort(function(a,b){return (a.rank==null?10000:a.rank)-(b.rank==null?10000:b.rank);});
      return Object.assign({},group,{players:members});
    });
  });
  if(ranked){
    output.kind="partial";
    output.depthSource="Sleeper";
  }
  return output;
}

function validTeamData(value){
  return value && UNITS.some(function(cat){return Array.isArray(value[cat])&&value[cat].some(function(group){return group.players&&group.players.length;});});
}
function cachedTeam(slug){
  try{
    const text=localStorage.getItem("8bit-roster:"+slug);
    if(!text)return null;
    const value=JSON.parse(text);
    return validTeamData(value)&&Date.now()-new Date(value.updatedAt).getTime()<24*3600*1000?value:null;
  }catch(error){return null;}
}
function storeTeam(slug,value){
  try{localStorage.setItem("8bit-roster:"+slug,JSON.stringify(value));}catch(error){}
}
function useTeamData(value,id,slug){
  if(id!==requestId||slug!==activeTeam||!validTeamData(value))return;
  teamData=value;
  renderPositions();
}
async function readSnapshot(){
  const stamp=Date.now();
  // Read the committed data independently from GitHub Pages deployments.
  // GITHUB_TOKEN commits do not automatically trigger a branch Pages rebuild.
  const urls=[
    "https://raw.githubusercontent.com/ryanehinkle/8bit-football/main/data/depthcharts.json?rev="+stamp,
    "./data/depthcharts.json?rev="+stamp
  ];
  for(const url of urls){
    try{
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok)continue;
      const json=await response.json();
      if(json&&json.teams&&Object.keys(json.teams).length){
        snapshot=json;
        return;
      }
    }catch(error){/* Fall back to the site copy, then the live ESPN roster. */}
  }
  snapshot=null;
}

async function loadTeam(options){
  options=options||{};
  const id=++requestId,t=selected();
  const saved=snapshot&&snapshot.teams&&snapshot.teams[t.id];
  const cached=cachedTeam(t.slug);
  let freshRoster=null, newestDepth=null;
  const initial=validTeamData(saved)&&saved.kind==="depth"?saved:
    validTeamData(cached)?cached:validTeamData(saved)?saved:null;
  if(initial){
    useTeamData(initial,id,t.slug);
    $("dataStatus").textContent+=" · CHECKING LIVE...";
  }else{
    teamData=null;$("count").innerHTML="--<small>PLAYERS</small>";
    $("dataStatus").textContent="LOADING LIVE ROSTER...";
    $("positions").innerHTML='<div class="message"><span class="football">◆</span>LOADING ROSTER...</div>';
  }
  // ESPN allows browser CORS for its roster, but usually blocks direct depth-chart reads.
  // Start both immediately; use roster as soon as it responds, then upgrade if depth responds.
  const base="https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/"+t.id;
  const liveDepth=fetch(base+"/depthcharts?refresh="+Date.now(),{cache:"no-store"})
    .then(function(response){if(!response.ok)throw Error("depth HTTP "+response.status);return response.json();})
    .then(function(payload){
      if(id!==requestId)return;
      const depth=parseLiveDepthChart(payload,freshRoster);
      if(depth){
        newestDepth=depth;
        storeTeam(t.slug,depth);useTeamData(depth,id,t.slug);
      }
    }).catch(function(){/* No browser CORS for many depth-chart responses; snapshot/roster stays visible. */});
  try{
    const response=await fetch(base+"/roster?refresh="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw Error("roster HTTP "+response.status);
    const payload=await response.json();
    if(id!==requestId)return;
    freshRoster=rosterFallback(payload);
    if(!validTeamData(freshRoster))throw Error("Empty roster");
    const chart=newestDepth?overlayRoster(newestDepth,freshRoster):
      validTeamData(saved)&&saved.kind==="depth"?overlayRoster(saved,freshRoster):null;
    const chosen=chart||addSleeperDepth(freshRoster,t);
    chosen.live=true;chosen.lastRosterCheck=new Date().toISOString();
    storeTeam(t.slug,chosen);useTeamData(chosen,id,t.slug);
  }catch(error){
    if(id!==requestId)return;
    if(!teamData){
      $("dataStatus").textContent="ROSTER UNAVAILABLE";
      $("positions").innerHTML='<div class="message">COULD NOT LOAD THIS TEAM.<br>CHECK YOUR CONNECTION.<button type="button" id="retry" class="retry">RETRY ↻</button></div>';
    }else{
      $("dataStatus").textContent+=" · OFFLINE / CACHED";
    }
  }
  await liveDepth;
  if(id===requestId && teamData && teamData.kind!=="depth"){
    // Enrich the already-visible ESPN roster without delaying first paint.
    const index=await loadSleeper();
    if(index && id===requestId && activeTeam===t.slug){
      const enriched=addSleeperDepth(teamData,t);
      if(enriched!==teamData){
        storeTeam(t.slug,enriched);
        useTeamData(enriched,id,t.slug);
      }
    }
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
  $("dataStatus").textContent=(teamData.kind==="depth"?"ESPN DEPTH CHART":teamData.kind==="partial"?"SLEEPER DEPTH · ESPN ROSTER":"ESPN ROSTER · ORDER UNVERIFIED")+
    (teamData.updatedAt?" · "+dateText(teamData.updatedAt):"")+(teamData.live?" · LIVE CHECKED":" · CACHED");
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
        '<span class="player-detail"><span class="player-name">'+escapeHTML(p.name||"Unknown player")+'</span><span class="player-meta">'+escapeHTML(code)+(p.rank===1&&(teamData.kind==="depth"||teamData.kind==="partial")?" · STARTER":"")+'</span></span>'+
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
$("reload").addEventListener("click",async function(){await readSnapshot();loadTeam({force:true});});
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
  saveURL(true);renderTeam();loadTeam();await readSnapshot();
  if(snapshot&&snapshot.teams&&snapshot.teams[selected().id])loadTeam();
})();
setInterval(function(){if(document.visibilityState==="visible")loadTeam();},120000);
setInterval(async function(){if(document.visibilityState!=="visible")return;await readSnapshot();if(snapshot&&snapshot.teams&&snapshot.teams[selected().id])loadTeam();},300000);
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")loadTeam();});
