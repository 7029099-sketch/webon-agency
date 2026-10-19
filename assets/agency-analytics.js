/* Independent Google Analytics 4 setup for webon.agency only. */
(function () {
  'use strict';
  if (window.__webonAgencyGA4Ready) return;
  window.__webonAgencyGA4Ready = true;

  var measurementId = 'G-P2MFSEQ1WD';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(loader);

  // Outbound contact intent is not a confirmed customer enquiry.
  // Do not send phone numbers, email addresses, or message content to GA4.
  document.addEventListener('click', function (event) {
    var element = event.target.closest && event.target.closest('a,button');
    if (!element) return;
    var href = element.getAttribute('href') || '';
    if (/^tel:/i.test(href)) {
      window.gtag('event', 'phone_click', { page_path: location.pathname, contact_method: 'phone' });
    } else if (/^https:\/\/t\.me\//i.test(href)) {
      window.gtag('event', 'telegram_click', { page_path: location.pathname, contact_method: 'telegram' });
    } else if (element.id === 'wa-chat-launch' && !element.hidden) {
      window.gtag('event', 'chat_open', { page_path: location.pathname, contact_method: 'site_chat' });
    }
  }, false);
})();
