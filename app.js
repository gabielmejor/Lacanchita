// ─────────────────── DATOS ───────────────────
const USUARIOS = [
  { email: 'juan@demo.com',  pass: '1234',  nombre: 'Juan García',       avatar: 'JG' },
  { email: 'maria@demo.com', pass: '5678',  nombre: 'María López',       avatar: 'ML' },
  { email: 'admin@demo.com', pass: 'admin', nombre: 'Admin SportZone',   avatar: 'SZ' },
];

const CANCHAS = [
  { id: 'f1', nombre: 'Fútbol 5 — Norte',  tipo: 'futbol',  emoji: '⚽', jugadores: '5 vs 5',   superficie: 'Césped Sintético', precio: 4500 },
  { id: 'f2', nombre: 'Fútbol 5 — Sur',    tipo: 'futbol',  emoji: '⚽', jugadores: '5 vs 5',   superficie: 'Césped Sintético', precio: 4500 },
  { id: 'f3', nombre: 'Fútbol 11',         tipo: 'futbol',  emoji: '⚽', jugadores: '11 vs 11', superficie: 'Grass Natural',    precio: 7500 },
  { id: 'p1', nombre: 'Pádel — Cancha A',  tipo: 'padel',   emoji: '🎾', jugadores: '2 vs 2',   superficie: 'Moqueta',          precio: 3500 },
  { id: 'p2', nombre: 'Pádel — Cancha B',  tipo: 'padel',   emoji: '🎾', jugadores: '2 vs 2',   superficie: 'Moqueta',          precio: 3500 },
  { id: 't1', nombre: 'Tenis — Tierra',    tipo: 'tenis',   emoji: '🎾', jugadores: '1 vs 1',   superficie: 'Tierra Batida',    precio: 3000 },
  { id: 'b1', nombre: 'Básquet',           tipo: 'basquet', emoji: '🏀', jugadores: '5 vs 5',   superficie: 'Madera Dura',      precio: 4000 },
  { id: 'v1', nombre: 'Vóley',             tipo: 'basquet', emoji: '🏐', jugadores: '6 vs 6',   superficie: 'Parquet',          precio: 3200 },
];

const HORAS = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'
];

// ─────────────────── HELPERS ───────────────────
function getFechaStr(diasDesdeHoy) {
  const d = new Date();
  d.setDate(d.getDate() + diasDesdeHoy);
  return d.toISOString().split('T')[0];
}

function generarOcupados() {
  const ocup = {};
  CANCHAS.forEach(c => {
    ocup[c.id] = {};
    for (let d = 0; d < 14; d++) {
      const fecha = getFechaStr(d);
      ocup[c.id][fecha] = [];
      const numOcup = Math.floor(Math.random() * 6) + 2;
      const shuffled = [...HORAS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numOcup; i++) {
        ocup[c.id][fecha].push(shuffled[i]);
      }
    }
  });
  return ocup;
}

// ─────────────────── ESTADO ───────────────────
let currentUser  = null;
let selectedDate = getFechaStr(0);
let selectedCourt = null;
let cart = [];          // { courtId, courtNombre, hora, label, precio, fecha }
let ocupados = generarOcupados();
let misReservas = {};   // misReservas[courtId][fecha] = [hora, ...]

// ─────────────────── LOGIN ───────────────────
function fillDemo(email, pass) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-pass').value  = pass;
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const user  = USUARIOS.find(u => u.email === email && u.pass === pass);
  const errorEl = document.getElementById('login-error');

  if (!user) {
    errorEl.classList.add('visible');
    document.getElementById('login-pass').value = '';
    return;
  }

  errorEl.classList.remove('visible');
  currentUser = user;
  document.getElementById('nav-username').textContent = user.nombre;
  document.getElementById('nav-avatar').textContent   = user.avatar;
  document.getElementById('login-overlay').classList.add('hidden');
  showToast('✅', `¡Bienvenido/a, ${user.nombre.split(' ')[0]}!`, 'success');
  renderStats();
}

function handleLogout() {
  currentUser   = null;
  cart          = [];
  selectedCourt = null;
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  renderBookingPanel();
}

