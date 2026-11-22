// Family artwork interpreted as small solid toys; private photos and printed slogans are not embedded.
import * as THREE from 'three';
import { roundBox } from './spacekit.js';
const BALL = new THREE.SphereGeometry(1, 12, 9), SMALL = new THREE.SphereGeometry(1, 8, 6), DOT = new THREE.SphereGeometry(1, 6, 4);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6), CONE = new THREE.ConeGeometry(1, 1, 8), UP = new THREE.Vector3(0, 1, 0);
const CREAM = '#fff0d5', GLINT = '#f4ddf0', DARK = '#343248', PINK = '#d981b9', BLUE = '#65bad0', YELLOW = '#edd06e';
function ball(b,c,x,y,z,sx,sy=sx,sz=sx,large=false,rot){b.put(large?BALL:SMALL,x,y,z,c,[sx,sy,sz],rot);}
function dot(b,c,x,y,z,sx,sy=sx,sz=sx){b.put(DOT,x,y,z,c,[sx,sy,sz]);}
function rod(b,c,a,d,r=.022){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...d),v=q.clone().sub(p),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,v.clone().normalize()));p.add(q).multiplyScalar(.5);b.put(CYL,p.x,p.y,p.z,c,[r,v.length(),r],e.toArray());}
function stroke(b,c,points,r=.018,n=6,closed=false){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),n,r,4,closed);b.put(g,0,0,0,c);g.dispose();if(!closed)for(const p of [points[0],points.at(-1)])dot(b,c,...p,r);}
function solid(b,c,points,depth=.10,z=0,bevel=.015){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:bevel>0,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:3});b.put(g,0,0,z-depth/2,c);g.dispose();}
function heart(b,c,x,y,z,w=.13,h=.13,depth=.025){solid(b,c,[[-.95,.35],[-.75,.87],[-.23,.97],[0,.67],[.28,.99],[.79,.86],[.97,.34],[.73,-.10],[0,-.87],[-.73,-.10]].map(([a,d])=>[x+a*w,y+d*h]),depth,z,.008);}
const faceZ=(x,y)=>.33*Math.sqrt(Math.max(0,1-(x/.56)**2-((y-1.35)/.5)**2))+.025;
function body(b,c,{arms=true,feet=true,head=true}={}){if(head)ball(b,c,0,1.35,0,.56,.50,.33,true);ball(b,c,0,.56,0,.28,.39,.22);if(arms)for(const s of [-1,1])ball(b,c,s*.31,.65,0,.115,.22,.12,false,[0,0,s*.6]);if(feet)for(const s of [-1,1])ball(b,c,s*.22,.12,.06,.19,.12,.19);}
function ears(b,c,inner='#dc8bb6',long=false){for(const s of [-1,1]){if(long){ball(b,c,s*.31,1.88,-.015,.15,.30,.13);ball(b,inner,s*.31,1.93,.107,.062,.18,.021);}else{solid(b,c,[[s*.28,1.67],[s*.57,2.04],[s*.60,1.54]],.18,-.035);solid(b,inner,[[s*.34,1.69],[s*.55,1.96],[s*.55,1.60]],.025,.078);}}}
function eye(b,x,y,{iris='#3b2c4e',rim='#edc5d7',size=.145,glint=true}={}){const z=faceZ(x,y);ball(b,rim,x,y,z,size*1.13,size*1.30,.034);ball(b,iris,x,y,z+.026,size,size*1.18,.025);if(glint){dot(b,GLINT,x,y,z+.055,.043,.052,.012);dot(b,GLINT,x+.060,y-.070,z+.052,.022,.025,.01);}}
function muzzle(b,{color=CREAM,y=1.13,nose=DARK,open=false}={}){const z=faceZ(0,y);ball(b,color,0,y,z,.16,.105,.025);dot(b,nose,0,y+.035,z+.034,.036,.022,.015);if(open){ball(b,DARK,0,y-.025,z+.032,.061,.049,.014);dot(b,'#e69aba',.0,y-.044,z+.047,.029,.02,.009);}else{stroke(b,DARK,[[-.105,y+.005,z+.03],[-.06,y-.04,z+.045],[0,y+.01,z+.053],[.06,y-.04,z+.045],[.105,y+.005,z+.03]],.012,8);}}
function cheeks(b,c='#e99ebd',depth){for(const s of [-1,1])dot(b,c,s*.40,1.23,depth??faceZ(s*.40,1.23),.085,.065,.023);}
function horn(b,c='#5c8dcc',height=.32){b.put(CONE,0,1.95,0,c,[.075,height,.075]);for(let i=0;i<2;i++)rod(b,'#a8b1db',[-.06+i*.018,1.86+i*.085,.06],[.055-i*.022,1.91+i*.085,.06],.009);}
function mane(b,colors=[BLUE,YELLOW,PINK],tail=false){for(const s of [-1,1])for(let i=0;i<3;i++)ball(b,colors[i%colors.length],s*(.49+.045*(i%2)),1.37-i*.27,-.14,.18,.25,.16,false,[0,0,s*(.1+i*.15)]);for(let i=0;i<3;i++)ball(b,colors[i],-.17+i*.17,1.78-i*.04,.05,.20,.19,.13,false,[0,0,-.35]);if(tail)for(let i=0;i<3;i++)ball(b,colors[i],.38+i*.08,.42-i*.10,-.10,.13,.21,.13,false,[0,0,-.55]);}
function hooves(b,c='#c58cc3'){for(const s of [-1,1])ball(b,c,s*.22,.085,.195,.145,.065,.035);}
function lashes(b,x,y){const z=faceZ(x,y)+.025,s=Math.sign(x);for(let i=0;i<2;i++)rod(b,DARK,[x+s*.11,y+.10-i*.055,z],[x+s*.19,y+.15-i*.06,z],.016);}

