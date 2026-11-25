/* ============ 基础数据 ============ */
const cents=n=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const fdate=d=>{const x=new Date(d.replace(' ','T'));return isNaN(x)?d:x};
const now=new Date('2026-11-23T11:13:00');
const PHARMA=['零售单体','第三终端','民营医院','连锁总部（批零一体）','连锁加盟','连锁总部（纯连锁）','商业公司','医疗器械经营店'];
const ACTS=['一口价','特价','限时特价','普通拼团','诊所拼团','批购包邮','连锁包邮'];
const CUSTOMERS=['益康大药房','百信连锁药店','仁和医药','康之源药房','惠民诊所','同济堂药店','国大药房','一心堂','老百姓大药房','万和医药','德仁堂','平安药房'];
const SEED=[
 {id:'414',title:'1000-1500',mode:'累计金额满返',status:'进行中',start:'2026-11-20 00:00:00',end:'2026-11-23 23:59:59',created:'2026-11-20 09:51:35',scale:1},
 {id:'413',title:'提现活动-1500-2000',mode:'累计金额满返',status:'进行中',start:'2026-11-20 00:00:00',end:'2026-11-23 23:59:59',created:'2026-11-20 09:49:48',scale:.85},
 {id:'412',title:'梯度满减3',mode:'累计SKU数满返',status:'进行中',start:'2026-11-20 00:00:00',end:'2026-11-23 23:59:59',created:'2026-11-10 14:26:03',scale:.66},
 {id:'411',title:'新客首单按比例返',mode:'按比例返',status:'进行中',start:'2026-11-01 00:00:00',end:'2026-12-20 23:59:59',created:'2026-10-30 15:17:02',scale:.72},
 {id:'410',title:'双12备货专享返利',mode:'按比例返',status:'未开始',start:'2026-12-01 00:00:00',end:'2026-12-31 23:59:59',created:'2026-11-02 11:20:41',scale:.9},
 {id:'409',title:'秋季诊所拼团返利',mode:'按比例返',status:'已结束',start:'2026-09-01 00:00:00',end:'2026-10-15 23:59:59',created:'2026-08-28 16:38:12',scale:.4},
 {id:'408',title:'第三终端拓展专项',mode:'累计金额满返',status:'已终止',start:'2026-11-01 00:00:00',end:'2026-12-31 23:59:59',created:'2026-10-28 10:11:09',scale:.3,reason:'平台风控：任务配置与活动归属不符'},
 {id:'407',title:'冬季储备用药 SKU 满返',mode:'累计SKU数满返',status:'未开始',start:'2026-12-05 00:00:00',end:'2026-12-31 23:59:59',created:'2026-11-18 09:03:27',scale:.55}
];
function seeded(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// 满返链路：第1档「返」、第2档起「再返」；逐档累加「累计共返」，任一档非法则断链显示「—」
function tierChain(tiers){let sum=0,broken=false;return tiers.map((t,i)=>{const a=+t.amount||0,p=+t.points||0;if(broken||a<=0||p<=0||(i>0&&a<=(+tiers[i-1].amount||0)))broken=true;if(!broken)sum+=p;return{verb:i===0?'返':'再返',total:broken||i===0?'—':sum+' 积分',broken}})}
function makeDetails(t){
  const r=seeded(t.id),n=9+Math.floor(r()*8),rows=[];let sum=0,reb=0;
  for(let i=0;i<n;i++){
    const amt=Math.round((420+r()*4800*t.scale)*100)/100;
    let rf=Math.round(amt*(t.mode==='累计SKU数满返'?.021:t.mode==='累计金额满返'?.017:.02)*100)/100;
    if(i===2&&t.scale>.5)rf=Math.round(rf*.2*100)/100;
    const d=new Date(fdate(t.start).getTime()+Math.floor(r()*30)*86400000+Math.floor(r()*12)*3600000);
    if(d>now)d.setTime(now.getTime()-Math.floor(r()*4)*86400000);
    const pad=n=>String(n).padStart(2,'0');
    const day=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const ts=`${day} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    rows.push({order:'XS'+day.replace(/-/g,'')+String(1000+Math.floor(r()*8999)),customer:CUSTOMERS[Math.floor(r()*CUSTOMERS.length)],type:PHARMA[Math.floor(r()*PHARMA.length)],amt,reb:rf,time:ts});
    sum+=amt;reb+=rf;
  }
  rows.sort((a,b)=>b.time.localeCompare(a.time));
  return{rows,sum:Math.round(sum*100)/100,reb:Math.round(reb*100)/100,customers:new Set(rows.map(x=>x.customer)).size};
}
const DETAIL={};SEED.forEach(t=>DETAIL[t.id]=makeDetails(t));
let TASKS=SEED.map(t=>({...t}));
const logs={};TASKS.forEach(t=>logs[t.id]=[{time:t.created,who:'yuanyihaosun（商家）',title:'创建任务',desc:'创建积分返利任务，免审核保存生效'}]);
TASKS.filter(t=>t.status==='已终止').forEach(t=>logs[t.id].push({time:'2026-11-12 09:30',who:'平台运营（总后台）',title:'强制终止任务',desc:'原因：'+t.reason}));
const state={screen:'s0',form:null,currentId:null,detailId:'414',agreed:false,filter:{},page:1,pageSize:10,detailFilter:{},detailPage:1,chartTab:'订单金额'};

/* ============ 框架渲染 ============ */
const RAIL=[
 ['常用','M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
 ['商品','M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4l2 13h12l2-13z'],
 ['订单','M6 2h9l5 5v15H6zM14 2v6h6'],
 ['售后','M12 2a10 10 0 100 20 10 10 0 000-20zM12 7v5l3 2'],
 ['客户','M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'],
 ['数据','M4 20V10M10 20V4M16 20v-7M22 20H2'],
 ['营销','M20 12v8H4v-8M12 2v14M8 6l4-4 4 4'],
 ['资质','M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6'],
 ['店铺','M3 9l1-5h16l1 5M5 9v11h14V9M3 9h18'],
 ['资金','M12 2v20M17 6H9a3 3 0 000 6h6a3 3 0 010 6H7'],
 ['月结','M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6'],
 ['直播','M15 10l4-2v8l-4-2M4 6h11v12H4z'],
 ['账号','M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'],
 ['特推','M13 2L3 14h7l-1 8 10-12h-7z']
];
const SUBS=['营销工具','特色活动','积分返利','限时抢购会场','促销宣传','平台营销活动','推广申请','店铺优惠券','店铺红包活动','满减满赠促销','店铺动态发布','店铺抽奖活动'];
function renderShell(){
  document.getElementById('rail').innerHTML=RAIL.map(([n,p],i)=>`<div class="side-item ${n==='营销'?'on':''}" data-rail="${n}">${n==='商品'?'<span class="rd"></span>':''}<svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${p}"/></svg>${n}</div>`).join('');
  document.getElementById('submenu').innerHTML='<div class="submenu-title">营销</div>'+SUBS.map(n=>`<div class="sub-item ${n==='积分返利'?'on':''}" data-sub="${n}">${n}</div>`).join('');
  renderTabs();
}
function renderTabs(){
  const map={sA:'新建返利任务',sC:'查看数据详情',sP:'平台运营配置',sB:'上架返利活动'};
  let tabs=`<div class="tab" data-go="s0">首页</div><div class="tab ${state.screen==='s0'?'on':''}" data-go="s0">积分返利 <span class="tx" data-act="backList">×</span></div>`;
  if(map[state.screen])tabs+=`<div class="tab on">${map[state.screen]} <span class="tx" data-act="backList">×</span></div>`;
  tabs+='<div class="tabs-right">⟳</div>';
  document.getElementById('tabs').innerHTML=tabs;
}
function go(s){state.screen=s;document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('on',x.id===s));renderTabs();
  if(s==='s0')renderList();if(s==='sA')renderForm();if(s==='sC')renderDetail();if(s==='sP')renderAdmin();if(s==='sB')renderB();window.scrollTo(0,0)}
let tt;function toast(m,w){const t=document.getElementById('toast');document.getElementById('toastMsg').textContent=m;t.querySelector('.toast-inner').classList.toggle('warn',!!w);t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)}
function openModal(h,wide){const m=document.getElementById('modal');m.className='modal'+(wide?' wide':'');m.innerHTML=h;document.getElementById('mask').classList.add('show');return m}
function closeModal(){document.getElementById('mask').classList.remove('show')}
document.getElementById('mask').addEventListener('mousedown',e=>{if(e.target.id==='mask')closeModal()});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close-modal]'))closeModal();
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
  const r=e.target.closest('[data-rail]');if(r){document.querySelectorAll('.side-item').forEach(x=>x.classList.toggle('on',x===r));return}
  const sb=e.target.closest('[data-sub]');if(sb){if(sb.dataset.sub!=='积分返利')toast('Demo 仅实现「积分返利」模块（'+sb.dataset.sub+' 为预留菜单）',true);return}
  const a=e.target.closest('[data-act]');if(a)handleAct(a.dataset.act,a.dataset.id,a);
});
function statusTag(s){const cls={'未开始':'gray','进行中':'','已结束':'blue','已终止':'red'}[s];return `<span class="dotstatus ${cls}">${s}</span>`}
function modeTag(m){return `<span class="tag ${m==='按比例返'?'blue':m==='累计金额满返'?'green':'gray'}">${m}</span>`}

