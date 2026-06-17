const form = document.getElementById('dream-form');
const submitBtn = document.getElementById('submit-btn');
const message = document.getElementById('form-message');
const overlay = document.getElementById('success-overlay');

const requiredFields = ['childName', 'address', 'email', 'phone', 'dreamDescription'];

function setMessage(text, type) {
  message.textContent = text || '';
  message.className = 'form-message' + (type ? ' ' + type : '');
}

function validate() {
  let valid = true;
  for (const id of requiredFields) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
    }
  }
  return valid;
}

// הסרת סימון השגיאה ברגע שמתחילים להקליד
form.querySelectorAll('input, textarea').forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('invalid'));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setMessage('');

  if (!validate()) {
    setMessage('נא למלא את כל שדות החובה המסומנים ב־*', 'error');
    return;
  }

  const payload = {
    childName: form.childName.value.trim(),
    address: form.address.value.trim(),
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
      overlay.hidden = false;
      // לאחר שליחה מוצלחת לא מאפשרים למלא שוב
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