function buttonBunny(b){
 const coat='#b3a0d3';body(b,coat,{arms:false});ears(b,coat,'#e78fb4',true);
 for(const s of [-1,1])ball(b,'#62556f',s*.31,2.12,-.003,.112,.055,.08);
 ball(b,coat,-.33,.62,0,.12,.21,.12,false,[0,0,-.6]);ball(b,coat,.35,.83,0,.12,.23,.12,false,[0,0,-.95]);
 ball(b,'#eec4e0',0,.58,.216,.21,.28,.025);hooves(b,'#eec4e0');
 eye(b,-.21,1.45,{glint:false,rim:'#f3c5dc',size:.12});
 const z=faceZ(-.21,1.45)+.060;rod(b,'#f3c5dc',[-.28,1.39,z],[-.14,1.51,z],.016);rod(b,'#f3c5dc',[-.27,1.52,z],[-.15,1.38,z],.016);
 eye(b,.21,1.45,{size:.125});lashes(b,.21,1.45);muzzle(b,{color:'#eec4e0',y:1.11});cheeks(b,'#e78fb4');
 dot(b,'#e78fb4',.30,1.29,faceZ(.30,1.29)+.025,.057,.035,.018);for(let i=0;i<2;i++)dot(b,'#eec4e0',-.37-i*.025,1.36-i*.045,faceZ(-.37-i*.025,1.36-i*.045),.020);
}
function noodleUnicorn(b){
 body(b,'#a094c9');mane(b,[BLUE,YELLOW,PINK]);ears(b,'#a094c9');horn(b,'#ed8e90');eye(b,-.21,1.45,{rim:'#e4bd6a'});eye(b,.21,1.45,{rim:'#e4bd6a'});lashes(b,-.21,1.45);lashes(b,.21,1.45);muzzle(b);cheeks(b);
 // Food stays a small held toy prop, with no printed words.
 dot(b,'#a094c9',-.31,.57,.20,.09,.085,.10);dot(b,'#a094c9',.27,.57,.20,.10,.085,.10);
 b.put(CONE,-.31,.52,.28,'#c58b56',[.075,.20,.075],[0,0,Math.PI]);
 for(const [x,y,c]of [[-.35,.68,'#e6a9be'],[-.25,.68,'#e6a9be'],[-.30,.77,'#add5b8']])dot(b,c,x,y,.30,.075,.07,.07);
 for(const [x,y]of [[-.32,.78],[-.27,.75],[-.30,.82]])dot(b,'#667f67',x,y,.366,.011);
 b.put(CYL,.39,.58,.28,'#edc45e',[.13,.28,.13],[0,0,-.20]);
 const rim=new THREE.TorusGeometry(1,.09,3,10);b.put(rim,.41,.72,.28,CREAM,[.14,.14,.14],[Math.PI/2,0,-.2]);rim.dispose();
 ball(b,'#e9d5a4',.41,.722,.28,.12,.025,.12);
 for(const s of [-1,1])rod(b,'#a94d54',[.42+s*.037,.70,.28],[.48+s*.05,1.02,.27],.015);
}
function butterflyUnicorn(b){
 body(b,'#e7e0ed');mane(b,['#e8c670','#e6a6b8','#8bbbd9'],true);ears(b,'#e7e0ed');horn(b);eye(b,-.21,1.45);eye(b,.21,1.45);muzzle(b,{open:true});cheeks(b);hooves(b);
 for(const [dx,dy,sx,sy]of [[-.045,.045,.055,.095],[.045,.045,.055,.095],[-.04,-.045,.042,.055],[.04,-.045,.042,.055]])dot(b,'#e8c670',.23+dx,1.86+dy,.185,sx,sy,.025);
 rod(b,'#9b79b4',[.23,1.80,.22],[.23,1.92,.22],.014);for(const s of [-1,1])dot(b,'#719cba',.23+s*.045,1.90,.217,.020,.025,.01);
}
function partyKitten(b){
 const coat='#ead1d8';body(b,coat,{arms:false});ears(b,coat,'#d78fae');
 for(const s of [-1,1]){ball(b,coat,s*.36,.82,.05,.11,.19,.11,false,[0,0,-s*.6]);dot(b,'#d78fae',s*.40,.91,.147,.047,.05,.013);ball(b,coat,s*.40,.34,-.08,.22,.32,.20,false,[0,0,-s*.4]);}
 eye(b,-.21,1.45,{iris:'#426d70'});eye(b,.21,1.45,{iris:'#426d70'});lashes(b,-.21,1.45);lashes(b,.21,1.45);muzzle(b,{open:true,color:'#eed17d'});cheeks(b,'#d78fae');
 for(const x of [-.16,-.08,0,.08,.16])dot(b,CREAM,x,.72-Math.abs(x)*.2,.236,.085,.12,.025);
 b.put(CONE,0,1.95,-.02,'#d85c65',[.15,.36,.15]);
 const brim=new THREE.TorusGeometry(1,.18,3,10);b.put(brim,0,1.78,-.02,'#9caebd',[.17,.17,.13],[Math.PI/2,0,0]);brim.dispose();
 for(const [x,y,c]of [[-.06,1.91,'#e9cf6c'],[.05,1.97,'#78bfc1'],[.01,2.04,'#e7b0cc']])dot(b,c,x,y,.09,.016);
 for(const [x,y]of [[-.032,2.12],[.032,2.12],[0,2.15],[0,2.10]])dot(b,'#e9cf6c',x,y,-.02,.035);
}
function blueManePony(b){
 body(b,'#ead5ec');mane(b,['#629fd8','#8d7bcc','#d981b9']);ears(b,'#ead5ec');eye(b,-.21,1.45,{iris:'#517ebd'});eye(b,.21,1.45,{iris:'#517ebd'});lashes(b,-.21,1.45);lashes(b,.21,1.45);muzzle(b,{open:true});cheeks(b);hooves(b);
}
function wingedBow(b){
 body(b,'#f3eddf',{arms:false});
 // Larger overlapping hair lobes keep the long mane while leaving room in the budget for wings and bow.
 for(const side of [-1,1]){dot(b,'#f3eddf',side*.30,.66,.02,.115,.22,.12);for(let i=0;i<2;i++)ball(b,i?'#6ca2ca':'#65bad0',side*.51,1.30-i*.37,-.14,.18,.30,.16,false,[0,0,side*.2]);}
 for(let i=0;i<2;i++){ball(b,i?'#99bfcc':'#65bad0',-.10+i*.20,1.80-i*.05,.05,.24,.20,.13,false,[0,0,-.35]);ball(b,i?'#6ca2ca':'#65bad0',.40+i*.12,.40-i*.15,-.10,.15,.24,.13,false,[0,0,-.6]);}
 ears(b,'#f3eddf');horn(b,'#8b8bc5');eye(b,-.21,1.45,{iris:'#a56388'});eye(b,.21,1.45,{iris:'#a56388'});lashes(b,-.21,1.45);lashes(b,.21,1.45);cheeks(b);
 ball(b,DARK,0,1.18,.358,.10,.065,.035);dot(b,GLINT,.025,1.20,.391,.032,.015,.01);
 stroke(b,DARK,[[-.16,1.10,.35],[-.09,1.05,.373],[0,1.12,.39],[.09,1.05,.373],[.16,1.10,.35]],.024,8);
 for(const s of [-1,1]){
  const wing=[[s*.23,.81],[s*.46,1.02],[s*.72,1.05],[s*.70,.92],[s*.82,.88],[s*.72,.75],[s*.70,.63],[s*.49,.61],[s*.30,.67]];
  solid(b,'#e6d4a0',wing,.11,-.06);solid(b,CREAM,wing.map(([x,y])=>[x*.94,(y-.80)*.89+.80]),.10,-.035);
  ball(b,'#438cc0',s*.14,1.78,.18,.15,.12,.07,false,[0,0,s*.35]);
 }
 dot(b,'#99a8db',0,1.78,.246,.055,.07,.025);for(const s of [-1,1])dot(b,'#c7c4ec',s*.045,1.79,.25,.032,.043,.012);
 heart(b,'#af6d9e',0,.73,.235,.055,.055);hooves(b,'#70adcc');
}
function cloudMonkey(b){
 const coat='#b77b8f',tan='#d9ad9f';body(b,coat);
 for(const s of [-1,1]){ball(b,coat,s*.46,1.70,-.02,.17,.17,.13);ball(b,tan,s*.46,1.70,.09,.12,.12,.027);}
 ball(b,tan,0,.55,.22,.20,.27,.025);ball(b,tan,0,1.21,.325,.25,.15,.025);
 eye(b,-.21,1.45,{glint:false,iris:'#edc7e1',rim:tan,size:.12});const p=[];for(let i=0;i<20;i++){const a=i/19*Math.PI*4,r=.105*(1-i/19);p.push([-.21+Math.cos(a)*r,1.45+Math.sin(a)*r,faceZ(-.21,1.45)+.065]);}stroke(b,'#3b2c4e',p,.019,20);
 dot(b,'#3b2c4e',-.21,1.45,faceZ(-.21,1.45)+.095,.012);
 eye(b,.21,1.45,{rim:tan,size:.11});cheeks(b);
 rod(b,'#3b2c4e',[-.04,1.23,.383],[.04,1.15,.383],.015);rod(b,'#3b2c4e',[-.04,1.15,.383],[.04,1.23,.383],.015);
 for(const [x,y]of [[-.10,1.85],[0,1.91],[.10,1.85]])dot(b,'#edc7e1',x,y,.13,.09,.07,.025);
 stroke(b,'#8b668a',[[-.035,1.86,.165],[0,1.84,.17],[.035,1.86,.165]],.009,4);
 stroke(b,'#be7b66',[[.20,.32,-.04],[.48,.28,-.05],[.61,.48,-.04],[.69,.65,-.03]],.050,9);
 stroke(b,'#79556c',[[.36,.72,.05],[.53,.83,.03],[.59,.99,.03],[.79,1.14,.03]],.012,7);
 heart(b,'#548fd8',.80,1.24,.03,.15,.13,.08);dot(b,GLINT,.77,1.29,.089,.027,.035,.01);
}
function headphoneDragon(b){
 const pink='#dc84ae';body(b,pink,{head:false});const g=roundBox(1.10,.91,.62,.14,2);b.put(g,0,1.35,0,pink);g.dispose();
 for(const s of [-1,1]){
  solid(b,pink,[[s*.31,1.72],[s*.62,2.03],[s*.56,1.64]],.14,-.06);
  for(const y of [1.40,1.13])solid(b,pink,[[s*.44,y+.1],[s*.75,y+.13],[s*.60,y-.08]],.10,-.08);
 }
 eye(b,-.21,1.45,{rim:'#e3c483'});eye(b,.21,1.45,{rim:'#e3c483'});muzzle(b);
 // The rounded box has a flatter face than the other ellipsoid heads.
 cheeks(b,'#e99ebd',.33);
 ball(b,'#c3b6e3',0,.56,.213,.20,.32,.025);
 for(const y of [.35,.47,.59,.71])rod(b,'#a59ad4',[-.16,y,.243],[.16,y,.243],.010);
 for(const s of [-1,1])for(const dx of [-.055,0,.055])dot(b,CREAM,s*.22+dx,.15,.24,.024,.035,.035);
 for(const s of [-1,1]){ball(b,'#a59ad4',s*.535,1.47,.015,.105,.23,.20);ball(b,'#cdb3d6',s*.57,1.47,.15,.058,.19,.04);rod(b,'#77628f',[s*.60,1.47,.17],[s*.60,1.58,.17],.01);dot(b,'#77628f',s*.62,1.46,.18,.020);}
 stroke(b,'#e487ae',[[-.52,1.53,-.03],[-.44,1.85,-.03],[0,1.92,-.03],[.44,1.85,-.03],[.52,1.53,-.03]],.040,12);
 stroke(b,pink,[[.20,.28,-.06],[.49,.30,-.08],[.70,.47,-.08],[.78,.76,-.07]],.085,10);
 stroke(b,'#c3b6e3',[[.25,.25,.005],[.51,.29,.005],[.68,.48,.005],[.74,.72,.005]],.041,10);
 for(const [x,y,rot]of [[.79,.82,-.4],[.86,.78,-1.1],[.75,.85,.4]])dot(b,'#8176b6',x,y,-.06,.067,.095,.04);
}
function heartPumpkin(b){
 const pale='#fff1d0',orange='#d79c4e';
 for(let i=-3;i<=3;i++){const x=i*.17,sy=.65-Math.abs(i)*.055;ball(b,pale,x,.68,0,.19,sy,.35,true);stroke(b,orange,[[x,.68+sy-.03,.10],[x-.04,.96,.30],[x-.04,.50,.34],[x,.68-sy+.03,.11]],.018,7);}
 solid(b,'#986544',[[-.12,1.22],[.13,1.22],[.075,1.60],[-.06,1.65]],.20,-.015);
 for(const s of [-1,1])stroke(b,'#d7c65d',[[s*.08,1.30,.02],[s*.30,1.40,.03],[s*.37,1.31,.03],[s*.28,1.27,.04],[s*.24,1.39,.04]],.018,7);
 for(const x of [-.23,.23]){heart(b,'#36313b',x,.98,.365,.16,.16);stroke(b,'#36313b',[[x-.11,1.17,.30],[x,1.21,.31],[x+.10,1.18,.30]],.018,5);}
 solid(b,'#5d8dac',[[-.055,.67],[.055,.67],[0,.74]],.025,.39);
 ball(b,'#36313b',0,.48,.365,.19,.14,.024);
}
function heartGhost(b){
 const edge='#ad4d7a',pale='#fff1e8';
 const outline=[[-.38,.31],[-.40,.70],[-.34,1.05],[-.31,1.56],[-.23,1.76],[0,1.83],[.25,1.76],[.34,1.55],[.35,1.05],[.39,.67],[.48,.29],[.35,.35],[.30,.11],[.18,.25],[.03,.15],[-.06,.30],[-.22,.12],[-.29,.37]];
 solid(b,edge,outline,.42,0,.025);solid(b,pale,outline.map(([x,y])=>[x*.92,(y-.95)*.94+.95]),.40,.028,.025);
 for(const s of [-1,1]){const p=[[s*.30,1.10,.0],[s*.51,1.14,.0],[s*.65,1.31,.0]];stroke(b,edge,p,.055,7);stroke(b,pale,p.map(([x,y,z])=>[x,y,z+.03]),.032,7);}
 for(const x of [-.20,.20]){heart(b,'#36313b',x,1.34,.275,.16,.17);heart(b,'#ae496f',x,1.35,.306,.125,.13);stroke(b,'#5d8dac',[[x-.08,1.60,.27],[x,1.62,.28],[x+.07,1.59,.27]],.015,5);}
 heart(b,'#36313b',0,1.14,.282,.035,.033);
 ball(b,'#36313b',0,1.00,.282,.16,.14,.026);ball(b,'#ae496f',0,1.06,.307,.105,.052,.014);
 stroke(b,'#5d8dac',[[-.045,.81,.27],[0,.80,.28],[.06,.83,.27]],.013,5);
}
const species=(name,voice,build,action,line,colors,move='hop')=>({name,planet:'earth',move,v:.50,r:1.05,size:1,hopH:.10,emoji:'🖍️',voice,build,play:{action,line,colors}});
export const CRAFT_FANTASY={
 craftbuttonbunny:species('Button-Eye Bunny','Hello! My button eye is ready for a happy bunny dance!',buttonBunny,'bounce','Bunny bounce! Hop with me!',['#b3a0d3','#e78fb4'],'bounce'),
 craftnoodleunicorn:species('Noodle Unicorn','Hello! Come share a silly noodle song with me!',noodleUnicorn,'sing','Noodle doodle! La, la, la!',[BLUE,YELLOW,PINK]),
 craftbutterflyunicorn:species('Butterfly Unicorn','Hello! My little butterfly loves rainbow sparkles!',butterflyUnicorn,'sparkle','Flutter, flutter! Rainbow sparkles!',['#e8c670','#e6a6b8','#8bbbd9']),
 craftpartykitten:species('Party Kitten','Hello! My party hat is ready! Let’s dance!',partyKitten,'twirl','Meow! It’s a happy party dance!',['#ead1d8','#d85c65','#e9cf6c']),
 craftbluemanepony:species('Blue-Mane Pony','Hello! Let’s make our blue manes bounce!',blueManePony,'bounce','Boing! A pony jump for you!',['#629fd8','#8d7bcc','#d981b9'],'bounce'),
 craftwingedbow:species('Winged Bow Friend','Hello! My soft wings have a little hug for you!',wingedBow,'hug','A soft fluttery hug!',['#65bad0','#f3eddf','#af6d9e']),
 craftcloudmonkey:species('Cloud Monkey','Hello! My heart balloon loves a happy song!',cloudMonkey,'sing','Ooh, ooh! Sing with my heart balloon!',['#b77b8f','#548fd8','#edc7e1']),
 craftheadphonedragon:species('Headphone Dragon','Hello! Can you hear my dragon dance song?',headphoneDragon,'twirl','Dragon dance! Wiggle your tail!',['#dc84ae','#a59ad4','#e487ae']),
 craftheartpumpkin:species('Heart-Eyed Pumpkin','Hello! A pumpkin hug is growing just for you!',heartPumpkin,'hug','A big pumpkin hug!',['#d79c4e','#d7c65d','#fff1d0']),
 craftheartghost:species('Heart-Eyed Ghost','Hello! I’m a friendly ghost! Let’s make happy hearts!',heartGhost,'sparkle','Peekaboo! Happy heart sparkles!',['#ad4d7a','#ae496f','#5d8dac'],'float'),
};
