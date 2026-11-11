/* WebON Agency only. Consent-gated Microsoft Clarity; no tracking before opt-in. */
(() => {
  'use strict';
  if (window.__webonAgencyClarityConsentInitialized) return;
  window.__webonAgencyClarityConsentInitialized = true;
  if (!/^(?:www\.)?webon\.agency$/i.test(location.hostname)) return;
  const KEY = 'webon-agency-clarity-choice-v1';
  const ID = 'zbzsi4k1by';
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
  const words = {
    ru: {message:'Разрешить аналитику взаимодействий и записи сеансов Microsoft Clarity? Это помогает улучшать сайт. Вы можете отказаться.', policy:'Политика конфиденциальности',yes:'Разрешить',no:'Отказаться',label:'Настройки аналитики'},
    uk: {message:'Дозволити аналітику взаємодій і записи сеансів Microsoft Clarity? Це допомагає покращувати сайт. Ви можете відмовитись.', policy:'Політика конфіденційності',yes:'Дозволити',no:'Відмовитись',label:'Налаштування аналітики'},
    en: {message:'Allow Microsoft Clarity interaction analytics and session recordings? This helps improve the site. You can decline.',policy:'Privacy policy',yes:'Allow',no:'Decline',label:'Analytics preferences'}
  };
  const lang = 'en';
  const copy = words[lang] || words.ru;
  const policy = lang === 'uk' ? '/uk/privacy.html' : lang === 'en' ? '/en/privacy.html' : '/privacy.html';
  function read() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
  function write(value) { try { localStorage.setItem(KEY, value); } catch (_) {} }
  function load() {
    if (window.__webonAgencyClarityLoaded) return;
    window.__webonAgencyClarityLoaded = true;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script',ID);
    window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});
  }
  if (read() === 'accepted') { load(); return; }
  if (read() === 'declined') return;
  function show() {
    if (document.getElementById('webon-agency-clarity-consent')) return;
    const panel=document.createElement('aside');
    panel.id='webon-agency-clarity-consent';
    panel.setAttribute('role','region');
    panel.setAttribute('aria-label',copy.label);
    panel.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483000;background:#142339;color:#fff;border:1px solid #53657f;box-shadow:0 8px 30px #0005;border-radius:12px;padding:14px 16px;max-width:680px;margin:0 auto;font:14px/1.5 system-ui,-apple-system,sans-serif;';
    const message=document.createElement('div');
    message.textContent=copy.message+' ';
    const link=document.createElement('a');
    link.href=policy;
    link.textContent=copy.policy;
    link.style.cssText='color:#b8d8ff;text-decoration:underline;';
    message.appendChild(link);
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;';
    function button(label,accepted){
      const element=document.createElement('button');
      element.type='button';
      element.textContent=label;
      element.style.cssText='padding:9px 16px;border-radius:8px;border:1px solid #8c9db5;font:inherit;cursor:pointer;background:'+(accepted?'#fff;color:#13223a;':'transparent;color:#fff;');
      element.addEventListener('click',()=>{
        write(accepted?'accepted':'declined');
        panel.remove();
        if(accepted)load();
      });
      return element;
    }
    actions.append(button(copy.yes,true),button(copy.no,false));
    panel.append(message,actions);
    document.body.appendChild(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});
  else show();
})();
