// ════════════════════════════════════════
//  CONTROLLER — SmartSafe
//  Orquesta Model y View, maneja eventos
// ════════════════════════════════════════

import {
  escucharPaciente,
  escucharMedicion,
  escucharAuth,
  verificarAdminRegistrado,
  login,
  logout,
  registrarAdmin,
  recuperarPassword,
  guardarPaciente,
  obtenerHistorial,
  evaluarPassword,
} from './model.js';

import {
  mostrarVista,
  renderPacientePublico,
  renderPacienteAdmin,
  renderMedicion,
  renderStrength,
  regMostrarPaso2,
  regMostrarPaso1,
  regMostrarPaso3,
  renderSaveStatus,
  renderHistorialCargando,
  renderHistorial,
  renderHistorialError,
  mostrarError,
  ocultarError,
  getInputVal,
  setBtnState,
} from './view.js';

// ════════════════════════════════════════
//  INICIALIZACIÓN
// ════════════════════════════════════════

function init() {
  _suscribirDatosFirebase();
  _suscribirAuth();
  _bindEventos();
  mostrarVista('view-inicio');
  _initQR();
}

// ════════════════════════════════════════
//  QR
// ════════════════════════════════════════

function _initQR() {
  // QRCode viene de un script clásico; esperamos a que esté disponible
  if (typeof QRCode === 'undefined') {
    setTimeout(_initQR, 100);
    return;
  }
  const el = document.getElementById('qrcode');
  if (!el) return;
  const urlPagina = window.location.href.split('?')[0];
  new QRCode(el, {
    text: urlPagina, width: 180, height: 180,
    colorDark: '#0a1628', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ════════════════════════════════════════
//  SUSCRIPCIONES A FIREBASE
// ════════════════════════════════════════

function _suscribirDatosFirebase() {
  escucharPaciente(datos => {
    renderPacientePublico(datos);
    renderPacienteAdmin(datos);
  });

  escucharMedicion(medicion => {
    renderMedicion(medicion);
  });
}

function _suscribirAuth() {
  escucharAuth(user => {
    if (user && !user.isAnonymous) {
      const viewLogin = document.getElementById('view-login');
      if (viewLogin && viewLogin.classList.contains('active')) {
        mostrarVista('view-admin');
        cargarHistorial();
      }
    }
  });
}

// ════════════════════════════════════════
//  NAVEGACIÓN
// ════════════════════════════════════════

export function showInicio()   { mostrarVista('view-inicio'); }
export function showInfo()     { mostrarVista('view-info'); }
export function showAcceso()   { mostrarVista('view-acceso'); }
export function showPublic()   { mostrarVista('view-public'); }
export function showLogin() {
  mostrarVista('view-login');
  setTimeout(() => document.getElementById('loginEmail').focus(), 300);
}
export function showAdmin() {
  mostrarVista('view-admin');
  setTimeout(() => cargarHistorial(), 400);
}
export function showRegistro() { mostrarVista('view-registro'); }

export function goToAcceso()   { showAcceso(); }
export function goToRegistro() { showRegistro(); }

// ════════════════════════════════════════
//  BOTÓN FLOTANTE ADMIN
// ════════════════════════════════════════

export function onFabClick() {
  if (window._verificarAdmin) {
    window._verificarAdmin();
  } else {
    setTimeout(onFabClick, 300);
  }
}

async function verificarAdmin() {
  const existe = await verificarAdminRegistrado();
  existe ? showLogin() : showRegistro();
}

// ════════════════════════════════════════
//  AUTH — LOGIN
// ════════════════════════════════════════

export async function doLogin() {
  const email    = getInputVal('loginEmail');
  const password = getInputVal('loginPassword');

  ocultarError('loginError');
  setBtnState('btnLogin', true, '<span class="spinner"></span> Verificando...');

  try {
    await login(email, password);
    showAdmin();
  } catch (e) {
    mostrarError('loginError', 'Credenciales incorrectas. Inténtalo de nuevo.');
    setBtnState('btnLogin', false, 'Ingresar al panel');
  }
}

// ════════════════════════════════════════
//  AUTH — LOGOUT
// ════════════════════════════════════════

export async function doLogout() {
  await logout();
  showPublic();
}

// ════════════════════════════════════════
//  AUTH — RECUPERAR CONTRASEÑA
// ════════════════════════════════════════

export async function recuperarPasswordHandler() {
  const email = getInputVal('loginEmail');
  if (!email || !email.includes('@')) {
    mostrarError('loginError', 'Ingresa primero tu correo electrónico.', '#fbbf24');
    return;
  }
  try {
    await recuperarPassword(email);
    const el = document.getElementById('loginError');
    if (el) {
      el.innerText = '✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.';
      el.style.color       = 'var(--green)';
      el.style.background  = 'rgba(34,211,165,0.1)';
      el.style.borderColor = 'rgba(34,211,165,0.3)';
      el.classList.add('show');
    }
  } catch (e) {
    mostrarError('loginError', 'No se encontró una cuenta con ese correo.', '#f87171');
  }
}

// ════════════════════════════════════════
//  REGISTRO — 3 PASOS
// ════════════════════════════════════════

export function regNextStep() {
  const email = getInputVal('regEmail');
  const pwd   = document.getElementById('regPassword').value;
  const pwd2  = document.getElementById('regPassword2').value;

  ocultarError('regError');

  if (!email || !email.includes('@')) {
    mostrarError('regError', 'Ingresa un correo electrónico válido.'); return;
  }
  if (pwd.length < 8) {
    mostrarError('regError', 'La contraseña debe tener al menos 8 caracteres.'); return;
  }
  if (!/[A-Z]/.test(pwd)) {
    mostrarError('regError', 'La contraseña debe tener al menos una letra mayúscula.'); return;
  }
  if (!/[0-9]/.test(pwd)) {
    mostrarError('regError', 'La contraseña debe tener al menos un número.'); return;
  }
  if (pwd !== pwd2) {
    mostrarError('regError', 'Las contraseñas no coinciden.'); return;
  }

  regMostrarPaso2(email);
}

export function regVolver() {
  regMostrarPaso1();
}

export async function doRegistro() {
  const email = getInputVal('regEmail');
  const pwd   = document.getElementById('regPassword').value;

  ocultarError('regError2');
  setBtnState('btnRegFinal', true, '<span class="spinner"></span> Creando cuenta...');

  try {
    await registrarAdmin(email, pwd);
    regMostrarPaso3(email);
  } catch (e) {
    let msg = 'Error al crear la cuenta. Intenta de nuevo.';
    if (e.code === 'auth/email-already-in-use') msg = 'Este correo ya tiene una cuenta registrada.';
    if (e.code === 'auth/invalid-email')         msg = 'El formato del correo no es válido.';
    if (e.code === 'auth/weak-password')          msg = 'La contraseña es demasiado débil.';
    if (e.message)                                msg = e.message;
    mostrarError('regError2', msg);
    setBtnState('btnRegFinal', false, 'Crear mi cuenta');
  }
}

export function regTerminar() { showAdmin(); }

// ════════════════════════════════════════
//  CONTRASEÑA — medidor en tiempo real
// ════════════════════════════════════════

export function checkPassword() {
  const pwd        = document.getElementById('regPassword').value;
  const evaluacion = evaluarPassword(pwd);
  renderStrength(pwd, evaluacion);
}

// ════════════════════════════════════════
//  GUARDAR DATOS (admin)
// ════════════════════════════════════════

export async function guardarDatos() {
  setBtnState('btnSave', true, '<span class="spinner"></span> Guardando...');
  renderSaveStatus('', '');

  const datos = {
    nombre:       getInputVal('f-nombre'),
    documento:    getInputVal('f-documento'),
    edad:         getInputVal('f-edad'),
    sangre:       getInputVal('f-sangre'),
    eps:          getInputVal('f-eps'),
    urgencias:    getInputVal('f-urgencias'),
    alergias:     getInputVal('f-alergias'),
    medicamentos: getInputVal('f-medicamentos'),
    contacto:     getInputVal('f-contacto'),
  };

  try {
    await guardarPaciente(datos);
    renderSaveStatus('ok', '✅ Datos guardados y registrados en el historial');
    cargarHistorial();
  } catch (e) {
    renderSaveStatus('err', '❌ Error al guardar: ' + e.message);
  } finally {
    setBtnState('btnSave', false, 'Guardar todos los datos');
    setTimeout(() => renderSaveStatus('', ''), 4000);
  }
}

// ════════════════════════════════════════
//  HISTORIAL (admin)
// ════════════════════════════════════════

export async function cargarHistorial() {
  renderHistorialCargando();
  try {
    const registros = await obtenerHistorial();
    renderHistorial(registros);
  } catch (e) {
    renderHistorialError(e.message);
  }
}

// ════════════════════════════════════════
//  GUARDAR QR
// ════════════════════════════════════════

export function guardarQR() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'smartsafe-qr.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ════════════════════════════════════════
//  FOTO DE PERFIL (localStorage)
// ════════════════════════════════════════

function _initFotos() {
  const fotoInput = document.getElementById('fotoInput');
  if (fotoInput) {
    const saved = localStorage.getItem('smartsafe_foto');
    if (saved) document.getElementById('avatarImg').src = saved;

    fotoInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('avatarImg').src = ev.target.result;
        localStorage.setItem('smartsafe_foto', ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  const heroImgInput = document.getElementById('heroImgInput');
  if (heroImgInput) {
    const savedHero = localStorage.getItem('smartsafe_hero_img');
    if (savedHero) document.getElementById('heroImg').src = savedHero;

    heroImgInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('heroImg').src = ev.target.result;
        try { localStorage.setItem('smartsafe_hero_img', ev.target.result); } catch (ex) {}
      };
      reader.readAsDataURL(file);
    });
  }
}

// ════════════════════════════════════════
//  BINDING DE EVENTOS ESTÁTICOS
// ════════════════════════════════════════

function _bindEventos() {
  const loginPassword = document.getElementById('loginPassword');
  if (loginPassword) {
    loginPassword.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }

  _initFotos();

  const fabAdmin = document.getElementById('fabAdmin');
  if (fabAdmin) fabAdmin.addEventListener('click', onFabClick);
}

// ════════════════════════════════════════
//  EXPONER FUNCIONES GLOBALES
//  (requeridas por atributos onclick en el HTML)
// ════════════════════════════════════════

window.showInicio           = showInicio;
window.showInfo             = showInfo;
window.showAcceso           = showAcceso;
window.showPublic           = showPublic;
window.showLogin            = showLogin;
window.showAdmin            = showAdmin;
window.showRegistro         = showRegistro;
window.goToAcceso           = goToAcceso;
window.goToRegistro         = goToRegistro;
window.onFabClick           = onFabClick;
window.doLogin              = doLogin;
window.doLogout             = doLogout;
window.recuperarPassword    = recuperarPasswordHandler;
window.regNextStep          = regNextStep;
window.regVolver            = regVolver;
window.doRegistro           = doRegistro;
window.regTerminar          = regTerminar;
window.checkPassword        = checkPassword;
window.guardarDatos         = guardarDatos;
window.cargarHistorial      = cargarHistorial;
window.guardarQR            = guardarQR;
window._verificarAdmin      = verificarAdmin;

// ── ARRANQUE (DOMContentLoaded garantiza que el HTML ya está listo) ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
