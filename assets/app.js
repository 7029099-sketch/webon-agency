
/* WebON Analytics v47 */
const WEBON_ATTR_KEY = 'webon_attribution_v1';

function webonGtagEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

function getWebonAttribution() {
  const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(WEBON_ATTR_KEY) || '{}') || {};
  } catch (_) {}

  const params = new URLSearchParams(window.location.search);
  keys.forEach(key => {
    const val = params.get(key);
    if (val) saved[key] = val;
  });

  if (!saved.utm_source && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.hostname && ref.hostname !== window.location.hostname) {
        saved.utm_source = ref.hostname;
        saved.utm_medium = saved.utm_medium || 'referral';
      }
    } catch (_) {}
  }

  try {
    sessionStorage.setItem(WEBON_ATTR_KEY, JSON.stringify(saved));
  } catch (_) {}

  return saved;
}

const webonAttribution = getWebonAttribution();

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  if (href.startsWith('/contacts.html')) {
    webonGtagEvent('contact_click', {
      contact_method: 'telegram',
      link_url: link.href
    });
  } else if (href.startsWith('mailto:')) {
    webonGtagEvent('contact_click', {
      contact_method: 'email',
      link_url: href.replace(/^mailto:/, '')
    });
  }
});

const modal = document.getElementById('leadModal');

document.querySelectorAll('[data-open-modal]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    if (!modal) return;

    const formView = document.getElementById('leadFormView');
    const successView = document.getElementById('leadSuccessView');
    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;

    const packageName = el.dataset.plan || '';
    const packagePrice = el.dataset.price || '';
    const siteType = el.dataset.siteType || '';
    const budget = el.dataset.budget || '';

    const selectedPlan = document.getElementById('selectedPlan');
    const selectedPlanName = document.getElementById('selectedPlanName');
    const selectedPlanPrice = document.getElementById('selectedPlanPrice');
    const packageInput = document.getElementById('leadPackage');
    const packagePriceInput = document.getElementById('leadPackagePrice');
    const siteTypeSelect = document.getElementById('leadSiteType');
    const budgetSelect = document.getElementById('leadBudget');

    if (packageName) {
      if (selectedPlan) selectedPlan.hidden = false;
      if (selectedPlanName) selectedPlanName.textContent = packageName;
      if (selectedPlanPrice) selectedPlanPrice.textContent = packagePrice ? `от ${packagePrice}` : '';
      if (packageInput) packageInput.value = packageName;
      if (packagePriceInput) packagePriceInput.value = packagePrice;
      if (siteTypeSelect && siteType) siteTypeSelect.value = siteType;
      if (budgetSelect && budget) budgetSelect.value = budget;
    } else {
      if (selectedPlan) selectedPlan.hidden = true;
      if (selectedPlanName) selectedPlanName.textContent = '';
      if (selectedPlanPrice) selectedPlanPrice.textContent = '';
      if (packageInput) packageInput.value = '';
      if (packagePriceInput) packagePriceInput.value = '';
    }

    webonGtagEvent('form_open', {
      form_name: 'lead_form',
      package_name: packageName || undefined,
      package_price: packagePrice || undefined
    });

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
});

document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', () => closeLeadModal());
});

function closeLeadModal(){
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (modal) {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeLeadModal();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLeadModal();
});

const contactMethodSelect = document.getElementById('leadContactMethod');
const leadPhoneInput = document.getElementById('leadPhone');
const leadPhoneLabel = document.getElementById('leadPhoneLabel');
if (contactMethodSelect && leadPhoneInput && leadPhoneLabel) {
  const updateContact = () => {
    const method = contactMethodSelect.value;
    const isEmail = method === 'Email';
    leadPhoneLabel.textContent = (isEmail ? 'Your email' : method === 'Telegram' ? 'Telegram username or phone' : method + ' phone number') + ' *';
    leadPhoneInput.placeholder = isEmail ? 'you@company.com' : method === 'Telegram' ? '@username or +1 555 123 4567' : '+1 555 123 4567';
    leadPhoneInput.type = isEmail ? 'email' : 'text';
    leadPhoneInput.setAttribute('autocomplete',isEmail?'email':'off');
  };
  contactMethodSelect.addEventListener('change',updateContact);
  updateContact();
}

const leadForm = document.getElementById('leadForm');
if (leadForm) {
  leadForm.addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('leadName')?.value.trim() || '';
    const phone = document.getElementById('leadPhone')?.value.trim() || '';
    const contactMethod = document.getElementById('leadContactMethod')?.value || 'Telegram';
    const siteType = document.getElementById('leadSiteType')?.value || '';
    const budget = document.getElementById('leadBudget')?.value || '';
    const packageName = document.getElementById('leadPackage')?.value || '';
    const packagePrice = document.getElementById('leadPackagePrice')?.value || '';
    const deadline = document.getElementById('leadDeadline')?.value || '';
    const comment = document.getElementById('leadComment')?.value.trim() || '';
    const website = document.getElementById('leadWebsite')?.value.trim() || '';
    const consent = document.getElementById('leadConsent')?.checked || false;
    const submitBtn = leadForm.querySelector('button[type="submit"]');

    if (!name || !phone || !contactMethod || !siteType || !consent) {
      alert('Please enter your name, preferred contact, service, and accept the privacy policy.');
      return;
    }

    const attribution = getWebonAttribution();
    const source = attribution.utm_source || 'direct';
    const campaign = attribution.utm_campaign || '';
    const medium = attribution.utm_medium || '';
    const term = attribution.utm_term || '';
    const content = attribution.utm_content || '';
    const gclid = attribution.gclid || '';

    const oldText = submitBtn?.textContent || 'Send request';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const payload = new URLSearchParams({
        name,
        phone,
        destination: contactMethod,
        site_type: siteType,
        budget,
        package: packageName,
        package_price: packagePrice,
        deadline,
        comment,
        page: window.location.href,
        source,
        campaign,
        medium,
        term,
        content,
        gclid,
        website
      });

      const response = await fetch('/send-lead.php', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body: payload
      });

      const data = await response.json().catch(() => ({ok:false}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'send_failed');

      webonGtagEvent('generate_lead', {
        form_name: 'lead_form',
        site_type: siteType,
        budget_range: budget,
        package_name: packageName || undefined,
        package_price: packagePrice || undefined,
        deadline: deadline || undefined,
        lead_source: source,
        lead_medium: medium || undefined,
        lead_campaign: campaign || undefined,
        lead_term: term || undefined,
        lead_content: content || undefined,
        has_gclid: Boolean(gclid)
      });

      leadForm.reset();
      const formView = document.getElementById('leadFormView');
      const successView = document.getElementById('leadSuccessView');
      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;

    } catch (err) {
      console.error(err);
      alert('Your request could not be sent. Please try again later.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      }
    }
  });
}
