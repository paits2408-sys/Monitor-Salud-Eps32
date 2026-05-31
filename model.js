// ════════════════════════════════════════
//  MODEL — SmartSafe
//  Gestiona datos, Firebase y estado de la app
// ════════════════════════════════════════

import { initializeApp }                                        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get, push }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut,
         onAuthStateChanged, createUserWithEmailAndPassword,
         sendPasswordResetEmail }                               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── CONFIG ──
const firebaseConfig = {
  apiKey:      "AIzaSyBmnBU4vvv5Sz9G6ywHJYQqiBnfe5Q2vu4",
  authDomain:  "monitor-salud-esp32.firebaseapp.com",
  databaseURL: "https://monitor-salud-esp32-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:   "monitor-salud-esp32"
};

const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);

// ════════════════════════════════════════
//  SUSCRIPCIONES EN TIEMPO REAL
// ════════════════════════════════════════

/**
 * Escucha los datos del paciente en Firebase.
 * @param {function} callback  Recibe el objeto de datos del paciente.
 */
export function escucharPaciente(callback) {
  onValue(ref(db, 'paciente'), snap => {
    callback(snap.val() || {});
  });
}

/**
 * Escucha las mediciones BPM, SpO2 y estado del ESP32.
 * @param {function} callback  Recibe { bpm, spo2, estado }.
 */
export function escucharMedicion(callback) {
  onValue(ref(db, 'medicion/bpm'),    s => callback({ campo: 'bpm',    valor: s.val() }));
  onValue(ref(db, 'medicion/spo2'),   s => callback({ campo: 'spo2',   valor: s.val() }));
  onValue(ref(db, 'medicion/estado'), s => callback({ campo: 'estado', valor: s.val() }));
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════

/**
 * Observa cambios en el estado de autenticación.
 * @param {function} callback  Recibe el usuario o null.
 */
export function escucharAuth(callback) {
  onAuthStateChanged(auth, callback);
}

/**
 * Verifica si ya existe un administrador registrado.
 * @returns {Promise<boolean>}
 */
export async function verificarAdminRegistrado() {
  try {
    const snap = await get(ref(db, 'config/adminRegistrado'));
    return snap.exists() && snap.val() === true;
  } catch (e) {
    return false; // Si hay error de lectura, asumir que no hay admin
  }
}

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Cierra la sesión del usuario actual.
 * @returns {Promise}
 */
export function logout() {
  return signOut(auth);
}

/**
 * Crea una cuenta de administrador en Firebase Auth y marca la bandera en RTDB.
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export async function registrarAdmin(email, password) {
  // Doble verificación: no debe existir admin previo
  const snap = await get(ref(db, 'config/adminRegistrado'));
  if (snap.exists() && snap.val() === true) {
    throw new Error('Ya existe una cuenta de administrador registrada.');
  }
  await createUserWithEmailAndPassword(auth, email, password);
  await set(ref(db, 'config/adminRegistrado'), true);
}

/**
 * Envía un correo de recuperación de contraseña.
 * @param {string} email
 * @returns {Promise}
 */
export function recuperarPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Obtiene el email del usuario actualmente autenticado.
 * @returns {string}
 */
export function getUsuarioActual() {
  return auth.currentUser ? auth.currentUser.email : 'desconocido';
}

// ════════════════════════════════════════
//  DATOS DEL PACIENTE
// ════════════════════════════════════════

/**
 * Guarda los datos del paciente y registra una entrada en el historial.
 * @param {Object} datos
 * @returns {Promise}
 */
export async function guardarPaciente(datos) {
  const usuario   = getUsuarioActual();
  const ahora     = new Date();
  const fechaHora = ahora.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const isoUTC = ahora.toISOString();

  const entradaHistorial = {
    fecha:    fechaHora,
    fechaISO: isoUTC,
    usuario:  usuario,
    datos:    datos
  };

  await update(ref(db, 'paciente'), datos);
  await push(ref(db, 'historial'), entradaHistorial);
}

/**
 * Obtiene el historial de cambios completo desde Firebase.
 * @returns {Promise<Array>}
 */
export async function obtenerHistorial() {
  const snap = await get(ref(db, 'historial'));
  if (!snap.exists()) return [];
  const registros = [];
  snap.forEach(child => registros.push({ id: child.key, ...child.val() }));
  registros.reverse(); // más reciente primero
  return registros;
}

// ════════════════════════════════════════
//  VALIDACIONES
// ════════════════════════════════════════

/**
 * Evalúa la fortaleza de una contraseña.
 * @param {string} pwd
 * @returns {{ hasLen: boolean, hasUpper: boolean, hasNum: boolean, score: number }}
 */
export function evaluarPassword(pwd) {
  const hasLen   = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum   = /[0-9]/.test(pwd);
  const score    = [hasLen, hasUpper, hasNum].filter(Boolean).length;
  return { hasLen, hasUpper, hasNum, score };
}
