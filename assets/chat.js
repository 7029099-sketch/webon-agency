(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
#wa-chat-launch{position:fixed;bottom:22px;right:22px;z-index:99990;border:0;border-radius:100px;background:#1776f2;color:white;padding:14px 20px;font:700 15px system-ui;box-shadow:0 10px 28px #0007;cursor:pointer}
#wa-chat-panel{position:fixed;right:18px;bottom:82px;z-index:99991;width:min(380px,calc(100vw - 36px));height:min(550px,calc(100dvh - 112px));background:#071522;color:#fff;border:1px solid #235071;border-radius:19px;box-shadow:0 16px 70px #0009;display:flex;flex-direction:column;overflow:hidden;font:14px system-ui}
#wa-chat-panel[hidden],#wa-chat-launch[hidden]{display:none!important}
#wa-chat-head{display:flex;align-items:center;justify-content:space-between;padding:16px;background:#10263b;font-weight:700}
#wa-chat-head button{color:white;background:transparent;border:0;font-size:24px;cursor:pointer}
#wa-chat-messages{overflow:auto;flex:1;padding:15px;display:flex;flex-direction:column;gap:10px}
.wa-chat-msg{max-width:88%;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;border-radius:12px;background:#183149}
.wa-chat-msg.agent{align-self:flex-start;background:#23455d}
.wa-chat-msg.visitor{align-self:flex-end;background:#1259a7}
#wa-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #29445d}
#wa-chat-text{min-width:0;flex:1;border:1px solid #46637e;background:#0c2031;color:white;border-radius:10px;padding:11px;font:14px system-ui}
#wa-chat-send{background:#1987f4;border:0;border-radius:10px;color:white;font-weight:700;padding:0 16px;cursor:pointer}
#wa-chat-status{min-height:18px;padding:0 13px 8px;font-size:12px;color:#b9cbdc}
`;
document.head.appendChild(style);
const launch=document.createElement('button');launch.id='wa-chat-launch';launch.type='button';launch.textContent='Chat with us';launch.hidden=true;
const panel=document.createElement('section');panel.id='wa-chat-panel';panel.hidden=true;panel.setAttribute('aria-label','Chat with WebON');
panel.innerHTML='<div id="wa-chat-head"><span>WebON · Live chat</span><button type="button" aria-label="Close chat">×</button></div><div id="wa-chat-messages" aria-live="polite"></div><form id="wa-chat-form"><input id="wa-chat-text" type="text" maxlength="2000" autocomplete="off" placeholder="Write a message..." required><button id="wa-chat-send" type="submit">Send</button></form><div id="wa-chat-status">We reply here. You can keep this tab open.</div>';
document.body.append(launch,panel);
let session='';try{session=sessionStorage.getItem('wa_chat_session')||''}catch(_){}
let opened=false,busy=false;
const messages=panel.querySelector('#wa-chat-messages'),status=panel.querySelector('#wa-chat-status');
function paint(items){messages.replaceChildren();for(const item of items){const el=document.createElement('div');el.className='wa-chat-msg '+(item.from==='agent'?'agent':'visitor');el.textContent=item.text||'';messages.appendChild(el)}messages.scrollTop=messages.scrollHeight}
async function poll(){if(!opened||!session||busy)return;try{const r=await fetch('/chat-api.php?messages=1&session='+encodeURIComponent(session),{cache:'no-store'});const d=await r.json();if(r.ok&&d.ok&&Array.isArray(d.messages))paint(d.messages)}catch(_){}}
fetch('/chat-api.php',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.ready===true){launch.hidden=false;poll()}}).catch(()=>{});
launch.addEventListener('click',()=>{opened=!opened;panel.hidden=!opened;launch.setAttribute('aria-expanded',String(opened));if(opened){panel.querySelector('#wa-chat-text').focus();poll()}});
panel.querySelector('#wa-chat-head button').addEventListener('click',()=>{opened=false;panel.hidden=true;launch.setAttribute('aria-expanded','false')});
panel.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const input=panel.querySelector('#wa-chat-text'),value=input.value.trim();if(!value)return;busy=true;panel.querySelector('#wa-chat-send').disabled=true;status.textContent='Sending...';try{const r=await fetch('/chat-api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session,message:value,website:''})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Delivery failed');session=d.session;try{sessionStorage.setItem('wa_chat_session',session)}catch(_){}input.value='';paint(d.messages||[]);status.textContent='Sent. We will reply here.'}catch(err){status.textContent=err.message||'Could not send. Please try again.'}finally{busy=false;panel.querySelector('#wa-chat-send').disabled=false}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
setInterval(poll,5000);
})();