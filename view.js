// ════════════════════════════════════════
//  VIEW — SmartSafe
//  Manipulación del DOM y renderizado
// ════════════════════════════════════════

// ════════════════════════════════════════
//  NAVEGACIÓN (control de pantallas)
// ════════════════════════════════════════

/**
 * Activa una vista desactivando todas las demás.
 * @param {string} id  ID del elemento .view a activar.
 */
export function mostrarVista(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ════════════════════════════════════════
//  HELPERS DE DOM
// ════════════════════════════════════════

/** Establece el texto interior de un elemento por ID. */
export function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val !== null && val !== undefined) el.innerText = val;
}

/** Establece el valor de un input por ID. */
export function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== null && val !== undefined) el.value = val;
}

/** Muestra u oculta un elemento añadiendo/quitando la clase 'show'. */
export function toggleShow(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  show ? el.classList.add('show') : el.classList.remove('show');
}

/** Obtiene el valor recortado de un input por ID. */
export function getInputVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Habilita o deshabilita un botón y opcionalmente cambia su contenido HTML. */
export function setBtnState(id, disabled, html = null) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = disabled;
  if (html !== null) btn.innerHTML = html;
}

// ════════════════════════════════════════
//  FICHA PÚBLICA — renderizar datos del paciente
// ════════════════════════════════════════

/**
 * Renderiza los datos del paciente en la vista pública.
 * @param {Object} d  Datos del paciente provenientes de Firebase.
 */
export function renderPacientePublico(d) {
  setText('nombre',       d.nombre        || '— —');
  setText('documento',    d.documento      || '--');
  setText('edad',         d.edad           || '--');
  setText('rh',           d.sangre         || '--');
  setText('eps',          d.eps            || '--');
  setText('alergias',     d.alergias       || '--');
  setText('medicamentos', d.medicamentos   || '--');
  setText('urgencias',    d.urgencias      || '--');
  setText('contacto',     d.contacto       || '--');
}

/**
 * Rellena el formulario del panel admin con los datos del paciente.
 * @param {Object} d  Datos del paciente.
 */
export function renderPacienteAdmin(d) {
  setVal('f-nombre',       d.nombre         || '');
  setVal('f-documento',    d.documento      || '');
  setVal('f-edad',         d.edad           || '');
  setVal('f-sangre',       d.sangre         || '');
  setVal('f-eps',          d.eps            || '');
  setVal('f-urgencias',    d.urgencias      || '');
  setVal('f-alergias',     d.alergias       || '');
  setVal('f-medicamentos', d.medicamentos   || '');
  setVal('f-contacto',     d.contacto       || '');
}

// ════════════════════════════════════════
//  MEDICIONES — BPM, SpO2, Estado
// ════════════════════════════════════════

/**
 * Actualiza los indicadores de medición en todas las vistas.
 * @param {{ campo: string, valor: any }} medicion
 */
export function renderMedicion({ campo, valor }) {
  if (campo === 'bpm') {
    setText('bpm',       valor);
    setText('admin-bpm', valor);
  }
  if (campo === 'spo2') {
    setText('spo2',       valor);
    setText('admin-spo2', valor);
  }
  if (campo === 'estado') {
    if (!valor) return;
    // Vista pública
    setText('estadoText', valor);
    const dot = document.getElementById('estadoDot');
    if (dot) valor === 'EMERGENCIA' ? dot.classList.add('emergencia') : dot.classList.remove('emergencia');
    // Vista admin
    setText('admin-estadoText', valor);
    const adot = document.getElementById('admin-estadoDot');
    if (adot) valor === 'EMERGENCIA' ? adot.classList.add('emergencia') : adot.classList.remove('emergencia');
  }
}

// ════════════════════════════════════════
//  INDICADOR DE FORTALEZA DE CONTRASEÑA
// ════════════════════════════════════════

/**
 * Actualiza los elementos de la UI del medidor de fortaleza.
 * @param {string} pwd    Contraseña actual.
 * @param {{ hasLen, hasUpper, hasNum, score }} evaluacion
 */
export function renderStrength(pwd, { hasLen, hasUpper, hasNum, score }) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  const reqLen   = document.getElementById('req-len');
  const reqUpper = document.getElementById('req-upper');
  const reqNum   = document.getElementById('req-num');

  if (!fill || !label) return;

  reqLen.classList.toggle('ok',   hasLen);
  reqUpper.classList.toggle('ok', hasUpper);
  reqNum.classList.toggle('ok',   hasNum);

  const colors = ['#ef4444', '#f59e0b', '#22d3a5'];
  const labels = ['Débil', 'Regular', 'Fuerte'];
  const widths = ['33%', '66%', '100%'];

  if (pwd.length === 0) {
    fill.style.width = '0%';
    label.textContent = 'Ingresa una contraseña';
    label.style.color = 'var(--muted)';
    return;
  }
  fill.style.width      = widths[score - 1] || '10%';
  fill.style.background = score > 0 ? colors[score - 1] : '#ef4444';
  label.textContent     = score > 0 ? labels[score - 1] : 'Muy débil';
  label.style.color     = score > 0 ? colors[score - 1] : '#ef4444';
}

