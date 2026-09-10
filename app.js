/**
 * JILLIAN TATTOO ATELIER — BESPOKE BOOKING ENGINE
 * Elegant 5-step consultation workflow, drag & drop image handling,
 * and real-time Discord webhook owner alerts on click & submit.
 */

(function() {
  'use strict';

  // Application State
  const state = {
    currentStep: 1,
    totalSteps: 5,
    selectedSlots: new Set(),
    referenceImages: [],
    placementImage: null,
    coverupImage: null,
    hasSentVisitPing: false
  };

  // Retrieve merged configuration
  function getConfig() {
    const defaultCfg = window.STUDIO_CONFIG || {};
    const localDiscord = localStorage.getItem('tattoo_discord_webhook');
    const localEmail = localStorage.getItem('tattoo_email_endpoint');
    const localNotifyView = localStorage.getItem('tattoo_notify_view');
    const localNotifyStart = localStorage.getItem('tattoo_notify_start');
    const localNotifySubmit = localStorage.getItem('tattoo_notify_submit');

    return {
      ...defaultCfg,
      notifications: {
        ...defaultCfg.notifications,
        discordWebhookUrl: localDiscord !== null ? localDiscord : (defaultCfg.notifications?.discordWebhookUrl || ''),
        emailEndpoint: localEmail !== null ? localEmail : (defaultCfg.notifications?.emailEndpoint || ''),
        notifyOnPageView: localNotifyView !== null ? localNotifyView === 'true' : true,
        notifyOnStartBooking: localNotifyStart !== null ? localNotifyStart === 'true' : true,
        notifyOnSubmission: localNotifySubmit !== null ? localNotifySubmit === 'true' : true
      }
    };
  }

  // =========================================================================
  // Telemetry & Owner Notification Service
  // =========================================================================
  const NotificationService = {
    async sendDiscord(title, description, fields = [], color = 0xd4af37) {
      const cfg = getConfig();
      const webhookUrl = cfg.notifications?.discordWebhookUrl;
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        console.info('[NotificationService] Webhook URL not configured. Action logged:', title);
        return false;
      }

      const payload = {
        username: "Jillian's Tattoo Atelier",
        avatar_url: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=200&auto=format&fit=crop&q=80",
        embeds: [{
          title: title,
          description: description,
          color: color,
          fields: fields,
          footer: {
            text: "Jillian Atelier • Booking Notification Desk"
          },
          timestamp: new Date().toISOString()
        }]
      };

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return res.ok;
      } catch (err) {
        console.warn('[NotificationService] Webhook dispatch notice:', err);
        return false;
      }
    },

    async notifyPageView() {
      if (state.hasSentVisitPing) return;
      state.hasSentVisitPing = true;
      const cfg = getConfig();
      if (!cfg.notifications?.notifyOnPageView) return;

      const device = window.innerWidth <= 768 ? '📱 Mobile' : '💻 Desktop';
      const referrer = document.referrer ? document.referrer : 'Direct / Link in Bio';

      await this.sendDiscord(
        "👀 Studio Portal Link Opened",
        "A prospective client just loaded your tattoo studio booking page.",
        [
          { name: "Device Type", value: device, inline: true },
          { name: "Traffic Source", value: referrer, inline: true },
          { name: "Time", value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), inline: true }
        ],
        0x38bdf8
      );
    },

    async notifyStartBooking() {
      const cfg = getConfig();
      if (!cfg.notifications?.notifyOnStartBooking) return;

      await this.sendDiscord(
        "✨ Client Began Consultation Form",
        "A prospective client clicked **Start Consultation** and is currently entering their project specs.",
        [
          { name: "Status", value: "📝 Step 01 in progress", inline: true },
          { name: "Time", value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), inline: true }
        ],
        0xd4af37
      );
    },

    async notifySubmission(data) {
      const cfg = getConfig();
      if (!cfg.notifications?.notifyOnSubmission) return;

      const fields = [
        { name: "👤 Client Name", value: `${data.fullName} ${data.pronouns ? '(' + data.pronouns + ')' : ''}`, inline: true },
        { name: "📱 Phone", value: data.phone || 'N/A', inline: true },
        { name: "✉️ Email", value: data.email || 'N/A', inline: true },
        { name: "📸 Instagram", value: data.instagram ? `@${data.instagram.replace('@', '')}` : 'N/A', inline: true },
        { name: "🎂 Age", value: `${data.age} yrs`, inline: true },
        { name: "📍 Location", value: `${data.location} (${data.isTraveling === 'Yes' ? 'Traveling In' : 'Local'})`, inline: true },
        { name: "🎨 Style & Color", value: `**Style:** ${data.style}\n**Color:** ${data.colorPreference}`, inline: false },
        { name: "📐 Placement & Dimensions", value: `**Area:** ${data.placement === 'Other' ? data.placementOtherText : data.placement}\n**Size:** ${data.sizeWidth || '?'}" × ${data.sizeHeight || '?'}"`, inline: true },
        { name: "🔄 Cover-Up?", value: data.isCoverUp === 'Yes' ? `Yes (${data.existingTattooAge || 'Age not specified'}, ${data.hadLaser})` : 'No (Virgin Skin)', inline: true },
        { name: "💡 Creative Freedom", value: data.creativeFreedom, inline: false },
        { name: "📝 Concept Details", value: data.conceptDescription || 'None provided', inline: false },
        { name: "🗓️ Target Schedule", value: data.slots.length > 0 ? data.slots.join(', ') : 'Flexible schedule requested', inline: false },
        { name: "💰 Budget & Deposit Method", value: `**Budget:** ${data.budget}\n**Deposit Channel:** ${data.depositMethod}\n**Numbing Cream:** ${data.numbingCream}`, inline: false }
      ];

      if (data.additionalQuestions) {
        fields.push({ name: "❓ Special Notes / Requests", value: data.additionalQuestions, inline: false });
      }

      await this.sendDiscord(
        "🎉 NEW TATTOO CONSULTATION RECEIVED!",
        `**${data.fullName}** has submitted a comprehensive consultation record for studio review.`,
        fields,
        0x10b981
      );
    }
  };

  // =========================================================================
  // Dynamic Ledger Initializers
  // =========================================================================
  function initAvailabilityMatrix() {
    const container = document.getElementById('availability-matrix-container');
    if (!container) return;
    const cfg = getConfig();
    const days = cfg.availableDays || ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"];
    const slots = cfg.availableTimeSlots || [
      { id: "1130", label: "11:30 AM" },
      { id: "1430", label: "2:30 PM" },
      { id: "1630", label: "4:30 PM" }
    ];

    container.innerHTML = '';

    days.forEach(day => {
      const row = document.createElement('div');
      row.className = 'matrix-row';

      const dayLabel = document.createElement('div');
      dayLabel.className = 'matrix-day-label';
      dayLabel.textContent = day;

      const slotsWrap = document.createElement('div');
      slotsWrap.className = 'matrix-slots';

      slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = slot.label;
        const slotKey = `${day} @ ${slot.label}`;
        btn.setAttribute('data-slot-key', slotKey);

        btn.addEventListener('click', () => {
          if (state.selectedSlots.has(slotKey)) {
            state.selectedSlots.delete(slotKey);
            btn.classList.remove('selected');
          } else {
            state.selectedSlots.add(slotKey);
            btn.classList.add('selected');
          }
          document.getElementById('err-availability')?.classList.remove('show');
        });

        slotsWrap.appendChild(btn);
      });

      row.appendChild(dayLabel);
      row.appendChild(slotsWrap);
      container.appendChild(row);
    });
  }

  function initPaymentMethods() {
    const container = document.getElementById('payment-methods-container');
    if (!container) return;
    const cfg = getConfig();
    const methods = cfg.paymentMethods || [
      { id: "zelle", name: "Zelle", icon: "⚡" },
      { id: "applepay", name: "Apple Pay", icon: "" },
      { id: "venmo", name: "Venmo", icon: "💸" },
      { id: "paypal", name: "PayPal", icon: "🅿️" }
    ];

    container.innerHTML = '';

    methods.forEach((pm, idx) => {
      const label = document.createElement('label');
      label.className = 'payment-method-card';
      label.innerHTML = `
        <input type="radio" name="depositMethod" value="${pm.name}" ${idx === 0 ? 'checked' : ''} required />
        <div class="pm-inner">
          <span class="pm-icon">${pm.icon}</span>
          <span class="pm-name">${pm.name}</span>
        </div>
      `;
      container.appendChild(label);
    });
  }

  // =========================================================================
  // Media Upload Handlers
  // =========================================================================
  function setupImageUploaders() {
    // 1. References (Multiple)
    const fileRefInput = document.getElementById('file-references');
    const previewRef = document.getElementById('preview-references');

    function renderRefPreviews() {
      if (!previewRef) return;
      previewRef.innerHTML = '';
      state.referenceImages.forEach((imgObj, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'preview-thumb';
        thumb.innerHTML = `
          <img src="${imgObj.dataUrl}" alt="Reference ${idx + 1}" />
          <button type="button" class="preview-remove-btn" title="Remove image">&times;</button>
        `;
        thumb.querySelector('.preview-remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          state.referenceImages.splice(idx, 1);
          renderRefPreviews();
        });
        previewRef.appendChild(thumb);
      });
    }

    function handleRefFiles(files) {
      const remainingSlots = 5 - state.referenceImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          state.referenceImages.push({
            name: file.name,
            dataUrl: e.target.result
          });
          renderRefPreviews();
        };
        reader.readAsDataURL(file);
      });
    }

    if (fileRefInput) {
      fileRefInput.addEventListener('change', (e) => {
        if (e.target.files?.length) handleRefFiles(e.target.files);
      });
    }

    // 2. Single Image Handlers (Placement & Cover-up)
    function setupSingleUploader(inputId, previewId, stateKey) {
      const fileInput = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      if (!fileInput || !preview) return;

      function renderSinglePreview() {
        preview.innerHTML = '';
        if (!state[stateKey]) return;
        const thumb = document.createElement('div');
        thumb.className = 'preview-thumb';
        thumb.innerHTML = `
          <img src="${state[stateKey].dataUrl}" alt="Upload preview" />
          <button type="button" class="preview-remove-btn" title="Remove image">&times;</button>
        `;
        thumb.querySelector('.preview-remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          state[stateKey] = null;
          fileInput.value = '';
          renderSinglePreview();
        });
        preview.appendChild(thumb);
      }

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          state[stateKey] = {
            name: file.name,
            dataUrl: ev.target.result
          };
          renderSinglePreview();
        };
        reader.readAsDataURL(file);
      });
    }

    setupSingleUploader('file-placement', 'preview-placement', 'placementImage');
    setupSingleUploader('file-coverup', 'preview-coverup', 'coverupImage');
  }

  // =========================================================================
  // Step Navigation & Validation Engine
  // =========================================================================
  function validateStep(step) {
    let isValid = true;

    function checkField(id, errorId, validator) {
      const el = document.getElementById(id);
      const err = document.getElementById(errorId);
      if (!el || !err) return true;

      const valid = validator(el.value);
      if (!valid) {
        el.classList.add('is-invalid');
        err.classList.add('show');
        isValid = false;
      } else {
        el.classList.remove('is-invalid');
        err.classList.remove('show');
      }
      return valid;
    }

    if (step === 1) {
      checkField('input-fullName', 'err-fullName', val => val.trim().length >= 2);
      checkField('input-email', 'err-email', val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()));
      checkField('input-phone', 'err-phone', val => val.replace(/[^0-9]/g, '').length >= 7);
      checkField('input-age', 'err-age', val => parseInt(val, 10) >= 18);
      checkField('input-location', 'err-location', val => val.trim().length >= 2);
    }

    if (step === 2) {
      checkField('input-conceptDescription', 'err-conceptDescription', val => val.trim().length >= 5);
    }

    if (step === 3) {
      const isOtherPlacement = document.getElementById('placement-other-radio')?.checked;
      if (isOtherPlacement) {
        const otherInput = document.getElementById('input-placementOtherText');
        if (otherInput && otherInput.value.trim().length < 2) {
          otherInput.classList.add('is-invalid');
          isValid = false;
        } else if (otherInput) {
          otherInput.classList.remove('is-invalid');
        }
      }
    }

    if (step === 4) {
      const errAvail = document.getElementById('err-availability');
      if (state.selectedSlots.size === 0) {
        errAvail?.classList.add('show');
        isValid = false;
      } else {
        errAvail?.classList.remove('show');
      }
    }

    if (step === 5) {
      const agreements = ['agreeDeposit', 'agreeReschedule', 'agreeAppointmentOnly', 'agreeAgeID'];
      const errAgreements = document.getElementById('err-agreements');
      let allAgreed = true;
      agreements.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.checked) allAgreed = false;
      });

      if (!allAgreed) {
        errAgreements?.classList.add('show');
        isValid = false;
      } else {
        errAgreements?.classList.remove('show');
      }
    }

    return isValid;
  }

  function updateStepUI() {
    // Show active panel
    document.querySelectorAll('.sheet-panel').forEach(panel => {
      const pStep = parseInt(panel.getAttribute('data-step'), 10);
      panel.classList.toggle('active', pStep === state.currentStep);
    });

    // Update stepper indicators
    document.querySelectorAll('.step-nav-item').forEach(ind => {
      const iStep = parseInt(ind.getAttribute('data-step'), 10);
      ind.classList.toggle('active', iStep <= state.currentStep);
    });

    // Update navigation buttons
    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    const btnSubmit = document.getElementById('btn-submit-form');

    if (btnPrev) btnPrev.style.display = state.currentStep > 1 ? 'inline-flex' : 'none';
    if (btnNext) {
      btnNext.style.display = state.currentStep < state.totalSteps ? 'inline-flex' : 'none';
      btnNext.innerHTML = `Continue to Step 0${state.currentStep + 1} &rarr;`;
    }
    if (btnSubmit) btnSubmit.style.display = state.currentStep === state.totalSteps ? 'inline-flex' : 'none';

    // Scroll back to top of sheet
    const sheet = document.querySelector('.consultation-sheet');
    if (sheet) {
      sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =========================================================================
  // Form Submission & Dossier Receipt
  // =========================================================================
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateStep(5)) return;

    const btnSubmit = document.getElementById('btn-submit-form');
    const spinner = btnSubmit?.querySelector('.submit-spinner');
    if (btnSubmit) btnSubmit.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';

    const form = document.getElementById('tattoo-booking-form');
    const fd = new FormData(form);

    const data = {
      fullName: fd.get('fullName') || '',
      pronouns: fd.get('pronouns') || '',
      email: fd.get('email') || '',
      phone: fd.get('phone') || '',
      instagram: fd.get('instagram') || '',
      age: fd.get('age') || '',
      location: fd.get('location') || '',
      isTraveling: fd.get('isTraveling') || 'No',
      style: fd.get('style') || '',
      colorPreference: fd.get('colorPreference') || '',
      creativeFreedom: fd.get('creativeFreedom') || '',
      conceptDescription: fd.get('conceptDescription') || '',
      placement: fd.get('placement') || '',
      placementOtherText: fd.get('placementOtherText') || '',
      sizeWidth: fd.get('sizeWidth') || '4',
      sizeHeight: fd.get('sizeHeight') || '6',
      sizeUnit: fd.get('sizeUnit') || 'in',
      isCoverUp: fd.get('isCoverUp') || 'No',
      existingTattooAge: fd.get('existingTattooAge') || '',
      hadLaser: fd.get('hadLaser') || '',
      timeline: fd.get('timeline') || '',
      dateFrom: fd.get('dateFrom') || '',
      dateTo: fd.get('dateTo') || '',
      flexibleSchedule: fd.get('flexibleSchedule') || 'Yes',
      slots: Array.from(state.selectedSlots),
      budget: fd.get('budget') || '',
      numbingCream: fd.get('numbingCream') || '',
      depositMethod: fd.get('depositMethod') || '',
      additionalQuestions: fd.get('additionalQuestions') || '',
      referenceCount: state.referenceImages.length,
      hasPlacementPhoto: !!state.placementImage,
      hasCoverupPhoto: !!state.coverupImage
    };

    // Send owner notification
    await NotificationService.notifySubmission(data);

    // Populate Dossier Receipt
    const confirmName = document.getElementById('client-confirm-name');
    if (confirmName) confirmName.textContent = data.fullName.split(' ')[0] || 'Friend';

    const receiptContent = document.getElementById('receipt-summary-content');
    if (receiptContent) {
      const placementText = data.placement === 'Other' ? data.placementOtherText : data.placement;
      receiptContent.innerHTML = `
        <div class="receipt-row">
          <span class="receipt-label">Client Record</span>
          <span class="receipt-value">${data.fullName} ${data.pronouns ? '(' + data.pronouns + ')' : ''} &bull; ${data.email} &bull; ${data.phone}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Art Direction</span>
          <span class="receipt-value">${data.style} (${data.colorPreference})</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Placement & Scale</span>
          <span class="receipt-value">${placementText} &bull; Approx. ${data.sizeWidth}" &times; ${data.sizeHeight}" (${data.sizeUnit})</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Requested Slots</span>
          <span class="receipt-value">${data.slots.length > 0 ? data.slots.join(', ') : 'Flexible schedule'}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Budget Tier</span>
          <span class="receipt-value">${data.budget}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Deposit Channel</span>
          <span class="receipt-value">${data.depositMethod} ($200 deposit invoice dispatched upon acceptance)</span>
        </div>
      `;
    }

    // Switch views to Confirmation Dossier
    document.querySelectorAll('.view-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('success-screen')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (btnSubmit) btnSubmit.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }

  // =========================================================================
  // Screen Transitions & Global Event Listeners
  // =========================================================================
  function initEventListeners() {
    const curYearEl = document.getElementById('cur-year');
    if (curYearEl) curYearEl.textContent = new Date().getFullYear();

    // Start Booking Triggers
    function startBooking() {
      NotificationService.notifyStartBooking();
      document.querySelectorAll('.view-screen').forEach(s => s.classList.remove('active'));
      document.getElementById('form-screen')?.classList.add('active');
      state.currentStep = 1;
      updateStepUI();
    }

    document.getElementById('btn-start-booking')?.addEventListener('click', startBooking);
    document.getElementById('btn-start-booking-2')?.addEventListener('click', startBooking);
    document.getElementById('header-book-btn')?.addEventListener('click', startBooking);

    // Header Home Link
    document.getElementById('header-brand-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.view-screen').forEach(s => s.classList.remove('active'));
      document.getElementById('intro-screen')?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Step Nav buttons
    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      if (validateStep(state.currentStep)) {
        if (state.currentStep < state.totalSteps) {
          state.currentStep++;
          updateStepUI();
        }
      }
    });

    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
      if (state.currentStep > 1) {
        state.currentStep--;
        updateStepUI();
      }
    });

    // Form Submit
    document.getElementById('tattoo-booking-form')?.addEventListener('submit', handleFormSubmit);

    // Return Home
    document.getElementById('btn-return-home')?.addEventListener('click', () => {
      document.querySelectorAll('.view-screen').forEach(s => s.classList.remove('active'));
      document.getElementById('intro-screen')?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Print Receipt
    document.getElementById('btn-print-summary')?.addEventListener('click', () => {
      window.print();
    });

    // Cover-up details toggle
    const coverupYes = document.getElementById('coverup-yes');
    const coverupNo = document.getElementById('coverup-no');
    const coverupWrap = document.getElementById('coverup-details-expanded');

    coverupYes?.addEventListener('change', () => {
      if (coverupWrap) coverupWrap.style.display = 'block';
    });
    coverupNo?.addEventListener('change', () => {
      if (coverupWrap) coverupWrap.style.display = 'none';
    });

    // Placement "Other" toggle
    document.querySelectorAll('input[name="placement"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const wrap = document.getElementById('placement-other-wrap');
        if (wrap) {
          wrap.style.display = e.target.value === 'Other' ? 'block' : 'none';
        }
      });
    });

    // Dimension Unit Toggles (in vs cm)
    const unitIn = document.getElementById('unit-in');
    const unitCm = document.getElementById('unit-cm');
    const hiddenUnitInput = document.getElementById('input-sizeUnit');

    unitIn?.addEventListener('click', () => {
      unitIn.classList.add('active');
      unitCm?.classList.remove('active');
      if (hiddenUnitInput) hiddenUnitInput.value = 'in';
    });

    unitCm?.addEventListener('click', () => {
      unitCm.classList.add('active');
      unitIn?.classList.remove('active');
      if (hiddenUnitInput) hiddenUnitInput.value = 'cm';
    });

    // Phone Auto-formatting
    const phoneInput = document.getElementById('input-phone');
    phoneInput?.addEventListener('input', (e) => {
      let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    // FAQ Modal
    const faqModal = document.getElementById('faq-modal');
    document.getElementById('btn-open-faq')?.addEventListener('click', () => faqModal?.classList.add('active'));
    document.getElementById('footer-faq-link')?.addEventListener('click', () => faqModal?.classList.add('active'));
    document.getElementById('btn-close-faq')?.addEventListener('click', () => faqModal?.classList.remove('active'));

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    function openSettings() {
      const cfg = getConfig();
      const discordInput = document.getElementById('input-cfgDiscordWebhook');
      const emailInput = document.getElementById('input-cfgEmailEndpoint');
      const notifyView = document.getElementById('cfgNotifyView');
      const notifyStart = document.getElementById('cfgNotifyStart');
      const notifySubmit = document.getElementById('cfgNotifySubmit');

      if (discordInput) discordInput.value = cfg.notifications?.discordWebhookUrl || '';
      if (emailInput) emailInput.value = cfg.notifications?.emailEndpoint || '';
      if (notifyView) notifyView.checked = cfg.notifications?.notifyOnPageView;
      if (notifyStart) notifyStart.checked = cfg.notifications?.notifyOnStartBooking;
      if (notifySubmit) notifySubmit.checked = cfg.notifications?.notifyOnSubmission;

      settingsModal?.classList.add('active');
    }

    document.getElementById('btn-open-settings')?.addEventListener('click', openSettings);
    document.getElementById('footer-settings-link')?.addEventListener('click', openSettings);
    document.getElementById('btn-close-settings')?.addEventListener('click', () => settingsModal?.classList.remove('active'));

    // Save Settings
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const discordUrl = document.getElementById('input-cfgDiscordWebhook')?.value.trim();
      const emailUrl = document.getElementById('input-cfgEmailEndpoint')?.value.trim();
      const notifyView = document.getElementById('cfgNotifyView')?.checked;
      const notifyStart = document.getElementById('cfgNotifyStart')?.checked;
      const notifySubmit = document.getElementById('cfgNotifySubmit')?.checked;

      localStorage.setItem('tattoo_discord_webhook', discordUrl || '');
      localStorage.setItem('tattoo_email_endpoint', emailUrl || '');
      localStorage.setItem('tattoo_notify_view', String(notifyView));
      localStorage.setItem('tattoo_notify_start', String(notifyStart));
      localStorage.setItem('tattoo_notify_submit', String(notifySubmit));

      const statusMsg = document.getElementById('settings-status-msg');
      if (statusMsg) {
        statusMsg.textContent = '✓ Settings successfully saved to browser memory!';
        statusMsg.style.color = '#38bdf8';
        setTimeout(() => {
          statusMsg.textContent = '';
          settingsModal?.classList.remove('active');
        }, 1200);
      }
    });

    // Test Discord Ping
    document.getElementById('btn-test-notification')?.addEventListener('click', async () => {
      const statusMsg = document.getElementById('settings-status-msg');
      if (statusMsg) {
        statusMsg.textContent = 'Dispatching test notification...';
        statusMsg.style.color = '#d4af37';
      }

      const ok = await NotificationService.sendDiscord(
        "⚡ Webhook Connection Verified",
        "Your tattoo studio booking portal is configured and transmitting real-time alerts!",
        [
          { name: "Status", value: "✅ Active & Transmitting", inline: true },
          { name: "Local Time", value: new Date().toLocaleTimeString(), inline: true }
        ],
        0x10b981
      );

      if (statusMsg) {
        if (ok) {
          statusMsg.textContent = '✓ Test ping successfully delivered to your Discord channel!';
          statusMsg.style.color = '#10b981';
        } else {
          statusMsg.textContent = '⚠ Could not reach webhook. Please verify your Webhook URL.';
          statusMsg.style.color = '#e05252';
        }
      }
    });

    // Close modals on outside click
    [faqModal, settingsModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });
  }

  // =========================================================================
  // Initialize Application
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initAvailabilityMatrix();
    initPaymentMethods();
    setupImageUploaders();
    initEventListeners();

    // Trigger initial visit notification
    setTimeout(() => {
      NotificationService.notifyPageView();
    }, 600);
  });

})();