/* ============ 屏0 首页 ============ */
function renderList(){
  const f=state.filter,list=TASKS.filter(t=>(!f.id||t.id===f.id)&&(!f.name||t.title.includes(f.name))&&(!f.status||t.status===f.status));
  document.getElementById('s0').innerHTML=`
   <div class="intro">
     <div class="intro-main">
       <h3>积分返利介绍</h3>
       <div class="intro-tags"><span>降价不变</span><span>搜索提权</span><span>更快动销</span></div>
       <p>积分返利任务是一个支持给用户返利的营销工具。您可以不用改变挂网价，通过返积分促进客户采购。参与返利的活动也将获得一定的流量曝光。</p>
       <button class="btn primary" data-act="create">新建返利任务</button>
       <div class="intro-stats"><div class="intro-stat"><b>${TASKS.length}</b><span>全部任务</span></div><div class="intro-stat"><b>${TASKS.filter(t=>t.status==='进行中').length}</b><span>进行中</span></div><div class="intro-stat"><b>¥${cents(TASKS.reduce((s,t)=>s+DETAIL[t.id].reb,0))}</b><span>累计返利金额</span></div></div>
     </div>
     <img class="intro-art" src="assets/gift-box.svg" alt="" />
   </div>
   <div class="card"><div class="card-body" style="padding-bottom:5px"><div class="filter-bar">
     <div class="field"><label>任务/活动ID</label><input class="inp" id="fId" placeholder="请输入ID" style="width:130px" value="${f.id||''}"></div>
     <div class="field"><label>任务/活动名称</label><input class="inp" id="fName" placeholder="请输入内容" style="width:160px" value="${f.name||''}"></div>
     <div class="field"><label>状态</label><select class="inp" id="fStatus" style="width:118px"><option value="">选择状态</option>${['未开始','进行中','已结束','已终止'].map(s=>`<option ${f.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
     <button class="btn primary" data-act="search">搜索</button><button class="btn" data-act="reset">重置</button>
     <button class="btn" data-act="exportList" style="margin-left:auto">导出</button>
   </div></div></div>
   <div class="card"><div class="table-wrap"><table><thead><tr>
     <th style="width:90px">任务/活动ID</th><th style="width:170px">任务/活动标题</th><th style="width:120px">返利模式</th><th style="width:180px">数据</th><th style="width:88px">状态</th><th style="width:180px">返利时间</th><th style="width:145px">创建时间</th><th style="width:92px">操作</th>
   </tr></thead><tbody>${list.length?list.slice((state.page-1)*state.pageSize,state.page*state.pageSize).map(t=>{
     const d=DETAIL[t.id],term=t.status==='已终止'||t.status==='已结束';
     return `<tr><td>${t.id}</td><td><div class="cell-title" title="${t.title}">${t.title}</div></td><td>${modeTag(t.mode)}</td>
     <td><div class="cell-data">订单金额：<b>${cents(d.sum)}</b><br>返利金额：<b>${cents(d.reb)}</b><br><a data-act="detail" data-id="${t.id}">查看数据详情</a></div></td>
     <td>${statusTag(t.status)}</td><td class="muted">${t.start}<br>至 ${t.end}</td><td class="muted">${t.created}</td>
     <td><div class="ops">${term?`<a class="dis" title="该状态不可编辑">编辑</a>`:`<a data-act="edit" data-id="${t.id}">编辑</a>`}<a data-act="copy" data-id="${t.id}">复制</a><a data-act="logs" data-id="${t.id}">操作日志</a></div></td></tr>`
   }).join(''):`<tr><td colspan="8"><div class="empty">暂无返利任务/活动，点击上方按钮创建</div></td></tr>`}</tbody></table></div>
   <div class="pager"><span>总共 ${list.length} 条数据</span>${(()=>{const p=Math.max(1,Math.ceil(list.length/state.pageSize));let h=`<button class="pg" ${state.page===1?'disabled':''} data-act="page" data-id="${state.page-1}">‹</button>`;for(let i=1;i<=p;i++)h+=`<button class="pg ${i===state.page?'on':''}" data-act="page" data-id="${i}">${i}</button>`;return h+`<button class="pg" ${state.page===p?'disabled':''} data-act="page" data-id="${state.page+1}">›</button>`})()}<select class="inp" id="pageSize" style="height:28px;width:70px"><option ${state.pageSize===10?'selected':''}>10</option><option ${state.pageSize===5?'selected':''}>5</option><option ${state.pageSize===20?'selected':''}>20</option></select><span>条/页</span></div></div>`;
  const ps=document.getElementById('pageSize');if(ps)ps.onchange=e=>{state.pageSize=+e.target.value;state.page=1;renderList()};
}

/* ============ 屏A 创建/编辑 ============ */
function blankForm(){return{mode:'create',title:'',start:'2026-11-23T11:13',end:'2026-12-31T23:59',types:[...PHARMA],white:false,black:false,taskType:'按比例返',perX:'',perY:'',cycle:'整个活动周期',tiers:[{amount:'',points:''}],scope:'all',actTypes:[...ACTS],imported:[],actItems:[],budget:'',unlimited:false,quota:'停止返利',agreed:false}}
function openForm(t,mode){
  state.currentId=t?t.id:null;
  if(mode==='copy'&&t){const f=blankForm();f.title=t.title+'（副本）';f.taskType=t.mode;state.form=f}
  else if(t){state.form={...blankForm(),mode:'edit',title:t.title,start:t.start.replace(' ','T').slice(0,16),end:t.end.replace(' ','T').slice(0,16),taskType:t.mode,budget:t.budget||'',unlimited:!t.budget,quota:t.quota||'停止返利',agreed:state.agreed,white:!!t.white,black:!!t.black,cycle:t.cycle||'整个活动周期',types:[...(t.types||PHARMA)],scope:t.scope||'all',actTypes:[...(t.actTypes||ACTS)],imported:[...(t.imported||[])],actItems:[...(t.actItems||[])]}}
  else state.form=blankForm();
  go('sA');
}
function renderForm(){
  if(!state.form)state.form=blankForm();
  const F=state.form,edit=F.mode==='edit',lk=k=>edit&&['taskType','perX','perY','tiers'].includes(k);
  const ratio=(+F.perX>0&&+F.perY>0)?(+F.perY/100/+F.perX*100).toFixed(2):'—';
  const ratioHtml=(+F.perX>0&&+F.perY>0)?`返利比例 <b>${ratio}%</b>（100积分价值1元）`:'返利比例 —';
  let tiersHtml='';
  if(F.taskType!=='按比例返'){
    const amt=F.taskType==='累计金额满返',chain=tierChain(F.tiers);
    tiersHtml=F.tiers.map((t,i)=>`<div class="tier"><div class="tier-head"><span>第 ${i+1} 档</span>${lk('tiers')||F.tiers.length<=1?'':`<a data-act="delTier" data-id="${i}" style="font-size:12px">删除</a>`}</div>
      <div class="inline"><span class="muted" style="width:104px;text-align:right">累计采购满</span><input class="mini-inp" data-f="tier-${i}-k" value="${t.amount}" placeholder="请输入" ${lk('tiers')?'disabled':''}><span class="muted">${amt?'元':'个品种'}</span><span class="muted" style="width:36px;text-align:right">${chain[i].verb}</span><input class="mini-inp" data-f="tier-${i}-v" value="${t.points}" placeholder="请输入" ${lk('tiers')?'disabled':''}><span class="muted">积分</span>${i>0?`<span class="calc" style="margin-left:10px">累计共返 <b>${chain[i].total}</b></span>`:''}</div></div>`).join('')+
      (lk('tiers')?'':`<button class="btn sm" data-act="addTier" ${F.tiers.length>=4?'disabled':''}>＋ 新增档位</button>`)+
      `<div class="help" style="margin-top:7px">按单笔订单累计采购数据命中档位，达到的每个档位都会发放、各档积分逐档累加。最多 4 档、至少 1 档，档位值递增且不重复；最后一档不可删除；累计共返自动计算，非法档位显示「—」。</div>`;
  }else{
    const badRatio=(+F.perX<=0||+F.perY<=0);
    tiersHtml=`<div class="inline"><span class="muted" style="width:18px">每满</span><input class="mini-inp" data-f="perX" value="${F.perX}" placeholder="请输入" ${lk('perX')?'disabled':''}><span class="muted">元，返</span><input class="mini-inp" data-f="perY" value="${F.perY}" placeholder="请输入" ${lk('perY')?'disabled':''}><span class="muted">积分</span><span class="calc">ⓘ ${ratioHtml}</span></div><div id="ratioErr" class="err" style="margin:5px 0 0 22px">${badRatio?'每满金额需大于 0，返积分需大于 0。':''}</div>`;
  }
  let scopeHtml='';
  if(F.scope==='all'){
    scopeHtml=`<div class="grey-box">
      <div class="sub"><label>黑名单品种</label><div><button class="btn sm" data-act="import" data-id="sku">选择上传</button><div class="help">1. 每次上传不要超过 10000 条<br>2. <a data-act="tmpl">模板下载</a>${F.imported&&F.imported.length?`<br><span style="color:var(--success)">✓ 已导入 ${F.imported.length} 条</span>`:''}</div></div></div>
      <div class="sub"><label>参与活动类型</label><div><div class="check-line inline" style="margin-bottom:8px"><label><input type="checkbox" data-act="checkAllAct" ${F.actTypes.length===ACTS.length?'checked':''}> 全选</label></div>
      <div class="check-grid">${ACTS.map(a=>`<label><input type="checkbox" data-f="actType" value="${a}" ${F.actTypes.includes(a)?'checked':''}> ${a}</label>`).join('')}</div></div></div>
    </div>`;
  }else{
    scopeHtml=`<div class="grey-box"><div class="sub"><label>批量导入活动</label><div><button class="btn sm" data-act="import" data-id="act">选择上传</button><div class="help">导入时校验活动归属本供应商；单次不超过 10000 条；<a data-act="tmpl">模板下载</a></div></div></div>
      <div class="sub"><label>已导入活动</label><button class="btn sm" data-act="viewImported">查看（${(F.actItems||[]).length}）</button></div></div>`;
  }
  const terms=`当营销服务额度少于 <b>100</b> 元时，继续发放积分，超出部分在结算时从商家结算款中扣减。具体结算规则请阅读《药师帮平台返利活动协议》的相关内容。`;
  const steps=['基础配置','药店配置','采购要求配置','返利资金配置'];
  document.getElementById('formRoot').innerHTML=`
   <div class="page-head"><a class="back" data-act="backList">← 返回</a><span class="page-title-lg">${edit?'编辑':'新建'}返利任务</span><span class="tag ${edit?'blue':'gray'}">${edit?'编辑态 · 部分字段锁定':'填写助手'}</span></div>
   ${edit?`<div class="banner">进行中任务仅可修改：计划标题、结束时间、药店配置、参与返利的活动、返利总预算（仅调高）与余额不足策略；任务类型与返利设置锁定，如需变更请「终止 + 新建」。</div>`:''}
   <div class="form-layout">
     <div class="step-nav">${steps.map((s,i)=>`<div class="step ${i===0?'on':''}" data-step="${i}">${s}</div>`).join('')}</div>
     <div class="step-main">
      <div class="card" id="step0"><div class="card-head"><span class="card-title">基础配置</span></div><div class="card-body">
        <div class="frow"><div class="fitem"><label class="req">计划标题</label><div class="fctrl inline"><input class="inp" data-f="title" maxlength="30" value="${F.title}" placeholder="请输入标题" style="width:320px"><span class="counter">${F.title.length}/30</span></div></div></div>
        <div class="frow"><div class="fitem"><label class="req">计划时间</label><div class="fctrl inline"><input type="datetime-local" class="inp" data-f="start" value="${F.start}" ${edit?'disabled':''} style="width:190px"><span class="muted">~</span><input type="datetime-local" class="inp" data-f="end" value="${F.end}" style="width:190px"><span class="help">开始时间不得早于当前时间；结束时间不得早于当前时间。</span></div></div></div>
      </div></div>

      <div class="card" id="step1"><div class="card-head"><span class="card-title">药店配置</span></div><div class="card-body">
        <div class="frow"><div class="fitem"><label class="req">统计药店类型</label><div class="fctrl"><div class="check-grid">${PHARMA.map(p=>`<label><input type="checkbox" data-f="pharma" value="${p}" ${F.types.includes(p)?'checked':''}> ${p}</label>`).join('')}</div><div class="help" id="pharmaHelp">默认全选，至少保留 1 项；与平台「药店类型」字典一致。</div></div></div></div>
        <div class="frow"><div class="fitem"><label>客户白名单</label><div class="fctrl inline"><button class="btn sm" data-act="upload" data-id="white">${F.white?'✓ 已上传文件':'选择上传'}</button><a data-act="tmpl" style="margin-left:8px">模板下载</a><span class="help">说明：上传后仅名单内客户可参与返利任务。</span></div></div></div>
        <div class="frow"><div class="fitem"><label>客户黑名单</label><div class="fctrl inline"><button class="btn sm" data-act="upload" data-id="black">${F.black?'✓ 已上传文件':'选择上传'}</button><a data-act="tmpl" style="margin-left:8px">模板下载</a><span class="help">说明：上传后名单内客户不参与返利任务。</span></div></div></div>
        <div class="help" style="margin-left:121px">文件上传，单次 ≤ 10000 条；同时命中白名单与黑名单时，<b>黑名单优先</b>。</div>
      </div></div>

      <div class="card" id="step2"><div class="card-head"><span class="card-title">采购要求配置</span></div><div class="card-body">
        <div class="frow"><div class="fitem"><label class="req">任务类型</label><div class="fctrl">
          ${lk('taskType')?`<div class="locked-row">${F.taskType}<span class="lock-reason">创建后不可修改，如需变更请「终止 + 新建」</span></div>`:`<div class="radio-line">${['按比例返','累计金额满返','累计SKU数满返'].map(m=>`<label><input type="radio" name="taskType" value="${m}" ${F.taskType===m?'checked':''}> ${m}</label>`).join('')}</div>`}
          <div style="margin-top:8px">${tiersHtml}</div>
        </div></div></div>
        <div class="frow"><div class="fitem"><label class="req">统计周期</label><div class="fctrl">${lk('cycle')?`<div class="locked-row">${F.cycle}<span class="lock-reason">创建后不可修改</span></div>`:`<div class="radio-line">${['整个活动周期','单日'].map(c=>`<label><input type="radio" name="cycle" value="${c}" ${F.cycle===c?'checked':''}> ${c}</label>`).join('')}</div>`}</div></div></div>
        <div class="frow"><div class="fitem"><label class="req">参与返利的活动</label><div class="fctrl">
          <div class="radio-line">${[['all','全量品种，黑名单除外'],['act','仅指定活动']].map(([v,l])=>`<label><input type="radio" name="scope" value="${v}" ${F.scope===v?'checked':''}> ${l}</label>`).join('')}</div>
          <div class="hint-yellow">客户下单购买店铺的全部或指定范围的活动商品都将参与返利（黑名单品种对应的活动除外）</div>
          ${scopeHtml}
        </div></div></div>
      </div></div>

      <div class="card" id="step3"><div class="card-head"><span class="card-title">返利资金配置</span></div><div class="card-body">
        <div class="fund-row"><div class="lb req">返利总预算</div><div class="fund-body"><div class="inline"><input class="mini-inp" data-f="budget" value="${F.budget}" placeholder="选填，不填即为不限" style="width:170px" ${F.unlimited?'disabled':''}><span class="muted">元</span><label class="inline"><input type="checkbox" data-f="unlimited" ${F.unlimited?'checked':''}> 不限</label></div>
          <div class="help">选填。总预算即本任务返利出资的上限，填写时不得小于10000 元，超出总预算即停止发放；进行中可调高总预算。</div><div id="budgetErr" class="err" style="margin-top:4px">${(!F.unlimited&&F.budget&&+F.budget<10000)?'填写时不得小于 10000 元。':''}</div></div></div>
        <div class="fund-row"><div class="lb">营销服务额度</div><div class="fund-body"><div class="inline"><span class="quota">¥ 2,726.55</span><span class="qmark">?</span><a data-act="buyQuota">购买额度</a><a data-act="quotaLog">查看营销账户流水</a></div>
          <div class="hint-yellow">返利资金默认从营销服务额度中扣减。</div></div></div>
        <div class="fund-row"><div class="lb">余额不足时</div><div class="fund-body">${F.budget&&!F.unlimited?`<div class="grayed"><div class="radio-line"><label><input type="radio" disabled checked> 停止返利</label><label><input type="radio" disabled> 继续返利（结算时扣减）</label></div></div><div class="reason-box">已填写「返利总预算」，返利成本由总预算托底、超出即停止发放，无需再配置本项，该选项不可修改。</div>`:`<div class="radio-line"><label><input type="radio" name="quota" value="停止返利" ${F.quota==='停止返利'?'checked':''}> 停止返利（已发放积分不受影响）</label><label><input type="radio" name="quota" value="继续返利" ${F.quota==='继续返利'?'checked':''}> 继续返利（结算时扣减）</label></div>${F.quota==='继续返利'?`<div class="help" style="margin-top:5px">${terms}</div>`:''}`}</div></div>
        <div class="fund-row"><div class="lb">协议确认</div><div class="fund-body"><label class="agree-line"><input type="checkbox" id="agreeChk" data-f="agree" ${F.agreed?'checked':''} ${F.agreed?'disabled':''}>我已阅读并同意 <a data-act="agreement">《药师帮平台返利活动协议》</a></label></div></div>
      </div></div>

      <div class="form-foot"><div class="btn-group"><button class="btn" data-act="backList">取消</button><button class="btn primary" data-act="save" ${F.agreed?'':'disabled title="请先阅读并同意协议"'}>保存</button></div></div>
     </div>
   </div>`;
  const ph=document.getElementById('pharmaHelp');if(ph&&!F.types.length)ph.innerHTML='<span class="err">至少保留 1 项统计药店类型，否则无法保存。</span>';
  document.querySelectorAll('.step').forEach(s=>s.onclick=()=>{document.querySelectorAll('.step').forEach(x=>x.classList.toggle('on',x===s));document.getElementById('step'+s.dataset.step).scrollIntoView({behavior:'smooth',block:'start'})});
}

/* ============ 屏C 查看数据详情 ============ */
function seriesFor(id){
  const rows=DETAIL[id].rows,map={};
  rows.forEach(r=>{const d=r.time.slice(0,10);map[d]=map[d]||{订单金额:0,返利金额:0,参与订单数:0,参与客户数:new Set()};const m=map[d];m.订单金额+=r.amt;m.返利金额+=r.reb;m.参与订单数++;m.参与客户数.add(r.customer)});
  return Object.keys(map).sort().map(d=>({day:d,订单金额:Math.round(map[d].订单金额*100)/100,返利金额:Math.round(map[d].返利金额*100)/100,参与订单数:map[d].参与订单数,参与客户数:map[d].参与客户数.size}));
}
function renderChart(){
  const s=seriesFor(state.detailId);if(!s.length)return;
  const tab=state.chartTab,W=Math.max(1080,s.length*48),H=240,PL=58,PR=20,PT=16,PB=32;
  const keys=[tab];
  const max=Math.max(...s.flatMap(d=>keys.map(k=>d[k])))*1.12||1;
  const x=i=>PL+i*((W-PL-PR)/Math.max(1,s.length-1)),y=v=>PT+(H-PT-PB)*(1-v/max);
  let svg=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6bff" stop-opacity=".16"/><stop offset="1" stop-color="#2f6bff" stop-opacity="0"/></linearGradient></defs>`;
  [0,.2,.4,.6,.8,1].forEach(r=>{const yy=PT+(H-PT-PB)*r;svg+=`<line x1="${PL}" y1="${yy}" x2="${W-PR}" y2="${yy}" stroke="#e9edf2" stroke-dasharray="4 4"/><text x="${PL-8}" y="${yy+4}" text-anchor="end" font-size="10" fill="#a5aebc">${((1-r)*max).toFixed(tab==='金额数据'?0:0)}</text>`});
  const colors={'订单金额':'#2f6bff','返利金额':'#17a673','参与订单数':'#2f6bff','参与客户数':'#17a673'};
  keys.forEach(k=>{
    const pts=s.map((d,i)=>[x(i),y(d[k])]),line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    if(k==='订单金额')svg+=`<path d="${line} L ${pts[pts.length-1][0].toFixed(1)} ${H-PB} L ${pts[0][0].toFixed(1)} ${H-PB} Z" fill="url(#ag)"/>`;
    svg+=`<path d="${line}" fill="none" stroke="${colors[k]}" stroke-width="2.2"/>`;
    svg+=pts.map((p,i)=>`<circle class="cdot" cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff" stroke="${colors[k]}" stroke-width="2" data-k="${k}" data-d="${s[i].day}" data-v="${s[i][k]}"/>`).join('');
  });
  svg+=s.map((d,i)=>`<text x="${x(i)}" y="${H-10}" text-anchor="middle" font-size="10" fill="#a5aebc">${d.day.slice(5)}</text>`).join('')+'</svg>';
  const w=document.getElementById('chartWrap');if(!w)return;w.innerHTML=svg;
  w.querySelectorAll('.cdot').forEach(c=>{c.addEventListener('mouseenter',()=>{const t=document.getElementById('chartTip');t.style.display='block';t.innerHTML=`${c.dataset.d}<br>${c.dataset.k}：<b>${c.dataset.k.includes('金额')?'¥'+cents(c.dataset.v):c.dataset.v}</b>`});c.addEventListener('mousemove',e=>{const t=document.getElementById('chartTip');t.style.left=(e.clientX+14)+'px';t.style.top=(e.clientY-10)+'px'});c.addEventListener('mouseleave',()=>document.getElementById('chartTip').style.display='none')});
}
function renderDetail(){
  const t=TASKS.find(x=>x.id===state.detailId)||TASKS[0];state.detailId=t.id;const d=DETAIL[t.id],f=state.detailFilter;
  const filtered=d.rows.filter(r=>(!f.no||r.order.includes(f.no))&&(!f.cust||r.customer.includes(f.cust))&&(!f.type||r.type===f.type));
  const pages=Math.max(1,Math.ceil(filtered.length/state.pageSize));
  if(state.detailPage>pages)state.detailPage=pages;
  const rows=filtered.slice((state.detailPage-1)*state.pageSize,state.detailPage*state.pageSize);
  document.getElementById('detailRoot').innerHTML=`
   <div class="crumb"><a data-act="backList">营销</a> / <a data-act="backList">积分返利</a> / <span>查看数据详情</span></div>
   <div class="detail-head"><a class="back" data-act="backList">← 返回</a><h2>查看数据详情</h2><span class="tag ${t.mode==='按比例返'?'blue':'green'}">${t.title.includes('活动')?'返利活动':'返利任务'}</span>
     <div class="obj-meta"><span>ID：${t.id}</span><span>${t.title}</span><span>${modeTag(t.mode)}</span><span>${statusTag(t.status)}</span><span>${t.start} 至 ${t.end}</span></div></div>
   ${t.status==='已终止'?`<div class="banner" style="background:#fdecec;border-color:#f7caca;color:#b84444">该任务已被平台终止，历史数据照常展示、只读、不再新增。原因：${t.reason||'该任务已被平台终止'}</div>`:''}
   <div class="sec-title"><b>核心数据</b><span>整点更新（每小时刷新一次，非实时）</span></div>
   <div class="metrics">
     <div class="metric"><div class="ml">订单金额 <span class="qmark">?</span></div><div class="mv orange">${cents(d.sum)}</div></div>
     <div class="metric"><div class="ml">返利金额 <span class="qmark">?</span></div><div class="mv orange">${cents(d.reb)}</div></div>
     <div class="metric"><div class="ml">参与客户数 <span class="qmark">?</span></div><div class="mv">${d.customers}</div></div>
     <div class="metric"><div class="ml">参与订单数 <span class="qmark">?</span></div><div class="mv">${d.rows.length}</div></div>
     <div class="metric"><div class="ml">返利比例 <span class="qmark">?</span></div><div class="mv">${(d.reb/d.sum*100).toFixed(2)}%</div></div>
   </div>
   <div class="card"><div class="card-body" style="padding:0 18px 16px">
     <div class="chart-tabs">${['订单金额','返利金额','参与订单数','参与客户数'].map(c=>`<div class="ctab ${state.chartTab===c?'on':''}" data-act="ctab" data-id="${c}">${c}</div>`).join('')}</div>
     <div class="legend">${[state.chartTab].map((k,i)=>`<span><i style="background:${i===0?'#2f6bff':'#17a673'}"></i>${k}</span>`).join('')}</div>
     <div class="chart-wrap" id="chartWrap"></div>
     <div class="help">粒度固定按天、全周期不降级；长周期可横向滚动。</div>
   </div></div>
   <div class="card"><div class="card-head"><span class="card-title">返利明细</span><button class="btn sm" data-act="exportDetail" style="margin-left:auto">导出</button></div>
     <div class="card-body" style="padding-bottom:8px"><div class="filter-bar">
       <div class="field"><label>订单号</label><input class="inp" id="dfNo" placeholder="请输入" style="width:150px" value="${f.no||''}"></div>
       <div class="field"><label>客户名称</label><input class="inp" id="dfCust" placeholder="请输入" style="width:150px" value="${f.cust||''}"></div>
       <div class="field"><label>统计药店类型</label><select class="inp" id="dfType" style="width:170px"><option value="">全部</option>${PHARMA.map(p=>`<option ${f.type===p?'selected':''}>${p}</option>`).join('')}</select></div>
       <button class="btn primary" data-act="detailSearch">搜索</button>
     </div></div>
     <div class="table-wrap"><table><thead><tr><th>订单号</th><th>客户名称</th><th>统计药店类型</th><th style="text-align:right">订单金额</th><th style="text-align:right">返利金额</th><th>发放时间</th></tr></thead><tbody>
       ${rows.length?rows.map(r=>`<tr><td style="font-family:monospace;font-size:12px">${r.order}</td><td>${r.customer}</td><td>${r.type}</td><td style="text-align:right">${cents(r.amt)}</td><td style="text-align:right;color:#1a8f68">${cents(r.reb)}</td><td class="muted">${r.time}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">暂无符合条件的返利明细</div></td></tr>'}
     </tbody></table></div><div class="pager"><span>总共 ${filtered.length} 条数据</span>${(()=>{let h=`<button class="pg" ${state.detailPage===1?'disabled':''} data-act="detailPage" data-id="${state.detailPage-1}">‹</button>`;for(let i=1;i<=pages;i++)h+=`<button class="pg ${i===state.detailPage?'on':''}" data-act="detailPage" data-id="${i}">${i}</button>`;return h+`<button class="pg" ${state.detailPage===pages?'disabled':''} data-act="detailPage" data-id="${state.detailPage+1}">›</button>`})()}<select class="inp" id="detailPageSize" style="height:28px;width:70px"><option ${state.pageSize===10?'selected':''}>10</option><option ${state.pageSize===5?'selected':''}>5</option><option ${state.pageSize===20?'selected':''}>20</option></select><span>条/页</span></div></div>`;
  const dps=document.getElementById('detailPageSize');if(dps)dps.onchange=e=>{state.pageSize=+e.target.value;state.detailPage=1;renderDetail()};
  renderChart();
}

/* ============ 屏B / 平台侧 ============ */
function renderB(){
  if(document.getElementById('bRoot').innerHTML)return;
  document.getElementById('bRoot').innerHTML=`<div class="banner">本屏对应子需求 04「上架单个返利活动」，一期不建任务、不排期。以下为二期交互预览。</div>
   <div class="card"><div class="card-head"><span class="card-title">活动基础信息</span></div><div class="card-body">
     <div class="frow"><div class="fitem"><label class="req">上架端口</label><div class="fctrl radio-line">${['拼团上架','返利活动（新增）','普通上架'].map((x,i)=>`<label><input type="radio" name="port" ${i===1?'checked':''}> ${x}</label>`).join('')}</div></div></div>
     <div class="frow"><div class="fitem"><label class="req">活动名称</label><div class="fctrl"><input class="inp" placeholder="请输入" style="width:320px"></div></div></div>
     <div class="frow"><div class="fitem"><label>批量导入商品</label><div class="fctrl"><button class="btn sm">导入文件</button><button class="btn sm text">模板下载</button></div></div></div>
   </div></div>
   <div class="card"><div class="card-head"><span class="card-title">返利设置</span><span class="help">屏 B 手工填写返利比例</span></div><div class="card-body">
     <div class="frow"><div class="fitem"><label class="req">返利比例</label><div class="fctrl inline"><input class="mini-inp" value="2.00"><span class="muted">%</span><span class="help">100 积分 = 1 元</span></div></div></div>
     <div class="fund-row"><div class="lb">营销服务额度</div><div class="fund-body"><span class="quota">¥ 2,726.55</span> <a data-act="buyQuota">购买额度</a> <a data-act="quotaLog">查看营销账户流水</a></div></div>
     <div class="fund-row"><div class="lb">协议确认</div><div class="fund-body"><label class="agree-line"><input type="checkbox"> 我已阅读并同意 <a data-act="agreement">《药师帮平台返利活动协议》</a></label></div></div>
   </div></div>
   <div class="card"><div class="form-foot"><div class="btn-group"><button class="btn">取消</button><button class="btn primary" data-act="phase2Save">保存（二期预览）</button></div></div></div>`;
}
function renderAdmin(){
  document.getElementById('adminRoot').innerHTML=`
   <div class="card"><div class="card-head"><span class="card-title">准入与开关配置</span><span class="help">总后台视角 · 商家侧不可见</span></div><div class="card-body">
     <div class="frow"><div class="fitem"><label>商家开关</label><div class="fctrl inline"><label><input type="radio" name="admit" value="custom" checked> 指定供应商可见</label><input class="mini-inp" id="admitIds" value="498,781" style="width:150px"><label><input type="radio" name="admit" value="0"> 0 全部可见</label><label><input type="radio" name="admit" value="-1"> -1 全部不可见</label></div></div></div>
     <div class="frow"><div class="fitem"><label>余额不足切换阈值</label><div class="fctrl inline"><input class="mini-inp" id="thresh" value="100"><span class="muted">元（平台配置，非硬编码）</span></div></div></div>
     <button class="btn primary" data-act="saveAdmit">保存配置</button>
   </div></div>
   <div class="card"><div class="card-head"><span class="card-title">返利活动管理</span><span class="help">可查看全部商家任务，强制终止违规任务</span></div>
     <div class="table-wrap"><table><thead><tr><th>任务ID</th><th>任务标题</th><th>商家</th><th>返利模式</th><th>状态</th><th>返利金额</th><th>操作</th></tr></thead><tbody>
     ${TASKS.map(t=>`<tr><td>${t.id}</td><td>${t.title}</td><td>供应商 498 · 康佰医药</td><td>${modeTag(t.mode)}</td><td>${statusTag(t.status)}</td><td>¥${cents(DETAIL[t.id].reb)}</td><td>${t.status==='已终止'?'<span class="muted">终态 · 不可恢复</span>':`<button class="btn sm danger" data-act="terminate" data-id="${t.id}">强制终止</button>`}</td></tr>`).join('')}
     </tbody></table></div></div>`;
}
function openAgreement(){
  openModal(`<div class="modal-head"><h3>《药师帮平台返利活动协议》</h3><button class="x" data-close-modal>×</button></div>
   <div class="modal-body"><div class="agreement-text" id="agreementText">
    <h4>一、服务说明</h4><p>本协议由药师帮平台与入驻供应商就使用「积分返利」工具向采购客户发放返利积分事宜订立。商家在现有商品上叠加返利规则，不改变商品挂网价；客户采购达成约定条件后，由平台按规则向客户账户发放积分。</p>
    <h4>二、返利规则与积分口径</h4><p>积分返利支持按比例返、累计金额满返、累计 SKU 数满返三种类型；满返最多四档，达到的每个档位都会发放、各档积分逐档累加。积分按整数倍向下取整发放，100 积分价值 1 元。任务创建后免审核、按计划时间生效；任务类型与返利设置创建后不可修改，如需变更须终止原任务并新建。</p>
    <h4>三、出资与结算</h4><p>返利所需资金由商家全额出资，平台代发代结，优先从商家营销服务额度扣减。商家可设置返利总预算作为出资上限，达到上限即停止发放，已发放积分不受影响。当营销服务额度少于平台配置阈值（默认 100 元）且商家选择「继续返利」时，超出部分直接计入商家结算账单科目，在结算时从商家结算款中扣减。</p>
    <p>订单退款时按退款后金额与当前配置重新计算应发积分，应发少于已发的差额予以扣回；商家账单按退款后口径冲减一次，后续抵扣回收款归平台所有，不向商家二次计费、亦不退费。因扣回导致客户积分余额不足时允许扣成负值，不冻结账户、不阻塞参与其他任务。</p>
    <h4>四、积分有效期与过期处理</h4><p>返利积分接入平台既有积分有效期链路，按发放批次计效期（返利来源积分默认规则为 12 个月）。有效期届满未兑换的返利积分不退回商家、不冲减商家成本，统一沉淀为平台兜底池，可跨商家、跨任务调剂。</p>
    <h4>五、受众与合规</h4><p>商家应确保统计药店类型、客户白名单/黑名单、参与返利活动范围配置真实准确；同时命中白名单与黑名单时黑名单优先。商家不得利用返利任务进行虚假交易、价格欺诈等违规行为，平台有权强制终止违规任务；终止前已支付成功的订单仍正常发放，已发放积分不追回。</p>
    <h4>六、数据与审计</h4><p>商家可查看本供应商任务的效果数据，核心指标每小时更新、明细实时查询。导出行为由平台记录审计日志（导出人、时间、筛选条件、条数、文件标识），商家侧不展示。本协议按供应商 + 协议版本记录同意结果，版本变更后需重新确认。</p>
   </div><div class="scroll-tip" id="scrollTip">↓ 请滑动阅读至底部后即可同意</div></div>
   <div class="modal-foot"><button class="btn" data-close-modal>取消</button><button class="btn primary" id="agreeBtn" disabled>滑动阅读完整协议并同意</button></div>`,true);
  const txt=document.getElementById('agreementText'),btn=document.getElementById('agreeBtn'),tip=document.getElementById('scrollTip');
  const scroller=txt.parentElement; // .modal-body 才是滚动容器
  scroller.addEventListener('scroll',()=>{if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-4){btn.disabled=false;tip.textContent='✓ 已阅读完整协议，可点击同意'}});
  btn.onclick=()=>{state.agreed=true;if(state.form)state.form.agreed=true;closeModal();renderForm();toast('协议已签署，保存按钮已解锁')};
}

/* ============ 交互分发 ============ */
function handleAct(act,id){
  const F=state.form;
  switch(act){
    case 'create':openForm(null,'create');break;
    case 'edit':{const t=TASKS.find(x=>x.id===id);if(t)openForm(t,'edit');break}
    case 'copy':{const t=TASKS.find(x=>x.id===id);if(t){openForm(t,'copy');toast('已复制任务配置（时间除外）')}break}
    case 'backList':go('s0');break;
    case 'search':state.filter={id:document.getElementById('fId').value.trim(),name:document.getElementById('fName').value.trim(),status:document.getElementById('fStatus').value};state.page=1;renderList();break;
    case 'reset':['fId','fName','fStatus'].forEach(x=>document.getElementById(x).value='');state.filter={};state.page=1;renderList();break;
    case 'page':state.page=+id;renderList();break;
    case 'detail':state.detailId=id;state.chartTab='订单金额';state.detailFilter={};state.detailPage=1;go('sC');break;
    case 'detailSearch':state.detailFilter={no:document.getElementById('dfNo').value.trim(),cust:document.getElementById('dfCust').value.trim(),type:document.getElementById('dfType').value};state.detailPage=1;renderDetail();break;
    case 'detailPage':state.detailPage=+id;renderDetail();break;
    case 'ctab':state.chartTab=id;renderDetail();break;
    case 'exportList':{const f=state.filter;const n=TASKS.filter(t=>(!f.id||t.id===f.id)&&(!f.name||t.title.includes(f.name))&&(!f.status||t.status===f.status)).length;toast('导出任务已创建，共 '+n+' 条（当前筛选结果）；审计日志已记录导出人 / 时间 / 筛选条件 / 条数 / 文件标识（商家侧不可见）');break}
    case 'exportDetail':{const f=state.detailFilter;const t=TASKS.find(x=>x.id===state.detailId)||TASKS[0];const n=DETAIL[t.id].rows.filter(r=>(!f.no||r.order.includes(f.no))&&(!f.cust||r.customer.includes(f.cust))&&(!f.type||r.type===f.type)).length;toast('明细导出任务已创建，共 '+n+' 条（当前筛选结果）；审计日志已记录导出人 / 时间 / 筛选条件 / 条数 / 文件标识');break}
    case 'logs':{const l=logs[id]||[];openModal(`<div class="modal-head"><h3>修改记录 · ${id}</h3><button class="x" data-close-modal>×</button></div><div class="modal-body">${l.map(x=>`<div class="log-item"><div class="lt">操作时间：${x.time}</div><div class="lh">${x.title} <span class="muted" style="font-weight:400">· 操作人：${x.who}</span></div><div class="lb">${x.desc}</div>${x.changes&&x.changes.length?`<table style="margin-top:6px;width:100%;font-size:12px;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:4px 6px;background:#f7f9fc">变更项</th><th style="text-align:left;padding:4px 6px;background:#f7f9fc">修改前</th><th style="text-align:left;padding:4px 6px;background:#f7f9fc">修改后</th></tr></thead><tbody>${x.changes.map(c=>`<tr><td style="padding:4px 6px;border-bottom:1px solid #eef1f5">${c.k}</td><td style="padding:4px 6px;border-bottom:1px solid #eef1f5;color:#9aa3b0">${c.b}</td><td style="padding:4px 6px;border-bottom:1px solid #eef1f5;color:#1a8f68">${c.a}</td></tr>`).join('')}</tbody></table>`:''}</div>`).join('')}</div><div class="modal-foot"><button class="btn" data-close-modal>关闭</button></div>`);break}
    case 'addTier':if(F.tiers.length<4){F.tiers.push({amount:'',points:''});renderForm()}break;
    case 'delTier':F.tiers.splice(+id,1);renderForm();break;
    case 'checkAllAct':F.actTypes=F.actTypes.length===ACTS.length?[]:[...ACTS];renderForm();break;
    case 'tmpl':toast('模板已生成下载（Demo 模拟）');break;
    case 'upload':F[id]=!F[id];renderForm();toast(F[id]?'已选择组织（Demo 模拟）':'已取消选择');break;
    case 'import':openModal(`<div class="modal-head"><h3>批量导入${id==='sku'?'品种':'活动'}</h3><button class="x" data-close-modal>×</button></div><div class="modal-body"><div class="filter-bar" style="margin-bottom:10px"><input class="inp" id="impSearch" placeholder="按 ID / 名称搜索" style="width:300px"></div><div id="impList">${['阿莫西林胶囊 0.25g','维生素C片 100mg','布洛芬缓释胶囊','苯磺酸氨氯地平片','感冒灵颗粒'].map((n,i)=>`<label style="display:flex;gap:8px;padding:8px;border-bottom:1px solid #f0f2f6;align-items:center"><input type="checkbox" class="impChk" value="${n}" data-aid="${id==='sku'?'SPU':'HD'}2026${String(1000+i)}"><span class="muted">${id==='sku'?'SPU':'HD'}2026${String(1000+i)}</span> ${n}</label>`).join('')}</div></div><div class="modal-foot"><button class="btn" data-close-modal>取消</button><button class="btn primary" id="impConfirm">确认导入</button></div>`);
      document.getElementById('impConfirm').onclick=()=>{const sel=[...document.querySelectorAll('.impChk:checked')];if(id==='act'){F.actItems=[...(F.actItems||[]),...sel.map(x=>({id:x.dataset.aid,name:x.value,vendor:'康佰医药',spec:'0.25g × 24粒/盒'}))]}
        F.imported=[...new Set([...(F.imported||[]),...sel.map(x=>x.value)])];closeModal();renderForm();toast('已导入 '+sel.length+' 条'+(id==='act'?'（归属校验通过）':''))};
      document.getElementById('impSearch').oninput=e=>{const v=e.target.value;document.querySelectorAll('#impList label').forEach(l=>l.style.display=l.textContent.includes(v)?'flex':'none')};break;
    case 'viewImported':{const items=F.actItems||[];
      openModal(`<div class="modal-head"><h3>查看已导入的活动信息（${items.length}）</h3><button class="x" data-close-modal>×</button></div><div class="modal-body"><div class="filter-bar" style="margin-bottom:10px"><input class="inp" id="actImpSearch" placeholder="按活动 id / 活动名称搜索" style="width:320px"></div><div class="table-wrap"><table><thead><tr><th>活动id</th><th>活动名称</th><th>厂家</th><th>规格·包装</th><th>操作</th></tr></thead><tbody id="actImpBody">${items.length?items.map((a,i)=>`<tr data-txt="${a.id} ${a.name}"><td style="font-family:monospace;font-size:12px">${a.id}</td><td>${a.name}</td><td>${a.vendor||'康佰医药'}</td><td>${a.spec||'0.25g × 24粒/盒'}</td><td><a data-act="editAct" data-id="${i}">编辑</a> <a data-act="delAct" data-id="${i}">删除</a></td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">暂未导入活动</div></td></tr>'}</tbody></table></div></div><div class="modal-foot"><button class="btn" data-close-modal>关闭</button></div>`,true);
      document.getElementById('actImpSearch').oninput=e=>{const v=e.target.value.trim();document.querySelectorAll('#actImpBody tr').forEach(tr=>{if(!tr.dataset.txt)return;tr.style.display=!v||tr.dataset.txt.includes(v)?'':'none'})};break}
    case 'editAct':{const a=(F.actItems||[])[+id];if(!a)break;openModal(`<div class="modal-head"><h3>编辑已导入活动</h3><button class="x" data-close-modal>×</button></div><div class="modal-body"><div class="frow"><div class="fitem"><label>活动id</label><div class="fctrl"><input class="inp" id="eaId" value="${a.id}" style="width:280px"></div></div></div><div class="frow"><div class="fitem"><label>活动名称</label><div class="fctrl"><input class="inp" id="eaName" value="${a.name}" style="width:280px"></div></div></div><div class="frow"><div class="fitem"><label>厂家</label><div class="fctrl"><input class="inp" id="eaVendor" value="${a.vendor||'康佰医药'}" style="width:280px"></div></div></div><div class="frow"><div class="fitem"><label>规格·包装</label><div class="fctrl"><input class="inp" id="eaSpec" value="${a.spec||'0.25g × 24粒/盒'}" style="width:280px"></div></div></div></div><div class="modal-foot"><button class="btn" data-close-modal>取消</button><button class="btn primary" id="eaSave">保存</button></div>`);document.getElementById('eaSave').onclick=()=>{a.id=document.getElementById('eaId').value.trim()||a.id;a.name=document.getElementById('eaName').value.trim()||a.name;a.vendor=document.getElementById('eaVendor').value.trim();a.spec=document.getElementById('eaSpec').value.trim();closeModal();renderForm();toast('活动信息已更新')};break}
    case 'delAct':if((F.actItems||[])[+id]){F.actItems.splice(+id,1);renderForm();toast('已删除 1 条活动')}break;
    case 'agreement':openAgreement();break;
    case 'buyQuota':toast('跳转购买营销服务额度页（Demo 模拟）');break;
    case 'quotaLog':openModal(`<div class="modal-head"><h3>营销账户流水</h3><button class="x" data-close-modal>×</button></div><div class="modal-body"><table><thead><tr><th>时间</th><th>业务类型</th><th>来源</th><th style="text-align:right">变动金额</th><th style="text-align:right">余额</th></tr></thead><tbody><tr><td>2026-11-22 18:20</td><td><span class="tag green">返利退款</span></td><td>返利任务 414</td><td style="text-align:right;color:#1a8f68">+160.00</td><td style="text-align:right">2,726.55</td></tr><tr><td>2026-11-22 14:03</td><td><span class="tag blue">返利支出</span></td><td>返利任务 414</td><td style="text-align:right;color:#c25656">-200.00</td><td style="text-align:right">2,566.55</td></tr></tbody></table></div><div class="modal-foot"><button class="btn" data-close-modal>关闭</button></div>`);break;
    case 'save':{
      if(!F.agreed){toast('请先阅读并同意协议',true);return}
      if(!F.title.trim()){toast('请填写计划标题',true);return}
      if(!F.types.length){toast('至少保留 1 项统计药店类型',true);return}
      if(F.mode!=='edit'&&+new Date(F.start)<now){toast('开始时间不得早于当前时间',true);return}
      if(+new Date(F.end)<=now){toast('结束时间不得早于当前时间',true);return}
      if(F.taskType!=='按比例返'){const ks=F.tiers.map(t=>+t.amount||0);if(ks.some(k=>k<=0)||ks.some((k,i)=>i>0&&k<=ks[i-1])){toast('档位值须大于 0 且递增、不重复',true);return}}
      else if(+F.perX<=0||+F.perY<=0){toast('每满金额与返积分均须大于 0',true);return}
      if(F.budget&&!F.unlimited&&+F.budget<10000){toast('填写时不得小于 10000 元',true);return}
      if(F.budget&&!F.unlimited&&+F.budget>2726.55){toast('您目前的营销服务额度小于总预算，请及时购买额度',true);return}
      if(F.mode==='edit'){
        const t=TASKS.find(x=>x.id===state.currentId);
        if(t&&F.budget&&!F.unlimited&&t.budget&&+F.budget<+t.budget){toast('进行中任务仅可上调返利总预算，不可下调',true);return}
        if(t){const fmtTypes=v=>(v||[]).join('、')||'未选择',fmtScope=v=>v==='all'?'全量品种，黑名单除外':'仅指定活动';
          const ov={title:t.title,end:t.end,budget:t.budget||'不限',quota:t.quota,white:t.white?'已上传':'未上传',black:t.black?'已上传':'未上传',types:fmtTypes(t.types||PHARMA),cycle:t.cycle||'整个活动周期',scope:fmtScope(t.scope||'all')};
          const ch=[{k:'计划标题',b:ov.title,a:F.title},{k:'结束时间',b:ov.end,a:F.end.replace('T',' ')+':00'},{k:'统计药店类型',b:ov.types,a:fmtTypes(F.types)},{k:'统计周期',b:ov.cycle,a:F.cycle},{k:'参与返利的活动',b:ov.scope,a:fmtScope(F.scope)},{k:'返利总预算',b:ov.budget,a:F.unlimited?'不限':F.budget},{k:'余额不足时',b:ov.quota,a:F.quota},{k:'客户白名单',b:ov.white,a:F.white?'已上传':'未上传'},{k:'客户黑名单',b:ov.black,a:F.black?'已上传':'未上传'}].filter(c=>c.b!==c.a);
          t.title=F.title;t.end=F.end.replace('T',' ')+':00';t.types=[...F.types];t.cycle=F.cycle;t.scope=F.scope;t.actTypes=[...(F.actTypes||[])];t.imported=[...(F.imported||[])];t.actItems=[...(F.actItems||[])];t.budget=F.unlimited?'':F.budget;t.quota=F.quota;t.white=F.white;t.black=F.black;
          logs[t.id].push({time:now.toLocaleString('zh-CN',{hour12:false}),who:'yuanyihaosun（商家）',title:'编辑任务',desc:'修改计划标题、结束时间、药店配置、采购要求配置与资金配置',changes:ch})}
        toast('修改已保存，按计划时间继续生效');
      }else{
        const id=String(Math.max(...TASKS.map(t=>+t.id))+1),start=F.start.replace('T',' ')+':00',end=F.end.replace('T',' ')+':00';
        const st=new Date(start)<=now?(new Date(end)>now?'进行中':'已结束'):'未开始';
        const t={id,title:F.title,mode:F.taskType,status:st,start,end,created:now.toLocaleString('zh-CN',{hour12:false}),scale:.5,budget:F.unlimited?'':F.budget,quota:F.quota,white:F.white,black:F.black,cycle:F.cycle};
        TASKS.unshift(t);DETAIL[id]=makeDetails(t);logs[id]=[{time:t.created,who:'yuanyihaosun（商家）',title:'创建任务',desc:'创建积分返利任务，免审核保存生效'}];
        toast('保存成功，任务免审核'+(st==='进行中'?'并立即生效':'，将按计划时间生效'));
      }
      go('s0');break;
    }
    case 'saveAdmit':toast('准入开关与阈值配置已保存（Demo 模拟）');break;
    case 'terminate':{const t=TASKS.find(x=>x.id===id);
      openModal(`<div class="modal-head"><h3>强制终止任务</h3><button class="x" data-close-modal>×</button></div><div class="modal-body"><div class="banner" style="background:#fdecec;border-color:#f7caca;color:#b84444">终止为终态、不可恢复。生效前已支付订单仍正常发放，已发积分不追回。</div><div class="inline"><span class="muted" style="width:70px;text-align:right">终止原因</span><input class="inp" id="termReason" placeholder="选填；留空展示兜底文案" style="width:360px"></div></div><div class="modal-foot"><button class="btn" data-close-modal>取消</button><button class="btn danger" id="termConfirm">确认终止</button></div>`);
      document.getElementById('termConfirm').onclick=()=>{const r=document.getElementById('termReason').value.trim();t.status='已终止';t.reason=r;logs[t.id].push({time:now.toLocaleString('zh-CN',{hour12:false}),who:'平台运营（总后台）',title:'强制终止任务',desc:'原因：'+(r||'未填，商家侧展示兜底文案')});closeModal();renderAdmin();toast('任务已终止，商家侧编辑置灰、历史数据只读')};break}
    case 'phase2Save':toast('屏 B 为二期预览，本期不建任务、不排期');break;
  }
}
document.addEventListener('input',e=>{
  const t=e.target,F=state.form;if(!F)return;const k=t.dataset.f;if(!k)return;
  if(k==='title'){F.title=t.value;const c=t.parentElement.querySelector('.counter');if(c)c.textContent=F.title.length+'/30'}
  else if(['start','end','budget','perX','perY'].includes(k))F[k]=t.value;
  else if(k==='unlimited'){F.unlimited=t.checked;renderForm()}
  else if(k==='pharma'){F.types=[...document.querySelectorAll('[data-f="pharma"]:checked')].map(x=>x.value);const h=document.getElementById('pharmaHelp');if(h)h.innerHTML=F.types.length?'默认全选，至少保留 1 项；与平台「药店类型」字典一致。':'<span class="err">至少保留 1 项统计药店类型，否则无法保存。</span>';return}
  else if(k==='actType'){F.actTypes=[...document.querySelectorAll('[data-f="actType"]:checked')].map(x=>x.value);return}
  else if(k.startsWith('tier-')){const[,i,p]=k.split('-');F.tiers[+i][p==='k'?'amount':'points']=t.value}
  else if(k==='agree')F.agreed=t.checked;
  if(k==='budget'){const be=document.getElementById('budgetErr');if(be)be.textContent=(!F.unlimited&&F.budget&&+F.budget<10000)?'填写时不得小于 10000 元。':''}
  if(k.startsWith('tier-')){
    // 实时刷新累计共返链路（断链显示「—」）
    const chain=tierChain(F.tiers);
    document.querySelectorAll('.tier').forEach((row,idx)=>{const c=row.querySelector('.calc b');if(c&&idx>0)c.textContent=chain[idx].total});
  }
  if(['perX','perY'].includes(k)){
    // 只更新比例文案与红字，避免整表单重绘导致输入框失焦
    const box=t.closest('.inline'),el=box&&box.querySelector('.calc');
    if(el){const ok=(+F.perX>0&&+F.perY>0);const r=ok?(+F.perY/100/+F.perX*100).toFixed(2):'—';
      el.innerHTML=ok?`ⓘ 返利比例 <b>${r}%</b>（100积分价值1元）`:'ⓘ 返利比例 —';}
    const errEl=document.getElementById('ratioErr');
    if(errEl)errEl.textContent=(+F.perX<=0||+F.perY<=0)?'每满金额需大于 0，返积分需大于 0。':'';
  }
});
document.addEventListener('change',e=>{
  const t=e.target,F=state.form;if(!F)return;
  if(t.name==='taskType'){F.taskType=t.value;renderForm()}
  if(t.name==='cycle'){F.cycle=t.value}
  if(t.name==='scope'){F.scope=t.value;renderForm()}
  if(t.name==='quota'){F.quota=t.value;renderForm()}
});

renderShell();renderList();renderB();
