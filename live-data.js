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
    const resp=await fetch(url,{cache:"no-store"});
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
  function str(x){
    if(!x)return "";
    if(typeof x==="object")return String(x.displayName||x.description||x.name||x.abbreviation||"");
    return String(x);
  }
  function toInjury(entry){
    const ath=entry.athlete||entry.player||{},status=str(entry.status||entry.injuryStatus||entry.availabilityStatus);
    const text=status.toLowerCase();
    let code="";
    if(/\bquestionable\b|\bgame.time.decision\b|\bGTD\b/i.test(text))code="q";
    else if(/\bdoubtful\b/i.test(text))code="d";
    else if(/\bout\b|\binactive\b/i.test(text))code="out";
    else if(/\bday.to.day\b|\bDTD\b/i.test(text))code="dtd";
    else if(/\bprobable\b/i.test(text))code="probable";
    if(!code)return null;
    const when=entry.date||entry.updatedAt||entry.lastUpdated||entry.reportDate||entry.reportedAt||null;
    // Avoid carrying last week's game designation into a new matchup.
    if(!recent(when,8))return null;
    let reason=str(entry.type&&(
      entry.type.description||entry.type.name||entry.type.displayName));
    if(!reason)reason=str(entry.location||entry.injury||entry.injuryType);
    if(!reason)reason=str(entry.detail);
    if(/^(not specified|unknown|injury|n\/a|day-to-day|questionable|out)$/i.test(reason))reason="";
    const name=str(ath.displayName||ath.fullName||ath.name||entry.name);
    const id=String(ath.id||entry.athleteId||entry.playerId||"");
    if(!id&&!name)return null;
    return {id,name,code,status:code==="q"?"Questionable":code==="d"?"Doubtful":
      code==="out"?"Out":code==="dtd"?"Day-to-Day":"Probable",
      reason,at:when,source:"ESPN"};
  }
  function teamInjuryRows(payload,team){
    if(!payload)return [];
    if(Array.isArray(payload)){
      return payload.flatMap(x=>teamInjuryRows(x,team));
    }
    const groups=Array.isArray(payload.injuries)?payload.injuries:[];
    if(!groups.length)return [];
    if(groups.some(x=>x&&x.team&&Array.isArray(x.injuries))){
      return groups.filter(x=>String((x.team||{}).id)===String(team.id)||
        teamCodes(team).includes(str((x.team||{}).abbreviation).toUpperCase()))
        .flatMap(x=>x.injuries||[]).map(toInjury).filter(Boolean);
    }
    return groups.map(toInjury).filter(Boolean);
  }
  async function leagueReport(){
    if(cache.leagueInjuries&&Date.now()-injuryStamp<4*60000)return cache.leagueInjuries;
    if(inflight.leagueInjuries)return inflight.leagueInjuries;
    inflight.leagueInjuries=(async()=>{
      const raw=await fetchJSON(ESPN+"injuries");
      const data={};
      (raw.injuries||[]).forEach(group=>{
        if(!group.team)return;
        const id=String(group.team.id||"");
        if(!id)return;
        data[id]=(group.injuries||[]).map(toInjury).filter(Boolean);
      });
      cache.leagueInjuries=data;injuryStamp=Date.now();
      return data;
    })().catch(()=>null).finally(()=>{inflight.leagueInjuries=null;});
    return inflight.leagueInjuries;
  }
  async function loadInjuries(t){
    const key="8bit-injuries:"+t.id;
    const cached=memoryGet(key,4*60000);
    if(cached)return cached;
    // ESPN's NFL team /injuries endpoint commonly returns {}. Read the
    // live league-wide report first: one call, reused across all 32 teams.
    const league=await leagueReport();
    let rows=league&&league[String(t.id)]||null;
    let checked=!!league;
    if(!checked){
      // Only use the per-team fallback when the league endpoint is down.
      try{
        const raw=await fetchJSON(ESPN+"teams/"+t.id+"/injuries");
        rows=teamInjuryRows(raw,t);
        checked=!!(raw&&Array.isArray(raw.injuries));
      }catch(error){}
    }
    if(!checked)return null;
    const report={rows:rows||[],checkedAt:new Date().toISOString(),source:"ESPN"};
    memoryPut(key,report);
    return report;
  }

  function applyInjuries(data,report){
    if(!data||!report||!Array.isArray(report.rows))return data;
    const out=clone(data),byId=new Map(),byName=new Map();
    report.rows.forEach(i=>{
      if(i.id)byId.set(String(i.id),i);
      if(i.name)byName.set(nameKey(i.name),i);
    });
    ["offense","defense","special"].forEach(cat=>{
      out[cat].forEach(g=>g.players.forEach(p=>{
        const match=byId.get(String(p.id||""))||byName.get(nameKey(p.name));
        if(match)p.injury=match;else delete p.injury;
      }));
    });
    if(out.reserve)for(const key of ["practice","ir","other"]){
      (out.reserve[key]||[]).forEach(p=>{
        const match=byId.get(String(p.id||""))||byName.get(nameKey(p.name));
        if(match)p.injury=match;else delete p.injury;
      });
    }
    out.injuryCheckedAt=report.checkedAt;
    return out;
  }
  window.EightBitData={
    getBaseline,getOL,applySkill,applyOL,loadInjuries,applyInjuries,
    __test:{toInjury,teamInjuryRows,teamCodes,byRank}
  };
})();