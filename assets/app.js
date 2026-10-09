(()=>{
  // Technical SEO fallback for pages that do not already declare these signals in HTML.
  try{
    if(!document.querySelector('link[rel="canonical"]')){
      const link=document.createElement('link');
      link.rel='canonical';
      let path=location.pathname||'/';
      if(path.endsWith('/index.html')) path=path.slice(0,-10)||'/';
      link.href=location.origin+path;
      document.head.appendChild(link);
    }
    const p=location.pathname||'/';
    const isHome=(p==='/'||p==='/index.html'||p==='/uk/'||p==='/uk/index.html'||p==='/en/'||p==='/en/index.html');
    if(isHome && !document.querySelector('script[type="application/ld+json"]')){
      const lang=(document.documentElement.lang||'ru').toLowerCase();
      const canonical=document.querySelector('link[rel="canonical"]')?.href||location.origin+p;
      const desc=document.querySelector('meta[name="description"]')?.content||'';
      const data={
        '@context':'https://schema.org',
        '@graph':[
          {'@type':'Organization','@id':'https://webon.agency/#organization','name':'WebON','url':'https://webon.agency/','sameAs':['https://t.me/Web_Studio_On']},
          {'@type':'WebSite','@id':'https://webon.agency/#website','url':'https://webon.agency/','name':'WebON','publisher':{'@id':'https://webon.agency/#organization'},'inLanguage':lang},
          {'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':document.title,'description':desc,'isPartOf':{'@id':'https://webon.agency/#website'},'about':{'@id':'https://webon.agency/#organization'},'inLanguage':lang}
        ]
      };
      const s=document.createElement('script');s.type='application/ld+json';s.textContent=JSON.stringify(data);document.head.appendChild(s);
    }
  }catch(_){}

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const modal=q('#leadModal');

  const open=()=>{
    if(!modal)return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  };
  const close=()=>{
    if(!modal)return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };

  qa('[data-open-modal]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();open();}));
  qa('[data-close-modal]').forEach(x=>x.addEventListener('click',close));
  if(modal) modal.addEventListener('click',e=>{if(e.target===modal) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});

  const lang=(document.documentElement.lang||document.body?.dataset?.lang||'ru').toLowerCase();
  const copy={
    ru:{sending:'Отправляем заявку…',sent:'Заявка отправлена. Мы уже получили её и свяжемся с вами.',error:'Не удалось отправить заявку. Попробуйте ещё раз.',successKicker:'Заявка отправлена',successTitle:'Спасибо. Уже получили 👌',successText:'Заявка успешно передана в WebON. Мы свяжемся с вами по указанному телефону или Telegram.'},
    uk:{sending:'Надсилаємо заявку…',sent:'Заявку надіслано. Ми вже отримали її та зв’яжемося з вами.',error:'Не вдалося надіслати заявку. Спробуйте ще раз.',successKicker:'Заявку надіслано',successTitle:'Дякуємо. Уже отримали 👌',successText:'Заявку успішно передано в WebON. Ми зв’яжемося з вами за вказаним телефоном або Telegram.'},
    en:{sending:'Sending request…',sent:'Request sent. We have received it and will contact you.',error:'Could not send the request. Please try again.',successKicker:'Request sent',successTitle:'Thank you. We got it 👌',successText:'Your request was successfully sent to WebON. We will contact you by phone or Telegram.'}
  };
  const t=copy[lang]||copy.ru;

  // Keep the homepage visibly connected to the dedicated SEO landing-page cluster.
  try{
    const path=location.pathname||'/';
    const homePaths=new Set(['/','/index.html','/uk/','/uk/index.html','/en/','/en/index.html']);
    if(homePaths.has(path)){
      const seoLinks={
        ru:{promotion:['SEO-продвижение сайта','Семантика, техническое SEO, контент и внутренняя перелинковка для роста органической видимости.','/seo-promotion.html','SEO-продвижение →'],business:['SEO для бизнеса','Продвижение приоритетных услуг и коммерческих страниц под заявки и продажи.','/seo-for-business.html','SEO для бизнеса →']},
        uk:{promotion:['SEO-просування сайту','Семантика, технічне SEO, контент і внутрішня перелінковка для зростання органічної видимості.','/uk/seo-promotion.html','SEO-просування →'],business:['SEO для бізнесу','Просування пріоритетних послуг і комерційних сторінок під заявки та продажі.','/uk/seo-for-business.html','SEO для бізнесу →']},
        en:{promotion:['SEO promotion','Keyword structure, technical SEO, content and internal linking for stronger organic visibility.','/en/seo-promotion.html','SEO promotion →'],business:['SEO for business','SEO for priority services and commercial pages focused on qualified leads and sales.','/en/seo-for-business.html','SEO for business →']}
      };
      const labels=seoLinks[lang]||seoLinks.ru;
      const grid=q('.home-seo-links .seo-topic-grid');
      if(grid && !grid.querySelector('[data-webon-seo-cluster="promotion"]')){
        ['promotion','business'].forEach(key=>{
          const item=labels[key];
          const article=document.createElement('article');
          article.className='seo-topic';
          article.dataset.webonSeoCluster=key;
          const h3=document.createElement('h3');h3.textContent=item[0];
          const p=document.createElement('p');p.textContent=item[1];
          const a=document.createElement('a');a.href=item[2];a.textContent=item[3];
          article.append(h3,p,a);
          grid.appendChild(article);
        });
      }
      const aiLink=q('footer a[href="/seo-ai-search.html"],footer a[href="/uk/seo-ai-search.html"],footer a[href="/en/seo-ai-search.html"]');
      const footerCol=aiLink?.closest('.footer-pro-col');
      if(footerCol && !footerCol.querySelector('[data-webon-seo-footer="promotion"]')){
        ['promotion','business'].forEach(key=>{
          const item=labels[key];
          const a=document.createElement('a');
          a.href=item[2];
          a.textContent=item[0];
          a.dataset.webonSeoFooter=key;
          footerCol.insertBefore(a,footerCol.querySelector('a[href*="cases.html"]')||null);
        });
      }
    }
  }catch(_){}

  const TRACK_KEYS=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  const safeSession={
    get(k){try{return sessionStorage.getItem(k)||'';}catch(_){return'';}},
    set(k,v){try{sessionStorage.setItem(k,v);}catch(_){}}
  };
  const captureTracking=()=>{
    let p=null; try{p=new URLSearchParams(location.search);}catch(_){}
    TRACK_KEYS.forEach(k=>{const v=p?p.get(k):''; if(v) safeSession.set('webon_'+k,v);});
    if(document.referrer && !safeSession.get('webon_referrer')) safeSession.set('webon_referrer',document.referrer);
    if(!safeSession.get('webon_landing_page')) safeSession.set('webon_landing_page',location.href);
  };
  captureTracking();

  const buildPayload=(form)=>{
    const fd=new FormData(form);
    let p=null; try{p=new URLSearchParams(location.search);}catch(_){}
    TRACK_KEYS.forEach(k=>{
      const v=(p&&p.get(k)) || safeSession.get('webon_'+k) || '';
      if(v){fd.set(k,v); if(k.startsWith('utm_')) fd.set(k.replace('utm_',''),v);}
    });
    fd.set('page',location.href);
    fd.set('page_url',location.href);
    fd.set('landing_page',safeSession.get('webon_landing_page')||location.href);
    fd.set('referrer',safeSession.get('webon_referrer')||document.referrer||'');
    fd.set('user_agent',navigator.userAgent||'');
    fd.set('client_time',new Date().toISOString());
    fd.set('lang',lang);
    return fd;
  };

  const showSuccess=(form)=>{
    const formView=q('#leadFormView');
    const success=q('#leadSuccessView');
    if(success){
      const kicker=success.querySelector('.modal-kicker');
      const title=success.querySelector('h2');
      const text=success.querySelector('p');
      if(kicker) kicker.textContent=t.successKicker;
      if(title) title.textContent=t.successTitle;
      if(text) text.textContent=t.successText;
      success.hidden=false;
    }
    if(formView) formView.hidden=true;
    const note=form.querySelector('.form-note');
    if(note) note.textContent=t.sent;
  };

  /* International lead submission disabled pending separate backend configuration. */
})();

// Feature real WebON projects on all localized homepages.
(()=>{
  try{
    const path=location.pathname||'/';
    const homePaths=new Set(['/','/index.html','/uk/','/uk/index.html','/en/','/en/index.html']);
    if(!homePaths.has(path) || document.getElementById('webon-real-projects')) return;

    const lang=(document.documentElement.lang||'ru').toLowerCase();
    const copy={
      ru:{
        kicker:'WebON · реальные проекты',
        title:'Не обещания. Работающие проекты.',
        intro:'Два действующих сайта, на которых WebON выстроил структуру, SEO-инфраструктуру, автоматический деплой и технический контроль.',
        all:'Все кейсы →',
        caseLabel:'Смотреть кейс →',
        siteLabel:'Открыть сайт ↗',
        liveon:{title:'LiveOn Production',tag:'Видеопродакшн · SEO · автоматизация',text:'Сайт видеопродакшна с коммерческими посадочными, Schema.org, sitemap, внутренней перелинковкой, GitHub Actions и ежедневным health-check.',case:'/case-liveon-production-seo.html',site:'https://liveon.com.ua/'},
        videolive:{title:'VideoLive',tag:'Видеосъёмка · трансляции · lead tracking',text:'Отдельный коммерческий бренд с SEO-кластерами под видеосъёмку и трансляции, атрибуцией заявок, IndexNow, CI/CD и мониторингом.',case:'/case-videolive-seo-automation.html',site:'https://www.videolive.com.ua/'}
      },
      uk:{
        kicker:'WebON · реальні проєкти',
        title:'Не обіцянки. Проєкти, що працюють.',
        intro:'Два діючі сайти, для яких WebON вибудував структуру, SEO-інфраструктуру, автоматичний деплой і технічний контроль.',
        all:'Усі кейси →',
        caseLabel:'Дивитися кейс →',
        siteLabel:'Відкрити сайт ↗',
        liveon:{title:'LiveOn Production',tag:'Відеопродакшн · SEO · автоматизація',text:'Сайт відеопродакшну з комерційними посадковими, Schema.org, sitemap, внутрішньою перелінковкою, GitHub Actions і щоденним health-check.',case:'/uk/case-liveon-production-seo.html',site:'https://liveon.com.ua/'},
        videolive:{title:'VideoLive',tag:'Відеозйомка · трансляції · lead tracking',text:'Окремий комерційний бренд із SEO-кластерами під відеозйомку й трансляції, атрибуцією заявок, IndexNow, CI/CD та моніторингом.',case:'/uk/case-videolive-seo-automation.html',site:'https://www.videolive.com.ua/'}
      },
      en:{
        kicker:'WebON · real projects',
        title:'Not promises. Working projects.',
        intro:'Two live websites where WebON built the structure, SEO infrastructure, automated deployment and technical monitoring.',
        all:'All cases →',
        caseLabel:'View case →',
        siteLabel:'Open website ↗',
        liveon:{title:'LiveOn Production',tag:'Video production · SEO · automation',text:'A video-production website with commercial landing pages, Schema.org, sitemaps, internal linking, GitHub Actions and daily health checks.',case:'/en/case-liveon-production-seo.html',site:'https://liveon.com.ua/'},
        videolive:{title:'VideoLive',tag:'Video production · live streaming · lead tracking',text:'A separate commercial brand with SEO clusters for filming and live streaming, lead attribution, IndexNow, CI/CD and monitoring.',case:'/en/case-videolive-seo-automation.html',site:'https://www.videolive.com.ua/'}
      }
    };
    const t=copy[lang]||copy.ru;
    const allCases=lang==='uk'?'/uk/cases.html':lang==='en'?'/en/cases.html':'/cases.html';

    if(!document.getElementById('webon-real-projects-style')){
      const style=document.createElement('style');
      style.id='webon-real-projects-style';
      style.textContent=`
        .webon-real-projects{position:relative;overflow:hidden;padding:68px 0;background:linear-gradient(180deg,#071522,#091a2b);border-top:1px solid rgba(77,158,220,.10);border-bottom:1px solid rgba(77,158,220,.10)}
        .webon-real-projects:before{content:"";position:absolute;inset:auto auto -240px -180px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(25,142,230,.14),transparent 66%);pointer-events:none}
        .webon-real-projects-head{display:flex;align-items:end;justify-content:space-between;gap:28px;margin-bottom:28px}
        .webon-real-projects .kicker{color:#68c6ff;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
        .webon-real-projects h2{max-width:760px;margin:8px 0 8px;color:#f6f9fd;font-size:clamp(34px,4vw,54px);line-height:1;letter-spacing:-.045em}
        .webon-real-projects-head p{max-width:760px;margin:0;color:#8ca7bf;font-size:14px;line-height:1.65}
        .webon-real-projects-all{flex:0 0 auto;color:#71cbff;text-decoration:none;font-size:13px;font-weight:800}
        .webon-real-projects-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .webon-project-card{position:relative;min-width:0;padding:28px;border:1px solid rgba(61,154,220,.38);border-radius:22px;background:radial-gradient(circle at 90% 0,rgba(36,153,238,.12),transparent 34%),linear-gradient(180deg,#0b2238,#081826);box-shadow:0 22px 54px rgba(0,0,0,.22);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
        .webon-project-card:hover{transform:translateY(-4px);border-color:#3db5ff;box-shadow:0 28px 64px rgba(0,0,0,.30)}
        .webon-project-mark{display:inline-flex;margin-bottom:18px;padding:6px 10px;border:1px solid rgba(61,181,255,.45);border-radius:999px;color:#77ceff;background:rgba(16,87,135,.16);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .webon-project-card h3{margin:0 0 10px;color:#fff;font-size:26px;letter-spacing:-.035em}
        .webon-project-card p{margin:0 0 22px;color:#91a9be;font-size:14px;line-height:1.65}
        .webon-project-actions{display:flex;flex-wrap:wrap;gap:10px}
        .webon-project-actions a{display:inline-flex;align-items:center;min-height:42px;padding:0 14px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}
        .webon-project-actions a:first-child{border:1px solid #2da7f5;color:#ecf8ff;background:linear-gradient(180deg,rgba(34,153,231,.24),rgba(8,75,121,.14))}
        .webon-project-actions a:last-child{border:1px solid rgba(117,158,190,.36);color:#a9c1d5;background:rgba(5,18,29,.42)}
        @media(max-width:820px){.webon-real-projects-head{display:block}.webon-real-projects-all{display:inline-block;margin-top:14px}.webon-real-projects-grid{grid-template-columns:1fr}.webon-real-projects{padding:52px 0}.webon-project-card{padding:22px}}
      `;
      document.head.appendChild(style);
    }

    const section=document.createElement('section');
    section.id='webon-real-projects';
    section.className='webon-real-projects';
    section.dataset.webonRealProjects='liveon-videolive';
    const wrap=document.createElement('div');wrap.className='wrap';
    const head=document.createElement('div');head.className='webon-real-projects-head';
    const intro=document.createElement('div');
    const kicker=document.createElement('div');kicker.className='kicker';kicker.textContent=t.kicker;
    const h2=document.createElement('h2');h2.textContent=t.title;
    const p=document.createElement('p');p.textContent=t.intro;
    intro.append(kicker,h2,p);
    const all=document.createElement('a');all.className='webon-real-projects-all';all.href=allCases;all.textContent=t.all;
    head.append(intro,all);
    const grid=document.createElement('div');grid.className='webon-real-projects-grid';
    ['liveon','videolive'].forEach(key=>{
      const item=t[key];
      const article=document.createElement('article');article.className='webon-project-card';
      const mark=document.createElement('span');mark.className='webon-project-mark';mark.textContent=item.tag;
      const title=document.createElement('h3');title.textContent=item.title;
      const text=document.createElement('p');text.textContent=item.text;
      const actions=document.createElement('div');actions.className='webon-project-actions';
      const caseLink=document.createElement('a');caseLink.href=item.case;caseLink.textContent=t.caseLabel;
      const liveLink=document.createElement('a');liveLink.href=item.site;liveLink.target='_blank';liveLink.rel='noopener';liveLink.textContent=t.siteLabel;
      actions.append(caseLink,liveLink);
      article.append(mark,title,text,actions);
      grid.appendChild(article);
    });
    wrap.append(head,grid);section.appendChild(wrap);
    const anchor=document.querySelector('.home-seo-links')||document.querySelector('#faq')||document.querySelector('footer');
    if(anchor?.parentNode) anchor.parentNode.insertBefore(section,anchor);

    const structured=document.createElement('script');
    structured.type='application/ld+json';
    structured.id='webon-real-projects-jsonld';
    structured.textContent=JSON.stringify({
      '@context':'https://schema.org','@type':'ItemList','name':t.title,'itemListElement':[
        {'@type':'ListItem','position':1,'url':new URL(t.liveon.case,location.origin).href,'name':'LiveOn Production — WebON case study'},
        {'@type':'ListItem','position':2,'url':new URL(t.videolive.case,location.origin).href,'name':'VideoLive — WebON case study'}
      ]
    });
    document.head.appendChild(structured);
  }catch(err){console.error('WebON real projects block failed:',err);}
})();
