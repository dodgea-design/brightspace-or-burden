(() => {
  const pages = [
    'home','jordan','instructions','view-a','assignment-a','view-b','checklist',
    'assignment-b','evaluation','educator','findings','discussion'
  ];
  const stateKey = 'brightspace-burden-state-v1';
  const defaultState = { completed: [], checklist: {}, evaluation: {}, preferences: {} };
  let state = loadState();
  let speech = null;
  const timers = {};

  function loadState() {
    try {
      return { ...defaultState, ...JSON.parse(localStorage.getItem(stateKey) || '{}') };
    } catch (_) {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(stateKey, JSON.stringify(state));
  }

  function currentPage() {
    const candidate = location.hash.replace('#', '');
    return pages.includes(candidate) ? candidate : 'home';
  }

  function navigate(page, replace = false) {
    if (!pages.includes(page)) page = 'home';
    if (replace) history.replaceState(null, '', `#${page}`);
    else location.hash = page;
    renderPage(page);
  }

  function renderPage(page = currentPage()) {
    stopSpeech();
    document.querySelectorAll('.page').forEach(section => {
      const active = section.dataset.page === page;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-page-link]').forEach(link => {
      if (link.dataset.pageLink === page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const index = pages.indexOf(page);
    document.getElementById('previous-page').disabled = index === 0;
    document.getElementById('next-page').disabled = index === pages.length - 1;
    const completeButton = document.getElementById('complete-page');
    const complete = state.completed.includes(page);
    completeButton.classList.toggle('is-complete', complete);
    completeButton.textContent = complete ? 'Page complete ✓' : 'Mark this page complete';
    document.title = page === 'home' ? 'Brightspace or Burden? Executive Function Design Test' : `${pageTitle(page)} | Brightspace or Burden?`;
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main-content').focus({ preventScroll: true });
    updateProgress();
  }

  function pageTitle(page) {
    const heading = document.querySelector(`#page-${page} h2`);
    return heading ? heading.textContent.trim() : 'Brightspace or Burden?';
  }

  function updateProgress() {
    const total = pages.length;
    const count = state.completed.filter(page => pages.includes(page)).length;
    const ring = document.getElementById('progress-ring');
    ring.style.setProperty('--progress', `${(count / total) * 360}deg`);
    ring.setAttribute('aria-label', `${count} of ${total} pages complete`);
    document.getElementById('progress-count').textContent = `${count}/${total}`;
    document.querySelectorAll('[data-page-link]').forEach(link => link.classList.toggle('completed', state.completed.includes(link.dataset.pageLink)));
    const groups = [
      ['view-a','assignment-a'],
      ['view-b','checklist','assignment-b'],
      ['evaluation','educator','findings','discussion']
    ];
    document.querySelectorAll('.module-count').forEach((node, index) => {
      const group = groups[index];
      node.textContent = `${group.filter(item => state.completed.includes(item)).length}/${group.length}`;
    });
  }

  function markComplete() {
    const page = currentPage();
    if (state.completed.includes(page)) state.completed = state.completed.filter(item => item !== page);
    else state.completed.push(page);
    saveState();
    renderPage(page);
    showToast(state.completed.includes(page) ? 'Page marked complete.' : 'Page marked incomplete.');
  }

  function updateChecklist() {
    const boxes = [...document.querySelectorAll('[data-check-item]')];
    boxes.forEach(box => { box.checked = Boolean(state.checklist[box.dataset.checkItem]); });
    const count = boxes.filter(box => box.checked).length;
    document.getElementById('checklist-count').textContent = `${count} of ${boxes.length} items complete`;
    document.getElementById('checklist-bar').style.width = `${(count / boxes.length) * 100}%`;
  }

  function initEvaluation() {
    const form = document.getElementById('evaluation-form');
    [...form.elements].forEach(field => {
      if (!field.name) return;
      if (state.evaluation[field.name] !== undefined) field.value = state.evaluation[field.name];
    });
    updateRangeOutputs();
    form.addEventListener('input', () => {
      [...form.elements].forEach(field => { if (field.name) state.evaluation[field.name] = field.value; });
      saveState();
      updateRangeOutputs();
      const status = document.getElementById('save-status');
      status.textContent = 'Saved in this browser.';
      clearTimeout(status._timer);
      status._timer = setTimeout(() => status.textContent = 'Responses save automatically in this browser.', 1600);
    });
  }

  function updateRangeOutputs() {
    ['a-effort','a-confidence','b-effort','b-confidence'].forEach(id => {
      const input = document.getElementById(id);
      document.getElementById(`${id}-output`).value = input.value;
    });
  }

  function downloadNotes() {
    const labels = {
      'a-time':'Version A time (seconds)','a-assignment':'A: found assignment','a-deadline':'A: found deadline','a-first':'A: found first action','a-help':'A: found help','a-effort':'A: mental effort','a-confidence':'A: confidence',
      'b-time':'Version B time (seconds)','b-assignment':'B: found assignment','b-deadline':'B: found deadline','b-first':'B: found first action','b-help':'B: found help','b-effort':'B: mental effort','b-confidence':'B: confidence',
      'reflection-next':'Which version made the next step easier','reflection-effort':'What changed mental effort','reflection-jordan':'Support for Jordan','reflection-change':'One recommended change'
    };
    const lines = ['Brightspace or Burden? — Participant Notes','', ...Object.entries(labels).map(([key,label]) => `${label}: ${state.evaluation[key] || 'Not answered'}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'brightspace-or-burden-notes.txt';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Your notes were downloaded.');
  }

  function initTimers() {
    document.querySelectorAll('[data-timer]').forEach(card => {
      const key = card.dataset.timer;
      timers[key] = { seconds: 0, interval: null };
      const output = card.querySelector('.timer-output');
      const display = () => {
        const minutes = String(Math.floor(timers[key].seconds / 60)).padStart(2, '0');
        const seconds = String(timers[key].seconds % 60).padStart(2, '0');
        output.value = `${minutes}:${seconds}`;
      };
      card.querySelector('.timer-start').addEventListener('click', () => {
        if (timers[key].interval) return;
        timers[key].interval = setInterval(() => { timers[key].seconds += 1; display(); }, 1000);
      });
      card.querySelector('.timer-stop').addEventListener('click', () => {
        clearInterval(timers[key].interval); timers[key].interval = null;
        const field = document.querySelector(`[name="${key}-time"]`);
        if (field) {
          field.value = timers[key].seconds;
          state.evaluation[`${key}-time`] = String(timers[key].seconds);
          saveState();
        }
      });
      card.querySelector('.timer-reset').addEventListener('click', () => {
        clearInterval(timers[key].interval); timers[key].interval = null; timers[key].seconds = 0; display();
      });
      display();
    });
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) return showToast('Read-aloud is not supported in this browser.');
    if (speechSynthesis.speaking) return stopSpeech();
    const page = document.querySelector('.page.is-active');
    speech = new SpeechSynthesisUtterance(page.innerText.replace(/\s+/g, ' ').trim());
    speech.rate = .95;
    speech.onend = () => document.getElementById('listen-button').textContent = 'Listen to page';
    speechSynthesis.speak(speech);
    document.getElementById('listen-button').textContent = 'Stop listening';
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.getElementById('listen-button').textContent = 'Listen to page';
  }

  function applyPreferences() {
    document.body.classList.toggle('large-text', Boolean(state.preferences.largeText));
    document.body.classList.toggle('high-contrast', Boolean(state.preferences.highContrast));
    const textButton = document.getElementById('text-button');
    const contrastButton = document.getElementById('contrast-button');
    textButton.setAttribute('aria-pressed', String(Boolean(state.preferences.largeText)));
    contrastButton.setAttribute('aria-pressed', String(Boolean(state.preferences.highContrast)));
    textButton.textContent = state.preferences.largeText ? 'Standard text' : 'Larger text';
    contrastButton.textContent = state.preferences.highContrast ? 'Standard contrast' : 'High contrast';
  }

  function openMenu() {
    document.getElementById('course-navigation').classList.add('is-open');
    document.getElementById('sidebar-scrim').hidden = false;
    document.getElementById('menu-button').setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    document.getElementById('course-navigation').classList.remove('is-open');
    document.getElementById('sidebar-scrim').hidden = true;
    document.getElementById('menu-button').setAttribute('aria-expanded', 'false');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.hidden = true, 2200);
  }

  function resetAll() {
    if (!confirm('Reset completed pages, checklist items, evaluation notes, and display preferences?')) return;
    localStorage.removeItem(stateKey);
    state = structuredClone(defaultState);
    document.getElementById('evaluation-form').reset();
    applyPreferences(); updateChecklist(); updateRangeOutputs(); updateProgress(); renderPage('home');
    showToast('Prototype progress was reset.');
  }

  document.addEventListener('click', event => {
    const go = event.target.closest('[data-go]');
    if (go) { event.preventDefault(); navigate(go.dataset.go); }
    const pageLink = event.target.closest('[data-page-link]');
    if (pageLink) { event.preventDefault(); navigate(pageLink.dataset.pageLink); }
  });
  window.addEventListener('hashchange', () => renderPage());
  document.getElementById('previous-page').addEventListener('click', () => navigate(pages[Math.max(0, pages.indexOf(currentPage()) - 1)]));
  document.getElementById('next-page').addEventListener('click', () => navigate(pages[Math.min(pages.length - 1, pages.indexOf(currentPage()) + 1)]));
  document.getElementById('complete-page').addEventListener('click', markComplete);
  document.getElementById('listen-button').addEventListener('click', toggleSpeech);
  document.getElementById('text-button').addEventListener('click', () => { state.preferences.largeText = !state.preferences.largeText; saveState(); applyPreferences(); });
  document.getElementById('contrast-button').addEventListener('click', () => { state.preferences.highContrast = !state.preferences.highContrast; saveState(); applyPreferences(); });
  document.getElementById('menu-button').addEventListener('click', () => document.getElementById('course-navigation').classList.contains('is-open') ? closeMenu() : openMenu());
  document.getElementById('sidebar-scrim').addEventListener('click', closeMenu);
  document.getElementById('reset-button').addEventListener('click', resetAll);
  document.getElementById('download-notes').addEventListener('click', downloadNotes);
  document.getElementById('copy-help-message').addEventListener('click', async () => {
    const message = 'I completed _____. My next question or challenge is _____.';
    try {
      await navigator.clipboard.writeText(message);
      showToast('Message starter copied.');
    } catch (_) {
      showToast('Copy this message: ' + message);
    }
  });
  document.querySelectorAll('[data-check-item]').forEach(box => box.addEventListener('change', () => { state.checklist[box.dataset.checkItem] = box.checked; saveState(); updateChecklist(); }));

  initEvaluation();
  initTimers();
  updateChecklist();
  applyPreferences();
  navigate(currentPage(), true);
})();