// ─────────────────── DATES ───────────────────
function renderDates() {
  const container = document.getElementById('date-row');
  const dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  container.innerHTML = '';

  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const str  = d.toISOString().split('T')[0];
    const chip = document.createElement('div');
    chip.className = 'date-chip' + (str === selectedDate ? ' active' : '');
    chip.innerHTML = `
      <div class="date-chip-day">${dias[d.getDay()]}</div>
      <div class="date-chip-num">${d.getDate()}</div>
      <div class="date-chip-month">${meses[d.getMonth()]}</div>
    `;
    chip.onclick = () => {
      selectedDate = str;
      renderDates();
      if (selectedCourt) renderSchedule();
      renderStats();
    };
    container.appendChild(chip);
  }
}

// ─────────────────── COURTS ───────────────────
function renderCourts() {
  const container = document.getElementById('courts-grid');
  container.innerHTML = '';

  CANCHAS.forEach(c => {
    const card = document.createElement('div');
    card.className = `court-card ${c.tipo}${selectedCourt === c.id ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="court-selected-check">✓</div>
      <div class="court-sport-badge badge-${c.tipo}">${c.emoji} ${c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)}</div>
      <div class="court-name">${c.nombre}</div>
      <div class="court-info">
        <div class="court-info-item">👥 ${c.jugadores}</div>
        <div class="court-info-item">🏃 ${c.superficie}</div>
      </div>
      <div class="court-price">
        <div class="price-amount">$${c.precio.toLocaleString('es-AR')}</div>
        <div class="price-label">/ hora</div>
      </div>
    `;
    card.onclick = () => {
      selectedCourt = c.id;
      renderCourts();
      renderSchedule();
    };
    container.appendChild(card);
  });
}