// ════════════════════════════════════════
//  FLUJO DE REGISTRO (3 pasos)
// ════════════════════════════════════════

/** Avanza del paso 1 al paso 2 del formulario de registro. */
export function regMostrarPaso2(email) {
  document.getElementById('confirmEmail').innerText = email;
  document.getElementById('reg-step1').style.display = 'none';
  document.getElementById('reg-step2').style.display = 'block';
  document.getElementById('step1').classList.replace('active', 'done');
  document.getElementById('step1').querySelector('.step-circle').textContent = '✓';
  document.getElementById('line1').classList.add('done');
  document.getElementById('step2').classList.add('active');
}

/** Retrocede del paso 2 al paso 1 del formulario de registro. */
export function regMostrarPaso1() {
  document.getElementById('reg-step2').style.display = 'none';
  document.getElementById('reg-step1').style.display = 'block';
  document.getElementById('step2').classList.remove('active');
  document.getElementById('step1').classList.replace('done', 'active');
  document.getElementById('step1').querySelector('.step-circle').textContent = '1';
  document.getElementById('line1').classList.remove('done');
  toggleShow('regError2', false);
}

/** Muestra el paso 3 (éxito) tras crear la cuenta. */
export function regMostrarPaso3(email) {
  document.getElementById('successEmail').innerText = email;
  document.getElementById('reg-step2').style.display = 'none';
  document.getElementById('reg-step3').style.display = 'block';
  document.getElementById('step2').classList.replace('active', 'done');
  document.getElementById('step2').querySelector('.step-circle').textContent = '✓';
  document.getElementById('line2').classList.add('done');
  document.getElementById('step3').classList.add('active');
  document.getElementById('step3').querySelector('.step-circle').textContent = '✓';
}

// ════════════════════════════════════════
//  ESTADO DEL GUARDADO (admin)
// ════════════════════════════════════════

/**
 * Muestra el estado del guardado (ok / err / vacío).
 * @param {'ok'|'err'|''} tipo
 * @param {string} mensaje
 */
export function renderSaveStatus(tipo, mensaje) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.className = tipo ? `save-status ${tipo}` : 'save-status';
  el.innerText = mensaje;
}

// ════════════════════════════════════════
//  HISTORIAL (admin)
// ════════════════════════════════════════

/** Muestra un mensaje de carga en el historial. */
export function renderHistorialCargando() {
  const el = document.getElementById('historialLista');
  if (el) el.innerHTML = '<div class="hist-loading">Cargando historial...</div>';
}

/**
 * Renderiza las filas del historial de cambios.
 * @param {Array} registros
 */
export function renderHistorial(registros) {
  const contenedor = document.getElementById('historialLista');
  if (!contenedor) return;

  if (!registros.length) {
    contenedor.innerHTML = '<div class="hist-empty">Sin registros aún.</div>';
    return;
  }

  contenedor.innerHTML = registros.map((r, i) => `
    <div class="hist-row ${i === 0 ? 'hist-latest' : ''}">
      <div class="hist-meta">
        <span class="hist-fecha">📅 ${r.fecha}</span>
        <span class="hist-user">👤 ${r.usuario}</span>
      </div>
      <div class="hist-campos">
        ${Object.entries(r.datos || {}).map(([k, v]) => v ? `<span class="hist-campo"><b>${k}:</b> ${v}</span>` : '').join('')}
      </div>
    </div>
  `).join('');
}

/** Muestra un error en el historial. */
export function renderHistorialError(mensaje) {
  const contenedor = document.getElementById('historialLista');
  if (contenedor) contenedor.innerHTML = `<div class="hist-empty">Error: ${mensaje}</div>`;
}

// ════════════════════════════════════════
//  MENSAJES DE ERROR EN FORMULARIOS
// ════════════════════════════════════════

/**
 * Muestra un mensaje de error en un elemento.
 * @param {string} id       ID del elemento de error.
 * @param {string} mensaje
 * @param {string} [color]  Color de texto opcional.
 */
export function mostrarError(id, mensaje, color = null) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = mensaje;
  if (color) el.style.color = color;
  el.classList.add('show');
}

/** Oculta el elemento de error. */
export function ocultarError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}
