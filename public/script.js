const form = document.getElementById('dream-form');
const submitBtn = document.getElementById('submit-btn');
const message = document.getElementById('form-message');
const overlay = document.getElementById('success-overlay');

const NEIGHBORHOOD_NAMES = [
  'בר אילן',
  'ותיקה',
  'חפציבה',
  'קריה חרדית',
  'רמה א',
  'רמה ב',
  'רמה ג1',
  'רמה ג2',
  'רמה ד',
  'רמה ה',
  'רמת אברהם',
].sort((a, b) => a.localeCompare(b, 'he'));

const NEIGHBORHOOD_NOT_FOUND = 'לא מצאתי את השכונה שלי';

const VALID_NEIGHBORHOODS = [...NEIGHBORHOOD_NAMES, NEIGHBORHOOD_NOT_FOUND];

const neighborhoodInput = document.getElementById('neighborhood');
const neighborhoodList = document.getElementById('neighborhood-list');
const neighborhoodCombobox = document.getElementById('neighborhood-combobox');

const requiredFields = ['childName', 'neighborhood', 'email', 'phone', 'dreamDescription'];

let highlightedIndex = -1;

function setMessage(text, type) {
  message.textContent = text || '';
  message.className = 'form-message' + (type ? ' ' + type : '');
}

function normalizeSearch(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function filterNeighborhoods(query) {
  const normalized = normalizeSearch(query);
  const filtered = normalized
    ? NEIGHBORHOOD_NAMES.filter((name) => name.includes(normalized))
    : [...NEIGHBORHOOD_NAMES];

  return [...filtered, NEIGHBORHOOD_NOT_FOUND];
}

function setListOpen(isOpen) {
  neighborhoodInput.setAttribute('aria-expanded', String(isOpen));
  neighborhoodList.hidden = !isOpen;
  neighborhoodCombobox.classList.toggle('open', isOpen);
}

function renderNeighborhoodOptions(options) {
  neighborhoodList.innerHTML = '';

  if (!options.length) {
    const empty = document.createElement('li');
    empty.className = 'combobox-empty';
    empty.textContent = 'לא נמצאה שכונה מתאימה';
    empty.setAttribute('role', 'presentation');
    neighborhoodList.appendChild(empty);
    highlightedIndex = -1;
    return;
  }

  options.forEach((name) => {
    const item = document.createElement('li');
    item.className = 'combobox-option';
    if (name === NEIGHBORHOOD_NOT_FOUND) {
      item.classList.add('combobox-option-fallback');
    }
    item.textContent = name;
    item.setAttribute('role', 'option');
    item.dataset.value = name;
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectNeighborhood(name);
    });
    neighborhoodList.appendChild(item);
  });

  highlightedIndex = -1;
}

function highlightOption(index) {
  const options = neighborhoodList.querySelectorAll('.combobox-option');
  options.forEach((el, i) => el.classList.toggle('highlighted', i === index));
  if (options[index]) {
    options[index].scrollIntoView({ block: 'nearest' });
  }
}

function selectNeighborhood(name) {
  neighborhoodInput.value = name;
  neighborhoodInput.classList.remove('invalid');
  setListOpen(false);
  highlightedIndex = -1;
}

function openNeighborhoodList() {
  const options = filterNeighborhoods(neighborhoodInput.value);
  renderNeighborhoodOptions(options);
  setListOpen(true);
}

function isValidNeighborhood(value) {
  return VALID_NEIGHBORHOODS.includes(normalizeSearch(value));
}

function validate() {
  let valid = true;

  for (const id of requiredFields) {
    const el = document.getElementById(id);
    const value = el.value.trim();

    if (!value) {
      el.classList.add('invalid');
      valid = false;
      continue;
    }

    if (id === 'neighborhood' && !isValidNeighborhood(value)) {
      el.classList.add('invalid');
      valid = false;
      continue;
    }

    el.classList.remove('invalid');
  }

  return valid;
}

neighborhoodInput.addEventListener('focus', () => {
  openNeighborhoodList();
});

neighborhoodInput.addEventListener('input', () => {
  neighborhoodInput.classList.remove('invalid');
  openNeighborhoodList();
});

neighborhoodInput.addEventListener('keydown', (e) => {
  const options = neighborhoodList.querySelectorAll('.combobox-option');
  if (!options.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!neighborhoodList.hidden) {
      highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
      highlightOption(highlightedIndex);
    } else {
      openNeighborhoodList();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    highlightOption(highlightedIndex);
  } else if (e.key === 'Enter' && highlightedIndex >= 0) {
    e.preventDefault();
    selectNeighborhood(options[highlightedIndex].dataset.value);
  } else if (e.key === 'Escape') {
    setListOpen(false);
    highlightedIndex = -1;
  }
});

document.addEventListener('click', (e) => {
  if (!neighborhoodCombobox.contains(e.target)) {
    setListOpen(false);
    highlightedIndex = -1;
  }
});

form.querySelectorAll('input:not(#neighborhood), textarea').forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('invalid'));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setMessage('');

  if (!validate()) {
    const neighborhoodValue = neighborhoodInput.value.trim();
    if (neighborhoodValue && !isValidNeighborhood(neighborhoodValue)) {
      setMessage('נא לבחור שכונה מתוך הרשימה', 'error');
    } else {
      setMessage('נא למלא את כל שדות החובה המסומנים ב־*', 'error');
    }
    return;
  }

  const payload = {
    childName: form.childName.value.trim(),
    address: normalizeSearch(form.neighborhood.value),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    dreamDescription: form.dreamDescription.value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const res = await fetch('/api/dreams/landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      form.reset();
      setListOpen(false);
      overlay.hidden = false;
      submitBtn.classList.remove('loading');
      return;
    }

    setMessage(data.message || 'אופס, משהו השתבש. נסו שוב בעוד רגע.', 'error');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  } catch (err) {
    setMessage('בעיית תקשורת עם השרת. בדקו את החיבור ונסו שוב.', 'error');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});