// ─────────────────── SCHEDULE GRID ───────────────────
function renderSchedule() {
  if (!selectedCourt) return;
  const cancha = CANCHAS.find(c => c.id === selectedCourt);
  document.getElementById('schedule-court-name').textContent =
    `${cancha.emoji} ${cancha.nombre} — ${selectedDate}`;

  const container = document.getElementById('schedule-grid-container');
  let html = `<div class="schedule-grid" style="--cols:1; grid-template-columns: 90px 1fr; max-width:500px;">`;

  // Header
  html += `<div class="grid-header-cell" style="background:transparent;"></div>`;
  html += `<div class="grid-header-cell">${cancha.nombre}</div>`;

  // Filas de horario
  HORAS.forEach((hora, idx) => {
    if (idx === HORAS.length - 1) return; // última hora solo marca el fin
    const horaFin  = HORAS[idx + 1];
    const label     = `${hora}–${horaFin}`;
    const keyOcup   = ocupados[selectedCourt]?.[selectedDate] || [];
    const keyMias   = misReservas[selectedCourt]?.[selectedDate] || [];
    const enCarrito = cart.some(i => i.courtId === selectedCourt && i.hora === hora && i.fecha === selectedDate);

    let slotClass, slotText;
    if (keyMias.includes(hora)) {
      slotClass = 'slot-tuyo';        slotText = '🔒 Tuya';
    } else if (enCarrito) {
      slotClass = 'slot-seleccionado'; slotText = '✓ Elegida';
    } else if (keyOcup.includes(hora)) {
      slotClass = 'slot-ocupado';     slotText = 'Ocupado';
    } else {
      slotClass = 'slot-libre';       slotText = 'Disponible';
    }

    html += `<div class="grid-time-cell">${hora}</div>`;
    html += `<div class="slot ${slotClass}"
      data-court="${selectedCourt}" data-hora="${hora}" data-label="${label}"
      onclick="toggleSlot('${selectedCourt}','${hora}','${label}')">
      ${slotText}
    </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function toggleSlot(courtId, hora, label) {
  const keyOcup = ocupados[courtId]?.[selectedDate] || [];
  const keyMias = misReservas[courtId]?.[selectedDate] || [];
  if (keyOcup.includes(hora) || keyMias.includes(hora)) return;

  const idx    = cart.findIndex(i => i.courtId === courtId && i.hora === hora && i.fecha === selectedDate);
  const cancha = CANCHAS.find(c => c.id === courtId);

  if (idx >= 0) {
    cart.splice(idx, 1);
    showToast('🗑️', `Turno ${label} removido`, 'error');
  } else {
    cart.push({ courtId, courtNombre: cancha.nombre, hora, label, precio: cancha.precio, fecha: selectedDate });
    showToast('✅', `Turno ${label} agregado`, 'success');
  }

  renderSchedule();
  renderBookingPanel();
}

// ─────────────────── BOOKING PANEL ───────────────────
function renderBookingPanel() {
  const container = document.getElementById('booking-content');
  document.getElementById('cart-count').textContent = cart.length;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="booking-empty">
        <span class="booking-empty-icon">📋</span>
        No hay turnos seleccionados aún.<br>Elegí una cancha y un horario para comenzar.
      </div>`;
    return;
  }

  const total = cart.reduce((s, i) => s + i.precio, 0);
  let html = `<div class="booking-items">`;
  cart.forEach((item, idx) => {
    html += `
      <div class="booking-item">
        <div class="booking-item-info">
          <div class="booking-item-court">${item.courtNombre}</div>
          <div class="booking-item-time">📅 ${item.fecha} · ⏰ ${item.label}</div>
        </div>
        <div class="booking-item-price">$${item.precio.toLocaleString('es-AR')}</div>
        <button class="btn-remove" onclick="removeItem(${idx})">✕</button>
      </div>`;
  });
  html += `</div>
    <div class="booking-total">
      <div class="total-label">Total a pagar</div>
      <div class="total-amount">$${total.toLocaleString('es-AR')}</div>
    </div>
    <button class="btn-confirm" onclick="confirmBooking()" ${currentUser ? '' : 'disabled'}>
      CONFIRMAR RESERVA →
    </button>`;
  container.innerHTML = html;
}

function removeItem(idx) {
  cart.splice(idx, 1);
  showToast('🗑️', 'Turno removido', 'error');
  renderSchedule();
  renderBookingPanel();
}

// ─────────────────── CONFIRMAR ───────────────────
function confirmBooking() {
  if (!currentUser || cart.length === 0) return;

  // Guardar reservas del usuario
  cart.forEach(item => {
    if (!misReservas[item.courtId]) misReservas[item.courtId] = {};
    if (!misReservas[item.courtId][item.fecha]) misReservas[item.courtId][item.fecha] = [];
    misReservas[item.courtId][item.fecha].push(item.hora);
  });

  // Armar detalles del modal
  const total = cart.reduce((s, i) => s + i.precio, 0);
  let detailsHtml = `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Usuario</span>
      <span class="modal-detail-value">${currentUser.nombre}</span>
    </div>
    <div class="modal-detail-row">
      <span class="modal-detail-label">Turnos reservados</span>
      <span class="modal-detail-value">${cart.length}</span>
    </div>`;
  cart.forEach(item => {
    detailsHtml += `
      <div class="modal-detail-row">
        <span class="modal-detail-label">${item.courtNombre}</span>
        <span class="modal-detail-value">${item.fecha} · ${item.label}</span>
      </div>`;
  });
  detailsHtml += `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Total pagado</span>
      <span class="modal-detail-value">$${total.toLocaleString('es-AR')}</span>
    </div>`;

  document.getElementById('modal-text').textContent =
    `¡Listo, ${currentUser.nombre.split(' ')[0]}! Tu reserva fue procesada. Te esperamos en SportZone.`;
  document.getElementById('modal-details').innerHTML = detailsHtml;
  document.getElementById('confirm-modal').classList.add('visible');

  cart = [];
  renderSchedule();
  renderBookingPanel();
  renderStats();
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('visible');
}

// ─────────────────── STATS ───────────────────
function renderStats() {
  let libres = 0;
  CANCHAS.forEach(c => {
    const ocup = ocupados[c.id]?.[selectedDate] || [];
    const mias = misReservas[c.id]?.[selectedDate] || [];
    libres += (HORAS.length - 1) - ocup.length - mias.length;
  });
  document.getElementById('stat-disponibles').textContent = libres;
}

// ─────────────────── TOAST ───────────────────
let toastTimer;
function showToast(icon, msg, type) {
  const el = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent  = msg;
  el.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ─────────────────── EVENTOS ───────────────────
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-email').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-pass').focus();
});

// ─────────────────── INIT ───────────────────
renderDates();
renderCourts();
renderBookingPanel();
renderStats();