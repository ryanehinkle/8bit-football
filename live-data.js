"use strict";
/* 8-Bit Football: layered ESPN availability, nflverse positional lineups.
   Live roster membership and availability never rewrite published depth order. */
(function(){
  const YEAR=new Date().getFullYear();
  const ROOT="https://raw.githubusercontent.com/antonwilms/sleeper-dashboard-data/main/nflverse/";
  const ESPN="https://site.api.espn.com/apis/site/v2/sports/football/nfl/";
  const OL=["LT","LG","C","RG","RT"];
  const SKILL=["QB","RB","WR","TE"];
  const SLUGS={wsh:["WAS","WSH"],jax:["JAX","JAC"],lar:["LAR","LA"],lv:["LV","OAK"],lac:["LAC","SD"]};
  const cache={depth:null,oline:null,leagueInjuries:null};
  const inflight={depth:null,oline:null,leagueInjuries:null};
  let injuryStamp=0;
  function teamCodes(t){return SLUGS[t.slug]||[t.slug.toUpperCase()];}
  function nameKey(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
  function memoryGet(key,ttl){
    try{
      const entry=JSON.parse(localStorage.getItem(key)||"null");
      return entry&&entry.saved&&Date.now()-entry.saved<ttl?entry.data:null;
    }catch(e){return null;}
  }
  function memoryPut(key,data){
    try{localStorage.setItem(key,JSON.stringify({saved:Date.now(),data}));}catch(e){}
  }
  async function fetchJSON(url){
    const resp=await fetch(url,{cache:"no-cache"});
    if(!resp.ok)throw Error("HTTP "+resp.status+" "+url);
    return resp.json();
  }
  function recent(date,maxAgeDays){
    const value=Date.parse(date||"");
    return Number.isFinite(value)&&value<=Date.now()+24*3600000&&Date.now()-value<=maxAgeDays*86400000;
  }
  async function depthIndex(){
    if(cache.depth)return cache.depth;
    if(inflight.depth)return inflight.depth;
    inflight.depth=(async function(){
      const key="8bit-nflverse-depth-history-"+YEAR;
      let slim=memoryGet(key,3*3600000);
      if(!slim){
        const full=await fetchJSON(ROOT+"depth/"+YEAR+".json");
        if(!full||!full.weeks)throw Error("Depth source missing weeks");
        const weeks=Object.keys(full.weeks).map(Number).filter(Number.isFinite).sort((a,b)=>b-a);
        slim={};
        for(const week of weeks){
          Object.entries(full.weeks[String(week)]||{}).forEach(([code,team])=>{
            const list=slim[code]||(slim[code]=[]);
            if(list.length>=6)return;
            const snapshot={week,dt:team.dt||team.date,positions:{}};
            for(const p of SKILL)snapshot.positions[p]=Array.isArray(team[p])?team[p]:[];
            list.push(snapshot);
          });
        }
        Object.entries(slim).forEach(([code,list])=>{
          slim[code]={
            week:list[0].week,dt:list[0].dt,positions:list[0].positions,history:list
          };
        });
        memoryPut(key,slim);
      }
      cache.depth=slim;return slim;
    })().catch(()=>null).finally(()=>{inflight.depth=null;});
    return inflight.depth;
  }

  async function lineIndex(){
    if(cache.oline)return cache.oline;
    if(inflight.oline)return inflight.oline;
    inflight.oline=(async function(){
      const key="8bit-nflverse-line-"+YEAR;
      let slim=memoryGet(key,12*3600000);
      if(!slim){
        const full=await fetchJSON(ROOT+"oline/"+YEAR+".json");
        if(!full||!full.teams)throw Error("OL source missing teams");
        slim={};
        Object.entries(full.teams).forEach(([code,team])=>{
          const states=Array.isArray(team.states)?team.states:[];
          if(!states.length)return;
          const last=states[states.length-1];
          slim[code]={dt:last.dt||last.date,ol:last.ol||[]};
        });
        memoryPut(key,slim);
      }
      cache.oline=slim;return slim;
    })().catch(()=>null).finally(()=>{inflight.oline=null;});
    return inflight.oline;
  }
  async function getBaseline(t){
    const index=await depthIndex();
    const item=teamCodes(t).map(code=>index&&index[code]).find(Boolean);
    return item&&recent(item.dt,21)?item:null;
  }
  async function getOL(t){
    const index=await lineIndex();
    const item=teamCodes(t).map(code=>index&&index[code]).find(Boolean);
    return item&&recent(item.dt,21)?item:null;
  }
  function clone(data){
    const output=Object.assign({},data);
    ["offense","defense","special"].forEach(cat=>{
      output[cat]=(data[cat]||[]).map(g=>Object.assign({},g,{
        players:(g.players||[]).map(p=>Object.assign({},p))
      }));
    });
    if(data.reserve){
      output.reserve={};
      ["practice","ir","other"].forEach(k=>{
        output.reserve[k]=(data.reserve[k]||[]).map(p=>Object.assign({},p));
      });
    }
    return output;
  }
  function byRank(a,b){
    if(a.rank==null)return b.rank==null?String(a.name).localeCompare(String(b.name)):1;
    if(b.rank==null)return -1;
    return a.rank-b.rank||String(a.name).localeCompare(String(b.name));
  }
  /* Apply a dated published skill-position baseline only to active players,
     matching NFLverse Sleeper IDs. Never close gaps after an injured player. */
  function applySkill(data,baseline){
    if(!data||!baseline)return data;
    const out=clone(data),posMap=baseline.positions||{};
    let matched=0;
    for(const group of out.offense){
      if(!SKILL.includes(group.code))continue;
      const ranks=posMap[group.code]||[];
      if(!ranks.length)continue;
      const history=(baseline.history||[baseline]).slice(0,6);
      group.players.forEach(player=>{
        const id=String(player.sleeperId||"");
        if(!id)return;
        const observations=history.map(snapshot=>{
          const list=(snapshot.positions||{})[group.code]||[];
          const ix=list.indexOf(id);
          return ix<0?null:ix+1;
        }).filter(rank=>rank!=null);
        if(!observations.length)return;
        // Do not mistake a one-week injury-related ranking fluctuation for a
        // permanent promotion/demotion. Use an established multiweek rank.
        const counts=new Map();
        observations.forEach(rank=>counts.set(rank,(counts.get(rank)||0)+1));
        let established=observations[0],best=0;
        for(const [rank,n] of counts){
          if(n>best||(n===best&&rank===observations[0])){established=rank;best=n;}
        }
        // A consecutive two-week change reflects a role change unless the
        // player is currently designated questionable, doubtful, or out.
        const listedOut=player.injury&&["q","d","out"].includes(player.injury.code);
        if(!listedOut&&observations.length>=2&&observations[0]===observations[1]){
          established=observations[0];
        }
        player.rank=established;
        player.depthSource="NFLVERSE";
        player.starter=established<=(group.code==="WR"?3:1);
        matched++;
      });
      group.players.sort(byRank);
    }
    if(matched){
      out.depthSource="nflverse";
      out.depthAsOf=baseline.dt;
      out.kind="depth";
    }
    return out;
  }
  function applyOL(data,line){
    if(!data||!line||!Array.isArray(line.ol))return data;
    const offense=data.offense||[];
    const olCodes=new Set(["LT","LG","C","RG","RT","OT","OG","T","G","OL","IOL"]);
    const pool=[];
    offense.forEach(g=>{
      if(olCodes.has(g.code))pool.push(...g.players);
    });
    if(!pool.length)return data;
    const byId=new Map(),byName=new Map();
    pool.forEach(p=>{
      if(p.id)byId.set(String(p.id),p);
      byName.set(nameKey(p.name),p);
    });
    const slotGroups=new Map(OL.map(code=>[code,{code,label:{
      LT:"LEFT TACKLE",LG:"LEFT GUARD",C:"CENTER",RG:"RIGHT GUARD",RT:"RIGHT TACKLE"
    }[code],players:[]}]));
    const assigned=new Set();
    let used=0;
    line.ol.forEach(entry=>{
      const slot=String(entry.slot||"").toUpperCase();
      if(!slotGroups.has(slot))return;
      const source=byId.get(String(entry.espnId||""))||byName.get(nameKey(entry.name));
      if(!source)return;
      const key=source.id||nameKey(source.name);
      const marker=slot+":"+key;
      if(assigned.has(marker))return;
      assigned.add(marker);
      const rank=Number(entry.rank);
      const player=Object.assign({},source,{
        position:slot,rank:Number.isInteger(rank)&&rank>0?rank:null,
        starter:rank===1,depthSource:"NFLVERSE"
      });
      slotGroups.get(slot).players.push(player);
      used++;
    });
    if(!used)return data;
    const out=clone(data);
    const matched=new Set([...slotGroups.values()].flatMap(g=>g.players.map(p=>p.id||nameKey(p.name))));
    const unmatched=pool.filter(p=>!matched.has(p.id||nameKey(p.name)));
    const result=[];
    out.offense.forEach(g=>{
      if(g.code==="QB"||g.code==="RB"||g.code==="FB"||g.code==="WR"||g.code==="TE")result.push(g);
    });
    for(const code of OL){
      const g=slotGroups.get(code);
      if(g.players.length){g.players.sort(byRank);result.push(g);}
    }
    if(unmatched.length)result.push({code:"OL",label:"OTHER OFFENSIVE LINEMEN",players:unmatched.map(p=>Object.assign({},p,{rank:null,starter:false}))});
    // Preserve all nonstandard offensive groups too, without inventing positions.
    out.offense.forEach(g=>{
      if(!olCodes.has(g.code)&&!["QB","RB","FB","WR","TE"].includes(g.code))result.push(g);
    });
    out.offense=result;
    out.lineAsOf=line.dt;
    out.lineSource="nflverse";
    if(out.kind!=="depth")out.kind="partial";
    return out;
  }

  // Injury statuses are game availability, not roster transactions. IR and
  // PUP are separate reserve classifications; a weekly OUT is not.
  const INJURY_TTL=100000, FAST_TTL=100000;
  let rapidReport=null,rapidStamp=0,rapidPromise=null;
  function str(x){
    if(x==null)return "";
    if(typeof x==="object")return String(x.displayName||x.description||x.name||x.abbreviation||x.text||"");
    return String(x);
  }
  function statusCode(value){
    const s=str(value).trim().toLowerCase();
    if(/^(q|questionable|game.time.decision|gtd)$/.test(s))return "q";
    if(/^(d|doubtful)$/.test(s))return "d";
    if(/^(out|o|inactive)$/.test(s))return "out";
    if(/^(ir|injured.reserve|reserve\/injured|injured\/reserve)$/.test(s))return "ir";
    if(/^(pup|nfi|physically.unable.to.perform)$/.test(s))return "pup";
    if(/^(dtd|day.to.day)$/.test(s))return "dtd";
    if(s==="probable")return "probable";
    if(/^(active|available|healthy|cleared)$/.test(s))return "active";
    return "";
  }
  function injuryTitle(code){
    return {q:"Questionable",d:"Doubtful",out:"Out",ir:"IR",pup:"PUP",
      dtd:"Day-to-Day",probable:"Probable",active:"Active"}[code]||"";
  }
  function shortReason(body,notes){
    let reason=str(body).trim();
    if(!reason)reason=str(notes).trim();
    if(/^(not specified|unknown|injury|n\/a|questionable|doubtful|out|healthy|active)$/i.test(reason))reason="";
    return reason.length>70?reason.slice(0,67).trim()+"…":reason;
  }
  function parseDate(raw){
    if(raw==null)return null;
    if(typeof raw==="number"||/^\d{13}$/.test(String(raw))){
      const d=new Date(Number(raw));
      return Number.isNaN(d.getTime())?null:d.toISOString();
    }
    const d=new Date(String(raw));
    return Number.isNaN(d.getTime())?null:d.toISOString();
  }
  function toInjury(entry){
    if(!entry||typeof entry!=="object")return null;
    const ath=entry.athlete||entry.player||{};
    const code=statusCode(entry.status||entry.injuryStatus||entry.availabilityStatus||
      entry.fantasyStatus||entry.statusType);
    if(!code)return null;
    const when=parseDate(entry.date||entry.updatedAt||entry.lastUpdated||
      entry.reportDate||entry.reportedAt||entry.timestamp);
    // Availability is last-known until a newer explicit status replaces it.
    // An old confirmed designation is not the same as "healthy".
    const detail=entry.type||entry.details||entry.injuryType||entry.injury||{};
    const reason=shortReason(entry.bodyLocation||entry.bodyPart||detail.description||
      detail.name||entry.location||detail,entry.detail||entry.comment||entry.shortComment);
    const name=str(ath.fullName||ath.displayName||ath.name||entry.name);
    const id=String(ath.id||entry.athleteId||entry.playerId||"");
    if(!id&&!name)return null;
    return {id,name,code,status:injuryTitle(code),reason,at:when,
      source:"ESPN",position:str((ath.position||{}).abbreviation||entry.positionAbbreviation||
        entry.position),number:String(ath.jersey||entry.jersey||""),
      teamId:"",team:""};
  }
  function teamInjuryRows(payload,team){
    if(!payload)return [];
    if(Array.isArray(payload))return payload.flatMap(v=>teamInjuryRows(v,team));
    const groups=Array.isArray(payload.injuries)?payload.injuries:[];
    if(!groups.length)return [];
    if(groups.some(v=>v&&v.team&&Array.isArray(v.injuries))){
      return groups.filter(g=>String((g.team||{}).id)===String(team.id)||
        teamCodes(team).includes(str((g.team||{}).abbreviation).toUpperCase()))
        .flatMap(g=>(g.injuries||[]).map(toInjury).filter(Boolean).map(row=>
          Object.assign(row,{teamId:String(team.id),team:teamCodes(team)[0]})));
    }
    return groups.map(toInjury).filter(Boolean).map(row=>
      Object.assign(row,{teamId:String(team.id),team:teamCodes(team)[0]}));
  }
  async function leagueReport(){
    if(cache.leagueInjuries&&Date.now()-injuryStamp<INJURY_TTL)return cache.leagueInjuries;
    if(inflight.leagueInjuries)return inflight.leagueInjuries;
    inflight.leagueInjuries=(async()=>{
      const raw=await fetchJSON(ESPN+"injuries");
      if(!raw||!Array.isArray(raw.injuries))throw Error("ESPN injuries feed unavailable");
      const data={};
      raw.injuries.forEach(group=>{
        const t=group.team||{};
        if(!t.id||!Array.isArray(group.injuries))return;
        const id=String(t.id);
        data[id]=(group.injuries||[]).map(toInjury).filter(Boolean).map(p=>
          Object.assign(p,{teamId:id,team:str(t.abbreviation).toUpperCase()}));
      });
      if(!Object.keys(data).length)throw Error("ESPN injuries feed empty");
      cache.leagueInjuries=data;injuryStamp=Date.now();return data;
    })().catch(()=>null).finally(()=>{inflight.leagueInjuries=null;});
    return inflight.leagueInjuries;
  }
  function toSleeperInjury(row,defaultId){
    if(!row||typeof row!=="object")return null;
    const nested=row.player&&typeof row.player==="object"?row.player:row;
    const status=nested.injury_status||row.injury_status||row.injuryStatus||
      nested.injuryStatus;
    const code=statusCode(status);
    if(!code)return null;
    const sleeperId=String(row.player_id||row.sleeper_id||row.sleeperId||defaultId||
      nested.player_id||nested.playerId||"");
    if(!sleeperId)return null;
    const reason=shortReason(nested.injury_body_part||row.body_part||row.injury_body_part||
      nested.injuryBodyPart,row.notes||nested.injury_notes||nested.injuryNotes);
    const date=parseDate(nested.news_updated||row.news_updated||row.updated_at||
      row.start_date||nested.injury_start_date);
    return {sleeperId,id:"",name:str(nested.full_name||
      [nested.first_name,nested.last_name].filter(Boolean).join(" ")),
      code,status:injuryTitle(code),reason,at:date,source:"Sleeper",
      team:str(nested.team||row.team).toUpperCase(),teamId:""};
  }
  function parseSleeperReport(payload){
    let records=[];
    if(Array.isArray(payload))records=payload.map(row=>toSleeperInjury(row));
    else if(payload&&typeof payload==="object"&&!payload.error){
      if(Array.isArray(payload.players))records=payload.players.map(row=>toSleeperInjury(row));
      else records=Object.entries(payload).map(([id,row])=>toSleeperInjury(row,id));
    }
    return records.filter(Boolean);
  }
  async function fastSleeper(){
    if(rapidReport&&Date.now()-rapidStamp<FAST_TTL)return rapidReport;
    if(rapidPromise)return rapidPromise;
    rapidPromise=(async()=>{
      let records=null;
      // A compact injury-only endpoint is attempted first. It is optional:
      // some Sleeper servers may not expose it.
      try{
        const data=await fetchJSON("https://api.sleeper.app/v1/players/injuries");
        const parsed=parseSleeperReport(data);
        if(parsed.length>=10)records=parsed;
      }catch(error){}
      if(!records){
        try{
          const state=await fetchJSON("https://api.sleeper.app/v1/state/nfl");
          const year=Number(state.season),week=Number(state.week||state.display_week);
          if(!Number.isInteger(year)||!Number.isInteger(week)||week<1||week>22)
            throw Error("invalid Sleeper week");
          // Smaller, more frequently updated than the 5 MB player index.
          const url="https://api.sleeper.app/projections/nfl/"+year+"/"+week+
            "?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K";
          const projections=await fetchJSON(url);
          const parsed=parseSleeperReport(projections);
          if(parsed.length>=10)records=parsed;
        }catch(error){}
      }
      if(!records)return null;
      rapidReport=records;rapidStamp=Date.now();return records;
    })().catch(()=>null).finally(()=>{rapidPromise=null;});
    return rapidPromise;
  }
  /*
   * A small verified bootstrap handles the gap between weekly game
   * reports and live fantasy APIs. It does NOT assert a new medical report;
   * at is the source publication date, verifiedAt is when the last official
   * designation was cross-checked. Newer published updates supersede it.
   */
  const OFFICIAL_LAST_KNOWN={
    "3":[
      {name:"Kyle Monangai",code:"q",status:"Questionable",reason:"Thumb/Toe",
        at:"2026-11-06T21:42:00Z",verifiedAt:"2026-11-11T20:00:00Z",
        source:"Chicago Bears",url:"https://www.chicagobears.com/news/kyle-monangai-back-at-practice-questionable-for-buccaneers-game-injury-update"},
      {name:"Tyrique Stevenson",code:"q",status:"Questionable",reason:"Thumb",
        at:"2026-11-06T21:42:00Z",verifiedAt:"2026-11-11T20:00:00Z",
        source:"Chicago Bears",url:"https://www.chicagobears.com/news/kyle-monangai-back-at-practice-questionable-for-buccaneers-game-injury-update"},
      {name:"Malik Muhammad",code:"q",status:"Questionable",reason:"Toe",
        at:"2026-11-06T21:42:00Z",verifiedAt:"2026-11-11T20:00:00Z",
        source:"Chicago Bears",url:"https://www.chicagobears.com/news/kyle-monangai-back-at-practice-questionable-for-buccaneers-game-injury-update"}
    ]
  };
  function recordDate(row){
    const at=Date.parse(row&&row.at||"")||0;
    const verified=Date.parse(row&&row.verifiedAt||"")||0;
    return Math.max(at,verified);
  }
  function recordIdentity(row){
    if(!row)return "";
    // Use player name for cross-source matching. ESPN and Sleeper identifiers
    // can coexist, but both APIs give different IDs to the same player.
    if(row.name)return "n:"+nameKey(row.name);
    if(row.id)return "e:"+row.id;
    if(row.sleeperId)return "s:"+row.sleeperId;
    return "";
  }
  function equivalentPlayer(a,b){
    if(!a||!b)return false;
    return !!(a.id&&b.id&&String(a.id)===String(b.id)||
      a.sleeperId&&b.sleeperId&&String(a.sleeperId)===String(b.sleeperId)||
      a.name&&b.name&&nameKey(a.name)===nameKey(b.name));
  }
  function chooseRecord(previous,candidate){
    if(!previous)return Object.assign({},candidate);
    const oldTime=recordDate(previous),newTime=Date.parse(candidate.at||"")||0;
    // Explicit publication time beats every older report; an undated
    // snapshot cannot silently erase a dated known designation.
    if(newTime>oldTime)return Object.assign({},candidate,{
      name:candidate.name||previous.name,
      id:candidate.id||previous.id||"",
      sleeperId:candidate.sleeperId||previous.sleeperId||"",
      reason:candidate.reason||(candidate.code===previous.code?previous.reason:"")||"",
      verifiedAt:candidate.verifiedAt||null,
      url:candidate.url||null
    });
    if(newTime&&newTime===oldTime){
      const ranks={"Chicago Bears":4,"NFL":4,"ESPN":3,"Sleeper":2};
      if((ranks[candidate.source]||0)>(ranks[previous.source]||0))
        return Object.assign({},previous,candidate);
    }
    if(!oldTime){
      // First time either source supplied a dated statement, take it.
      if(newTime)return Object.assign({},previous,candidate,{verifiedAt:null});
      if(previous.code!==candidate.code){
        const seen=Date.parse(previous.firstSeenAt||"")||0;
        const checked=Date.parse(candidate.firstSeenAt||"")||0;
        if(checked>seen)return Object.assign({},previous,candidate);
      }
    }
    // Missing later reports never erase a known status. Fill missing detail
    // only when the status itself agrees.
    if(previous.code===candidate.code){
      if(!previous.reason&&candidate.reason)previous.reason=candidate.reason;
      if(!previous.id&&candidate.id)previous.id=candidate.id;
      if(!previous.sleeperId&&candidate.sleeperId)previous.sleeperId=candidate.sleeperId;
    }
    return previous;
  }
  function historyKey(t){return "8bit-status-history-v3:"+t.id;}
  function getHistory(t){
    let saved=[];
    try{
      const data=JSON.parse(localStorage.getItem(historyKey(t))||"[]");
      if(Array.isArray(data))saved=data.filter(r=>r&&r.code);
    }catch(error){}
    const state=[];
    const seeds=OFFICIAL_LAST_KNOWN[String(t.id)]||[];
    for(const row of seeds.concat(saved)){
      const at=state.findIndex(existing=>equivalentPlayer(existing,row));
      if(at===-1)state.push(Object.assign({},row));
      else state[at]=chooseRecord(state[at],row);
    }
    return state;
  }
  function mergeHistory(t,rows,checkedAt){
    const state=getHistory(t);
    const stamp=checkedAt||new Date().toISOString();
    (rows||[]).forEach(original=>{
      if(!original||!original.code)return;
      const candidate=Object.assign({firstSeenAt:stamp},original);
      const at=state.findIndex(existing=>equivalentPlayer(existing,candidate));
      if(at===-1)state.push(candidate);
      else state[at]=chooseRecord(state[at],candidate);
    });
    try{localStorage.setItem(historyKey(t),JSON.stringify(state));}catch(error){}
    return state;
  }
  async function loadInjuries(t,force){
    const key="8bit-injuries-v3:"+t.id;
    if(force){
      cache.leagueInjuries=null;injuryStamp=0;
      rapidReport=null;rapidStamp=0;
    }
    if(!force){
      const cached=memoryGet(key,INJURY_TTL);
      if(cached){
        // Even a cached network report must merge in the durable latest
        // designation: the provider may omit someone between game weeks.
        cached.rows=mergeHistory(t,cached.rows||[],cached.checkedAt);
        return cached;
      }
    }
    const checkedAt=new Date().toISOString();
    const [espn,fast]=await Promise.all([leagueReport(),fastSleeper()]);
    const incoming=[...(espn&&espn[String(t.id)]||[])];
    if(fast){
      const codes=teamCodes(t);
      fast.forEach(p=>{
        if(!p.team||codes.includes(p.team))incoming.push(p);
      });
    }
    const verified=!!(espn||fast);
    const rows=mergeHistory(t,incoming,checkedAt);
    if(!verified&&!rows.length)return null;
    const report={rows,checkedAt:verified?checkedAt:null,
      source:verified?(espn&&fast?"ESPN + Sleeper":espn?"ESPN":"Sleeper"):"Last known",
      verified,teamId:String(t.id),team:teamCodes(t)[0],
      historyOnly:!verified};
    if(verified)memoryPut(key,report);
    return report;
  }

  function injuryMatch(row,p){
    return !!(row&&p&&(row.id&&p.id&&String(row.id)===String(p.id)||
      row.sleeperId&&p.sleeperId&&String(row.sleeperId)===String(p.sleeperId)||
      row.name&&p.name&&nameKey(row.name)===nameKey(p.name)));
  }
  function applyInjuries(data,report){
    if(!data||!report||!Array.isArray(report.rows))return data;
    const out=clone(data);
    const rows=report.rows.filter(Boolean);
    function latest(p){
      const matches=rows.filter(row=>injuryMatch(row,p));
      if(!matches.length)return null;
      matches.sort((a,b)=>{
        const ad=Date.parse(a.at||"")||
          (a.source==="ESPN"?Date.parse(report.checkedAt||""):0);
        const bd=Date.parse(b.at||"")||
          (b.source==="ESPN"?Date.parse(report.checkedAt||""):0);
        return bd-ad||Number(b.source==="ESPN")-Number(a.source==="ESPN");
      });
      return matches[0];
    }
    const found=new Set();
    const reserve=out.reserve||{practice:[],ir:[],other:[]};
    for(const key of ["practice","ir","other"])reserve[key]=reserve[key]||[];
    const reserveKey=p=>p.id?"e:"+p.id:p.sleeperId?"s:"+p.sleeperId:"n:"+nameKey(p.name);
    function exists(p){
      const key=reserveKey(p);
      return ["practice","ir","other"].some(k=>reserve[k].some(x=>reserveKey(x)===key||
        nameKey(x.name)===nameKey(p.name)));
    }
    for(const cat of ["offense","defense","special"]){
      out[cat]=out[cat].map(group=>{
        const players=[];
        for(const p of group.players){
          const row=latest(p);
          if(row)p.injury=row; // Keep Sleeper's own bulk status if live report has no entry.
          if(row&&(row.code==="ir"||row.code==="pup")){
            const place=row.code==="ir"?"ir":"other";
            if(!exists(p))reserve[place].push(Object.assign({},p,{membership:place}));
            found.add(reserveKey(p));continue;
          }
          players.push(p);
        }
        return Object.assign({},group,{players});
      }).filter(g=>g.players.length);
    }
    for(const category of ["practice","ir","other"]){
      reserve[category].forEach(p=>{const row=latest(p);if(row)p.injury=row;found.add(reserveKey(p));});
    }
    for(const row of rows){
      if(!["ir","pup"].includes(row.code)||!row.name)continue;
      // Only add absent players if this team is explicitly identified by
      // the live source, not from an ID-only league-wide fantasy record.
      if(row.teamId!==String(report.teamId)&&row.team!==report.team)continue;
      const candidate={id:row.id||"",sleeperId:row.sleeperId||"",name:row.name,
        number:row.number||"",position:row.position||"OTHER",injury:row,
        membership:row.code==="ir"?"ir":"other",rank:null};
      if(found.has(reserveKey(candidate))||exists(candidate))continue;
      reserve[candidate.membership].push(candidate);found.add(reserveKey(candidate));
    }
    out.reserve=reserve;
    out.injuryCheckedAt=report.checkedAt;
    out.injurySource=report.source;
    out.injuryVerified=report.verified;
    out.injuryHistoryOnly=!!report.historyOnly;
    return out;
  }

  function lastKnown(t){
    const rows=getHistory(t);
    if(!rows.length)return null;
    return {rows,checkedAt:null,source:"Last known",verified:false,
      historyOnly:true,teamId:String(t.id),team:teamCodes(t)[0]};
  }
  function ingestSleeper(t,players){
    const rows=(players||[]).filter(p=>p&&p.injury&&p.injury.code).map(p=>
      Object.assign({},p.injury,{id:p.id||"",sleeperId:p.sleeperId||"",
        name:p.name||"",source:"Sleeper"}));
    return mergeHistory(t,rows,new Date().toISOString());
  }
  window.EightBitData={
    getBaseline,getOL,applySkill,applyOL,loadInjuries,applyInjuries,lastKnown,ingestSleeper,
    __test:{toInjury,toSleeperInjury,parseSleeperReport,teamInjuryRows,teamCodes,byRank,mergeHistory,getHistory,chooseRecord,statusCode}
  };
})();