import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import questions from "./questions.json" with { type: "json" };

const root = fileURLToPath(new URL(".", import.meta.url));
const rooms = new Map();
const teams = ["Modří", "Červení", "Zelení", "Žlutí", "Fialoví", "Oranžoví", "Černí", "Bílí"];

function json(res, status, data) { res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*"}); res.end(JSON.stringify(data)); }
async function body(req) { let s=""; for await (const c of req) s+=c; return s ? JSON.parse(s) : {}; }
function code() { let c; do c = Math.random().toString(36).slice(2,7).toUpperCase(); while (rooms.has(c)); return c; }
function roomState(room, role="player", playerId="") {
  const q = room.index >= 0 ? questions[room.index] : null;
  const answers = Object.values(room.answers);
  const counts = q ? q.options.map((_, i) => answers.filter(a => a.option === i).length) : [];
  const scores = Object.fromEntries(teams.map(t => [t, 0]));
  for (const p of Object.values(room.players)) scores[p.team] += p.score;
  return {code:room.code, phase:room.phase, index:room.index, total:questions.length, question:q ? {text:q.text, options:q.options, answer: role === "host" && room.phase !== "question" || role === "player" && room.phase === "results" ? q.answer : undefined} : null, counts: role === "host" || room.phase === "results" ? counts : undefined, scores, teams, playerTeam: room.players[playerId]?.team, players: role === "host" ? Object.values(room.players).map(({id,name,team,score})=>({id,name,team,score,answered:Boolean(room.answers[id])})) : undefined, answered: Boolean(room.answers[playerId])};
}
function broadcast(room) { room.version++; }

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") return json(res,204,{});
  if (url.pathname === "/api/create" && req.method === "POST") { const c=code(); const room={code:c,phase:"lobby",index:-1,players:{},answers:{},version:0}; rooms.set(c,room); return json(res,200,roomState(room,"host")); }
  if (url.pathname === "/api/state" && req.method === "GET") { const room=rooms.get(url.searchParams.get("code")); if(!room) return json(res,404,{error:"Místnost neexistuje"}); return json(res,200,roomState(room,url.searchParams.get("role"),url.searchParams.get("playerId"))); }
  if (url.pathname === "/api/join" && req.method === "POST") { const b=await body(req), room=rooms.get(String(b.code||"").toUpperCase()); if(!room) return json(res,404,{error:"Místnost neexistuje"}); if(room.phase!=="lobby") return json(res,400,{error:"Hra už začala"}); const id=Math.random().toString(36).slice(2); room.players[id]={id,name:String(b.name||"Hráč").slice(0,30),team:teams.includes(b.team)?b.team:teams[0],score:0}; broadcast(room); return json(res,200,{playerId:id,...roomState(room,"player",id)}); }
  if (url.pathname === "/api/action" && req.method === "POST") { const b=await body(req), room=rooms.get(String(b.code||"").toUpperCase()); if(!room) return json(res,404,{error:"Místnost neexistuje"});
    if(b.action==="start" && room.phase==="lobby"){room.index=0;room.phase="question";room.answers={};}
    else if(b.action==="next" && room.phase==="results"){room.index++;room.answers={};room.phase=room.index>=questions.length?"final":"question";}
    else if(b.action==="reveal" && room.phase==="question"){room.phase="results"; for(const a of Object.values(room.answers)){if(a.option===questions[room.index].answer) room.players[a.playerId].score+=100;}}
    else if(b.action==="answer" && room.phase==="question"){const p=room.players[b.playerId]; const option=Number(b.option); if(p && !room.answers[p.id] && Number.isInteger(option)){room.answers[p.id]={playerId:p.id,option};}}
    else return json(res,400,{error:"Akce není v této fázi dostupná"});
    broadcast(room); return json(res,200,roomState(room,b.action==="answer"?"player":"host",b.playerId)); }
  if (req.method === "GET") { const file=url.pathname==="/"?"index.html":url.pathname.slice(1); const safe=join(root,"public",file); try { const data=await readFile(safe); const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"}; res.writeHead(200,{"Content-Type":types[extname(safe)]||"application/octet-stream"}); res.end(data); } catch { res.writeHead(404); res.end("Not found"); } return; }
  json(res,404,{error:"Not found"});
});
server.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log(`Quiz běží na http://localhost:${process.env.PORT||3000}`));
