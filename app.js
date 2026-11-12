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
let activeTeam="chi",unit="offense",teamData=null,opened=null,requestId=0;

function escapeHTML(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function foreground(hex){
  let s=hex.replace("#",""),rgb=[0,2,4].map(function(i){return parseInt(s.slice(i,i+2),16)/255;}).map(function(v){return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.38?"#071422":"#ffffff";
}
function selected(){return BY_SLUG[activeTeam];}

function helmet(t){
  const main=escapeHTML(t.primary),trim=escapeHTML(t.secondary);
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
    '</svg></span>';
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


/* Active 53-man rosters are separate from Practice Squad, IR and other reserves. */
const RESERVE_KEYS=["practice","ir","other"];
function cleanStatus(value){
  if(!value)return "";
  if(typeof value==="object")return String(value.name||value.displayName||value.type||value.abbreviation||"").trim();
  return String(value).trim();
}
function classifyStatus(raw,group){
  const pieces=[
    raw.rosterStatus,raw.roster_status,raw.status,
    raw.designation,raw.rosterDesignation,
    group && (group.position||group.name||group.displayName)
  ].map(cleanStatus).filter(Boolean).join(" ").toLowerCase();
  if(/\bpractice[\s-]*squad\b|\bpractice[\s-]*team\b|\bpractice[\s-]*roster\b|\bps\b/.test(pieces))return "practice";
  if(/\binjured reserve\b|\breserve\/injured\b|\binjured\/\d+\b|\binjured\/ir\b|\bir\b|\bir-r\b|\bir-nfi\b/.test(pieces))return "ir";
  if(/\bpup\b|\bphysically unable\b|\bnon.football\b|\bnfi\b|\bsuspend(ed|sion)?\b|\breserve\/\b/.test(pieces))return "other";
  return "active";
}
function normalizeRosterPlayer(p,code){
  const pos=p.position||{},es=p.status||{};
  return {
    id:String(p.id||""),name:p.displayName||p.fullName||p.name||"",
    number:String(p.jersey==null?(p.number==null?"":p.number):p.jersey),position:code||String(pos.abbreviation||"").toUpperCase(),
    rank:null,experience:p.experience&&p.experience.years,college:p.college&&p.college.name,
    height:p.displayHeight||"",weight:p.displayWeight||"",
    status:cleanStatus(es),rosterStatus:cleanStatus(p.rosterStatus||p.roster_status||es)
  };
}
function makeGroupMap(){return {offense:new Map(),defense:new Map(),special:new Map()};}
function sortGroups(map){
  return Array.from(map.values()).sort(function(a,b){
    const ai=ORDER.indexOf(a.code),bi=ORDER.indexOf(b.code);
    return (ai<0?99:ai)-(bi<0?99:bi)||a.code.localeCompare(b.code);
  });
}
function addActive(maps,p){
  const code=String(p.position||"").toUpperCase();
  const cat=SPECIAL.has(code)?"special":OFFENSE.has(code)?"offense":"defense";
  const m=maps[cat];
  if(!m.has(code))m.set(code,{code:code||"OTHER",label:LABELS[code]||code||"OTHER",players:[]});
  m.get(code).players.push(p);
}
function rosterFallback(response){
  const out={kind:"roster",updatedAt:new Date().toISOString(),offense:[],defense:[],special:[],
    reserve:{practice:[],ir:[],other:[]},source:"ESPN"};
  const maps=makeGroupMap(),members=new Map();
  const sections=Array.isArray(response&&response.athletes)?response.athletes:[];
  sections.forEach(function(section){
    const items=Array.isArray(section.items)?section.items:[section];
    items.forEach(function(raw){
      if(!raw||!(raw.displayName||raw.fullName||raw.name))return;
      const key=String(raw.id||raw.fullName||raw.displayName).toLowerCase();
      const pos=raw.position||{};
      const code=String(pos.abbreviation||section.abbreviation||"").toUpperCase();
      const p=normalizeRosterPlayer(raw,code);
      const membership=classifyStatus(raw,section);
      p.membership=membership;
      const previous=members.get(key);
      // Explicit reserve designation wins if ESPN lists a player twice.
      if(!previous||previous.membership==="active"&&membership!=="active"){
        members.set(key,p);
      }
    });
  });
  members.forEach(function(p){
    if(p.membership==="active")addActive(maps,p);
    else out.reserve[p.membership].push(p);
  });
  UNITS.forEach(function(cat){out[cat]=sortGroups(maps[cat]);});
  return out;
}


function parseLiveDepthChart(payload){
  if(!payload||!Array.isArray(payload.depthCharts))return null;
  const mapById=new Map(),mapByName=new Map();
  payload.depthCharts.forEach(function(section){
    const positions=section.positions||{};
    Object.keys(positions).forEach(function(key){
      const pos=positions[key];if(!pos||!Array.isArray(pos.athletes))return;
      const code=String((pos.position||{}).abbreviation||key).toUpperCase();
      pos.athletes.forEach(function(entry,index){
        const athlete=entry.athlete||entry;
        if(!athlete)return;
        const rank=Number(entry.rank||index+1);
        if(!Number.isFinite(rank))return;
        const info={rank,code};
        if(athlete.id)mapById.set(String(athlete.id),info);
        const name=String(athlete.displayName||athlete.fullName||"").toLowerCase().replace(/[^a-z0-9]/g,"");
        if(name)mapByName.set(name,info);
      });
    });
  });
  return mapById.size||mapByName.size?{byId:mapById,byName:mapByName}:null;
}
function applyLiveDepth(roster,depth){
  if(!roster||!depth)return roster;
  let ranked=0;
  const result=Object.assign({},roster);
  UNITS.forEach(function(cat){
    result[cat]=(roster[cat]||[]).map(function(group){
      const players=(group.players||[]).map(function(player){
        const key=String(player.name||"").toLowerCase().replace(/[^a-z0-9]/g,"");
        const match=depth.byId.get(String(player.id||""))||depth.byName.get(key);
        if(!match)return player;
        ranked++;
        return Object.assign({},player,{rank:match.rank});
      });
      players.sort(comparePlayers);
      return Object.assign({},group,{players});
    });
  });
  if(ranked){result.kind="depth";result.depthSource="ESPN";}
  return result;
}
function comparePlayers(a,b){
  if(a.rank!=null&&b.rank==null)return -1;
  if(a.rank==null&&b.rank!=null)return 1;
  return (a.rank==null?0:a.rank)-(b.rank==null?0:b.rank)||
    String(a.name||"").localeCompare(String(b.name||""));
}


/* The browser-safe Sleeper player index supplies independently reported depth
   order and membership. Fetched at most once per day, never per team switch. */
let sleeperIndex=null,sleeperRequest=null,sleeperUpdatedAt=null,sleeperLoadedAt=0;
const SLEEPER_CODES={wsh:["WAS","WSH"],jax:["JAX","JAC"],lar:["LAR","LA"],
  lv:["LV","OAK"],lac:["LAC","SD"]};
function normName(value){
  return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]/g,"");
}

function sleeperMembership(raw){
  // Sleeper uses two separate concepts: real roster membership (status)
  // and game availability (injury_status). OUT != NFL injured reserve.
  const state=String(raw.status||"")+" "+String(raw.roster_status||"");
  const injury=String(raw.injury_status||"");
  if(/\bpractice[\s-]*squad\b|\bpractice[\s-]*team\b|\bPS\b/i.test(state))return "practice";
  if(/\binjured[\s/-]*reserve\b|\breserve\/injured\b|\bIR\b/i.test(state)||
     /^IR$/i.test(injury))return "ir";
  if(/\bPUP\b|\bNFI\b|\bsuspend/i.test(state)||/^(PUP|NFI|Sus)$/i.test(injury))return "other";
  return "active";
}
function slimInjury(raw){
  const status=String(raw.injury_status||"").trim(),low=status.toLowerCase();
  let code="";
  if(/^(q|questionable|gtd|game.time.decision)$/.test(low))code="q";
  else if(/^(d|doubtful)$/.test(low))code="d";
  else if(/^(o|out)$/.test(low))code="out";
  else if(/^(ir|injured.reserve)$/.test(low))code="ir";
  else if(/^(pup|nfi)$/.test(low))code="pup";
  else if(/^(probable)$/.test(low))code="probable";
  if(!code)return null;
  const rawReason=String(raw.injury_body_part||raw.injury_notes||"").trim();
  const reason=rawReason.length>66?rawReason.slice(0,63).trim()+"…":rawReason;
  const stamp=Number(raw.news_updated);
  const at=Number.isFinite(stamp)&&stamp>1500000000000?
    new Date(stamp).toISOString():raw.injury_start_date||null;
  return {code,status:code==="q"?"Questionable":code==="d"?"Doubtful":
     code==="out"?"Out":code==="ir"?"IR":code==="pup"?"PUP":"Probable",
     reason,at,source:"Sleeper",sleeperId:String(raw.player_id||"")};
}
function slimSleeper(p,sleeperId){
  const rank=Number(p.depth_chart_order==null?p.depth_chart_position:p.depth_chart_order);
  const pos=String(p.position||"").toUpperCase();
  const name=String(p.full_name||[p.first_name,p.last_name].filter(Boolean).join(" ")).trim();
  if(!name||!pos||pos==="DEF"||pos==="DST"||pos==="HC")return null;
  const membership=sleeperMembership(p);
  return {
    id:String(p.espn_id||""),sleeperId:String(sleeperId||""),name,
    number:p.number==null?"":String(p.number),position:pos,
    rank:Number.isInteger(rank)&&rank>0&&rank<99?rank:null,
    experience:p.years_exp==null?null:p.years_exp,
    college:p.college||"",height:p.height||"",weight:p.weight||"",
    status:String(p.status||""),membership,injury:slimInjury(Object.assign({},p,{player_id:sleeperId})),
    injuryStatus:p.injury_status||"",injuryStart:p.injury_start_date||null,
    newsUpdated:Number(p.news_updated)||0
  };
}

async function loadSleeper(){
  if(sleeperIndex&&Date.now()-sleeperLoadedAt<23.5*3600000)return sleeperIndex;
  if(sleeperRequest)return sleeperRequest;
  sleeperIndex=null;
  sleeperRequest=(async function(){
    try{
      const cached=JSON.parse(localStorage.getItem("8bit-players-v5")||"null");
      if(cached&&cached.data&&cached.saved&&Date.now()-cached.saved<24*3600*1000){
        sleeperIndex=cached.data;sleeperLoadedAt=cached.saved;
        sleeperUpdatedAt=new Date(cached.saved).toISOString();
        return sleeperIndex;
      }
    }catch(error){}
    try{
      // Sleeper recommends this large endpoint be requested at most daily.
      const resp=await fetch("https://api.sleeper.app/v1/players/nfl",{cache:"default"});
      if(!resp.ok)throw Error("Sleeper "+resp.status);
      const all=await resp.json(),teams={};
      Object.entries(all).forEach(function(entry){
        const sleeperId=entry[0],raw=entry[1];
        if(!raw||!raw.team)return;
        const p=slimSleeper(raw,sleeperId);
        // IR and practice squad may be marked inactive in fantasy feeds.
        if(!p||(raw.active===false&&p.membership==="active"))return;
        const code=String(raw.team).toUpperCase();
        if(!teams[code])teams[code]=[];
        teams[code].push(p);
      });
      if(Object.keys(teams).length<30)throw Error("incomplete Sleeper data");
      sleeperIndex=teams;sleeperLoadedAt=Date.now();
      sleeperUpdatedAt=new Date().toISOString();
      try{localStorage.setItem("8bit-players-v5",JSON.stringify({
        saved:Date.now(),data:teams
      }));}catch(error){}
      return sleeperIndex;
    }catch(error){
      sleeperRequest=null;
      return null;
    }
  })().finally(function(){sleeperRequest=null;});
  return sleeperRequest;
}
function sleeperPlayers(t){
  if(!sleeperIndex)return [];
  const codes=SLEEPER_CODES[t.slug]||[t.slug.toUpperCase()];
  const seen=new Set(),items=[];
  codes.forEach(function(code){
    (sleeperIndex[code]||[]).forEach(function(p){
      const id=p.id||normName(p.name);
      if(seen.has(id))return;
      seen.add(id);items.push(p);
    });
  });
  return items;
}
function sleeperTeamRoster(t){
  const members=sleeperPlayers(t);if(!members.length)return null;
  const out={kind:"partial",source:"Sleeper",depthSource:"Sleeper",
    updatedAt:sleeperUpdatedAt,offense:[],defense:[],special:[],
    reserve:{practice:[],ir:[],other:[]}};
  const maps=makeGroupMap();
  members.forEach(function(p){
    const player=Object.assign({},p);
    if(player.membership==="active")addActive(maps,player);
    else if(out.reserve[player.membership])out.reserve[player.membership].push(player);
  });
  UNITS.forEach(function(cat){
    out[cat]=sortGroups(maps[cat]);
    out[cat].forEach(function(group){group.players.sort(comparePlayers);});
  });
  return out;
}
function addSleeperDepth(roster,t){
  if(!roster||!sleeperIndex)return roster;
  const data=sleeperPlayers(t);
  if(!data.length)return roster;
  const byId=new Map(),byName=new Map();
  data.forEach(p=>{if(p.id)byId.set(String(p.id),p);byName.set(normName(p.name),p);});
  let ranked=0;
  const result=Object.assign({},roster);
  const reserve={practice:[],ir:[],other:[]};
  const seen=new Set();
  const playerKey=p=>p.id?"e:"+p.id:p.sleeperId?"s:"+p.sleeperId:"n:"+normName(p.name);
  function insertReserve(p,membership){
    const key=playerKey(p);
    if(seen.has(key)||RESERVE_KEYS.some(k=>reserve[k].some(x=>
      x.id&&p.id&&String(x.id)===String(p.id)||normName(x.name)===normName(p.name))))return;
    seen.add(key);
    const player=Object.assign({},p,{membership});
    reserve[membership].push(player);
  }
  ["practice","ir","other"].forEach(k=>
    (roster.reserve&&roster.reserve[k]||[]).forEach(p=>insertReserve(p,k)));
  UNITS.forEach(cat=>{
    result[cat]=(roster[cat]||[]).map(group=>{
      const players=[];
      (group.players||[]).forEach(player=>{
        const match=byId.get(String(player.id||""))||byName.get(normName(player.name));
        let updated=Object.assign({},player);
        if(match){
          if(match.rank!=null)ranked++;
          updated=Object.assign(updated,{
            rank:match.rank,sleeperId:match.sleeperId,
            number:updated.number||match.number||"",
            college:updated.college||match.college||"",
            experience:updated.experience==null?match.experience:updated.experience,
            height:updated.height||match.height,weight:updated.weight||match.weight,
            injury:match.injury||updated.injury||null
          });
          if(match.membership!=="active"){
            insertReserve(updated,match.membership);
            return;
          }
        }
        players.push(updated);
      });
      players.sort(comparePlayers);
      return Object.assign({},group,{players});
    }).filter(g=>g.players.length);
  });
  // ESPN's roster endpoint often has only the active 53; merge *all* known
  // reserve names from Sleeper instead of adding reserves only when empty.
  data.forEach(p=>{
    if(p.membership==="active")return;
    // Prefer details from ESPN's existing reserves when the player matches.
    const base=(roster.reserve&&RESERVE_KEYS.flatMap(k=>roster.reserve[k]||[])||[])
      .find(x=>x.id&&p.id&&String(x.id)===String(p.id)||normName(x.name)===normName(p.name));
    insertReserve(Object.assign({},p,base||{},{
      sleeperId:p.sleeperId,
      injury:p.injury||base&&base.injury||null
    }),p.membership);
  });
  // Enrich ESPN reserve entries with fantasy injury details, even when ESPN
  // already listed the player and no new reserve row was inserted.
  RESERVE_KEYS.forEach(k=>reserve[k].forEach(p=>{
    const m=byId.get(String(p.id||""))||byName.get(normName(p.name));
    if(m){
      p.sleeperId=p.sleeperId||m.sleeperId;
      p.number=p.number||m.number;
      p.injury=m.injury||p.injury||null;
    }
  }));
  result.reserve=reserve;
  result.reserveVerifiedAt=sleeperUpdatedAt;
  if(ranked){result.kind="partial";result.depthSource="Sleeper";}
  return result;
}


function activeCount(roster){
  const seen=new Set();
  UNITS.forEach(function(cat){
    (roster[cat]||[]).forEach(function(g){
      (g.players||[]).forEach(function(p){seen.add(String(p.id||normName(p.name)));});
    });
  });
  return seen.size;
}
function validTeamData(data){return data&&activeCount(data)>0;}
function cachedTeam(slug){
  try{
    const value=JSON.parse(localStorage.getItem("8bit-roster-v4:"+slug)||"null");
    return validTeamData(value)&&Date.now()-new Date(value.updatedAt).getTime()<24*3600*1000?value:null;
  }catch(error){return null;}
}
function storeTeam(slug,value){
  if(!value||!value.reserve)return;
  try{localStorage.setItem("8bit-roster-v4:"+slug,JSON.stringify(value));}catch(error){}
}
function useTeamData(data,req,slug){
  if(req!==requestId||slug!==activeTeam||!validTeamData(data))return;
  teamData=data;renderPositions();
}
async function loadTeam(force){
  const req=++requestId,t=selected();
  const cached=cachedTeam(t.slug);
  const initial=validTeamData(cached)?cached:null;
  let espnRoster=null,espnDepth=null,haveSleeper=!!sleeperIndex;
  let baseline=null,oline=null,injuries=null,injuryFetchFailed=false;
  const extraData=window.EightBitData||null;
  if(extraData&&extraData.lastKnown)injuries=extraData.lastKnown(t);
  if(initial)useTeamData(initial,req,t.slug);
  else{
    teamData=null;
    $("count").innerHTML="--<small>ACTIVE / 53</small>";
    $("dataStatus").textContent="LOADING LIVE ROSTER...";
    $("positions").innerHTML='<div class="message"><span class="football">◆</span>LOADING LINEUP...</div>';
    $("reserveArea").innerHTML="";
  }
  function present(){
    if(req!==requestId)return;
    let current=null;
    if(espnRoster){
      // Live ESPN roster = membership. Depth data never reclassifies injured players.
      current=haveSleeper?addSleeperDepth(espnRoster,t):espnRoster;
    }else if(haveSleeper)current=sleeperTeamRoster(t);
    else current=initial;
    if(!validTeamData(current))return;
    if(injuryFetchFailed&&!injuries){
      current=Object.assign({},current,{injuryUnavailable:true});
    }
    // The chronological baseline outranks ephemeral player-side depth orders;
    // a questionable/out designation never demotes or promotes a roster player.
    if(extraData){
      if(injuries)current=extraData.applyInjuries(current,injuries);
      if(espnDepth)current=applyLiveDepth(current,espnDepth);
      if(baseline)current=extraData.applySkill(current,baseline);
      if(oline)current=extraData.applyOL(current,oline);
    }else if(espnDepth)current=applyLiveDepth(current,espnDepth);
    useTeamData(current,req,t.slug);
    if(espnRoster||haveSleeper)storeTeam(t.slug,current);
  }
  const base="https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/"+t.id;
  const requests=[];
  requests.push((async function(){
    try{
      const response=await fetch(base+"/roster",{cache:"no-store"});
      if(!response.ok)throw Error("ESPN HTTP "+response.status);
      const normalized=rosterFallback(await response.json());
      if(req!==requestId)return;
      if(!validTeamData(normalized))throw Error("ESPN roster empty");
      espnRoster=normalized;espnRoster.live=true;present();
    }catch(error){/* Sleeper / saved roster stays visible. */}
  })());
  requests.push((async function(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
    try{
      const response=await fetch(base+"/depthcharts",{cache:"no-store",signal:controller.signal});
      if(!response.ok)throw Error("depth HTTP "+response.status);
      const result=parseLiveDepthChart(await response.json());
      if(req===requestId&&result){espnDepth=result;present();}
    }catch(error){}finally{clearTimeout(timer);}
  })());
  requests.push(loadSleeper().then(function(index){
    if(req!==requestId)return;
    haveSleeper=!!index;
    if(haveSleeper&&extraData&&extraData.ingestSleeper){
      const history=extraData.ingestSleeper(t,sleeperPlayers(t));
      if(history&&history.length)injuries=Object.assign({},injuries||{},{
        rows:history,
        teamId:String(t.id),team:(SLEEPER_CODES[t.slug]||[t.slug.toUpperCase()])[0],
        checkedAt:injuries&&injuries.checkedAt||null,
        source:injuries&&injuries.source||"Last known",
        verified:injuries&&injuries.verified||false,
        historyOnly:!(injuries&&injuries.verified)
      });
    }
    present();
  }).catch(function(){}));
  if(extraData){
    requests.push(extraData.getBaseline(t).then(function(data){
      if(req===requestId&&data){baseline=data;present();}
    }).catch(function(){}));
    // Positional line data is fetched separately and cached on-device.
    if(unit==="offense")requests.push(extraData.getOL(t).then(function(data){
      if(req===requestId&&data){oline=data;present();}
    }).catch(function(){}));
    requests.push(extraData.loadInjuries(t,!!force).then(function(report){
      if(req!==requestId)return;
      if(report){injuries=report;injuryFetchFailed=false;}
      else injuryFetchFailed=true;
      present();
    }).catch(function(){
      if(req===requestId){injuryFetchFailed=true;present();}
    }));
  }
  await Promise.allSettled(requests);
  if(req!==requestId)return;
  if(!teamData){
    $("dataStatus").textContent="NO ROSTER AVAILABLE";
    $("positions").innerHTML='<div class="message">COULD NOT LOAD LIVE ROSTERS.<br>CHECK YOUR CONNECTION.<button type="button" id="retry" class="retry">RETRY ↻</button></div>';
    $("reserveArea").innerHTML="";
  }
}
function dateText(iso){
  if(!iso)return "";
  const d=new Date(iso);
  return isNaN(d.getTime())?"":d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
}
function extra(p,g){
  const bits=[];
  if(p.injury)bits.push("LATEST INJURY <b>"+escapeHTML(p.injury.status)+(p.injury.reason?" · "+escapeHTML(p.injury.reason):"")+"</b>"+(p.injury.at?" · "+escapeHTML(dateText(p.injury.at)):""));
  if(p.injury&&p.injury.source)bits.push("REPORT SOURCE <b>"+escapeHTML(p.injury.source)+"</b>");
  if(p.injury&&p.injury.url&&/^https:\/\//.test(p.injury.url))
    bits.push('<a href="'+escapeHTML(p.injury.url)+'" target="_blank" rel="noopener noreferrer">OFFICIAL REPORT ↗</a>');
  if(p.position||g.code)bits.push("POS <b>"+escapeHTML(p.position||g.code)+"</b>");
  if(p.experience!=null)bits.push("EXP <b>"+escapeHTML(p.experience)+" YR</b>");
  if(p.height)bits.push("HT <b>"+escapeHTML(p.height)+"</b>");
  if(p.weight)bits.push("WT <b>"+escapeHTML(p.weight)+"</b>");
  if(p.college)bits.push("COLLEGE <b>"+escapeHTML(p.college)+"</b>");
  if(p.status&&p.status.toLowerCase()!=="active")bits.push("STATUS <b>"+escapeHTML(p.status)+"</b>");
  if(/^\d+$/.test(String(p.id||"")))bits.push('<a href="https://www.espn.com/nfl/player/_/id/'+escapeHTML(p.id)+'" target="_blank" rel="noopener noreferrer">PLAYER PROFILE ↗</a>');
  return bits.map(function(x){return "<div>"+x+"</div>";}).join("");
}

function injuryHTML(p){
  if(!p.injury||!p.injury.status)return "";
  const label=p.injury.status+(p.injury.reason?" · "+p.injury.reason:"");
  const stamp=p.injury.at?dateText(p.injury.at):"";
  return '<span class="player-injury injury-'+escapeHTML(p.injury.code)+'">'+
    '<span class="injury-dot" aria-hidden="true"></span>'+
    escapeHTML(label)+(stamp?'<span class="injury-stamp">'+escapeHTML(stamp)+'</span>':"")+'</span>';
}
function starterTag(p,code){
  // Use source-defined lineup status; WR has three listed starters.
  if(p.starter===true)return " · STARTER";
  if(p.starter===false)return "";
  if(p.depthSource==="NFLVERSE")return "";
  if(p.rank===1&&(["QB","RB","TE","K","P","LS","LT","LG","C","RG","RT"].includes(code)))return " · STARTER";
  if(p.rank!=null&&code==="WR"&&p.rank<=3)return " · STARTER";
  if(p.rank!=null&&(["CB","DE","DT","S","FS","SS","EDGE","OLB","ILB"].includes(code))&&p.rank<=2)return " · STARTER";
  if(p.rank!=null&&code==="LB"&&p.rank<=3)return " · STARTER";
  if(p.rank!=null&&["NT","MLB"].includes(code)&&p.rank===1)return " · STARTER";
  return "";
}

function renderReserves(){
  const area=$("reserveArea");if(!area||!teamData)return;
  const reserve=teamData.reserve||{};
  const sections=[
    ["practice","PRACTICE SQUAD","PS"],
    ["ir","INJURED RESERVE","IR"],
    ["other","OTHER RESERVE","RS"]
  ];
  let html='<div class="reserve-heading"><div class="eyebrow">OFF THE ACTIVE ROSTER</div><h2>RESERVE LISTS</h2></div>';
  let shown=0;
  sections.forEach(function(entry){
    const key=entry[0],name=entry[1],tag=entry[2];
    const players=Array.isArray(reserve[key])?reserve[key]:[];
    if(key==="other"&&!players.length)return;
    shown++;
    const sorted=players.slice().sort(function(p,q){
      const i=ORDER.indexOf(p.position),j=ORDER.indexOf(q.position);
      return (i<0?99:i)-(j<0?99:j)||p.name.localeCompare(q.name);
    });
    html+='<details class="reserve-card"'+(key==="ir"&&sorted.length?' open':'')+'><summary><span class="reserve-badge">'+tag+'</span>'+
      '<span class="reserve-label">'+name+'</span><span class="reserve-count">'+sorted.length+'</span>'+
      '<span class="reserve-arrow">▼</span></summary><div class="reserve-players">';
    if(!sorted.length)html+='<div class="reserve-empty">'+
      (teamData.reserveVerifiedAt||(key==="ir"&&teamData.injuryVerified)?'NONE REPORTED':'LIST NOT VERIFIED YET')+'</div>';
    sorted.forEach(function(p){
      html+='<div class="reserve-player"><span class="reserve-jersey">'+jersey(p,selected())+'</span>'+
        '<span class="reserve-player-name">'+escapeHTML(p.name)+injuryHTML(p)+'</span>'+
        '<span class="reserve-position">'+escapeHTML(p.position||"--")+'</span></div>';
    });
    html+='</div></details>';
  });
  area.innerHTML=html;
}
function renderPositions(){
  if(!teamData)return;
  const groups=Array.isArray(teamData[unit])?teamData[unit]:[],t=selected();
  const count=activeCount(teamData),inUnit=groups.reduce(function(n,g){return n+(g.players||[]).length;},0);
  $("count").innerHTML=String(count).padStart(2,"0")+'<small>ACTIVE / 53</small>';
  const depthLabel=teamData.depthSource==="nflverse"||teamData.lineSource==="nflverse"?"DEPTH: NFLVERSE":
    teamData.kind==="depth"?"DEPTH: ESPN":teamData.kind==="partial"?"DEPTH: SLEEPER":"DEPTH UNVERIFIED";
  const rosterLabel=teamData.source==="Sleeper"?"SLEEPER":"ESPN";
  const injuryText=teamData.injuryVerified&&teamData.injuryCheckedAt?
    " · INJURIES "+teamData.injurySource+" CHECKED "+
      new Date(teamData.injuryCheckedAt).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):
    teamData.injuryHistoryOnly?" · LAST REPORTED STATUS · LIVE FEED UNAVAILABLE":
    teamData.injuryUnavailable?" · LIVE INJURIES UNAVAILABLE":
      " · INJURIES: DAILY / PENDING";
  $("dataStatus").textContent=rosterLabel+" ROSTER · "+depthLabel+
    (teamData.depthAsOf||teamData.lineAsOf?" "+dateText(teamData.depthAsOf||teamData.lineAsOf):"")+
    injuryText;
  if(!inUnit){
    $("positions").innerHTML='<div class="message">NO ACTIVE PLAYERS LISTED.<br>TRY ANOTHER CATEGORY.</div>';
    renderReserves();return;
  }
  let html="";
  groups.forEach(function(group,gi){
    if(!group.players||!group.players.length)return;
    const code=String(group.code||"?").toUpperCase(),title=String(group.label||LABELS[code]||code).toUpperCase();
    html+='<details class="position" open><summary><span class="pos-badge">'+escapeHTML(code.slice(0,2))+'</span><span class="pos-label">'+escapeHTML(title)+'</span><span class="pos-qty">'+group.players.length+'</span><span class="caret">▼</span></summary><div class="player-list">';
    group.players.forEach(function(p,pi){
      const key=gi+":"+pi,expanded=opened===key;
      const rank=p.rank==null?"--":String(p.rank);
      html+='<div class="player'+(p.injury?" player-injury-"+escapeHTML(p.injury.code):"")+'"><button type="button" class="player-button" data-player="'+key+'" aria-expanded="'+expanded+'">'+
        '<span class="player-rank">'+escapeHTML(rank)+'</span><span class="jersey">'+jersey(p,t)+'</span>'+
        '<span class="player-detail"><span class="player-name">'+escapeHTML(p.name||"Unknown player")+'</span><span class="player-meta">'+escapeHTML(code)+starterTag(p,code)+'</span>'+injuryHTML(p)+'</span>'+
        '<span class="player-arrow">▶</span></button>';
      if(expanded)html+='<div class="extra">'+extra(p,group)+'</div>';
      html+='</div>';
    });
    html+='</div></details>';
  });
  $("positions").innerHTML=html;
  renderReserves();
}

$("prevTeam").addEventListener("click",function(){cycle(-1);});
$("nextTeam").addEventListener("click",function(){cycle(1);});
$("selectTeam").addEventListener("click",showPicker);
$("closePicker").addEventListener("click",hidePicker);
$("shade").addEventListener("click",hidePicker);
$("teamSearch").addEventListener("input",function(){drawChoices(this.value);});
$("teamGrid").addEventListener("click",function(e){const choice=e.target.closest("[data-team]");if(choice)setTeam(choice.dataset.team,true);});
document.querySelectorAll("[data-unit]").forEach(function(b){b.addEventListener("click",function(){setUnit(b.dataset.unit,true);});});
$("reload").addEventListener("click",function(){loadTeam(true);});
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
  saveURL(true);renderTeam();loadTeam();
})();
setInterval(function(){if(document.visibilityState==="visible")loadTeam();},120000);
setInterval(async function(){
  if(document.visibilityState!=="visible"||!teamData||!window.EightBitData)return;
  const req=requestId,t=selected();
  try{
    const report=await window.EightBitData.loadInjuries(t);
    if(req!==requestId)return;
    if(report){
      const next=window.EightBitData.applyInjuries(teamData,report);
      useTeamData(next,req,t.slug);
      storeTeam(t.slug,next);
    }
  }catch(error){}
},60000);
// Main roster refresh is direct from ESPN; no GitHub runner is required.
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")loadTeam();});
