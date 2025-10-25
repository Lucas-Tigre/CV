// Versão Final e Corrigida do js/login.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

// Tenta inicializar o Supabase, mas não trava se falhar
let supabase = null;
if (SUPABASE_URL && !SUPABASE_URL.includes("SUA_URL") && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("SUA_CHAVE")) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
  }
}

// ===== ELEMENTOS =====
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMsg = document.getElementById('authMsg');
const privateArea = document.getElementById('privateArea');
const welcomeUser = document.getElementById('welcomeUser');
const logoutBtn = document.getElementById('logoutBtn');
const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestModeBtn = document.getElementById('guestModeBtn');
const guestModeModal = document.getElementById('guestModeModal');
const guestConfirmBtn = document.getElementById('guestConfirmBtn');
const guestCancelBtn = document.getElementById('guestCancelBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetPasswordModal = document.getElementById('resetPasswordModal');
const closeModal = document.getElementById('closeModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');

const showMsg = (text, type = "success") => {
  if (!authMsg) return;
  authMsg.textContent = text;
  authMsg.className = `msg ${type}`;
};

// ===== LÓGICA GERAL (SEMPRE EXECUTA) =====

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

guestModeBtn?.addEventListener('click', () => {
  guestModeModal?.classList.add('active');
});
guestCancelBtn?.addEventListener('click', () => {
  guestModeModal?.classList.remove('active');
});
guestModeModal?.addEventListener('click', (e) => {
  if (e.target === guestModeModal) guestModeModal.classList.remove('active');
});
guestConfirmBtn?.addEventListener('click', () => {
  localStorage.setItem('username', 'Convidado');
  window.location.href = 'game.html';
});

// ===== LÓGICA DEPENDENTE DO SUPABASE =====

if (supabase) {
  googleLoginBtn?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) showMsg("Erro: " + error.message, "error");
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const usuario = document.getElementById('regUsuario').value.trim().toLowerCase();
    const senha = document.getElementById('regSenha').value;

    const { error } = await supabase.auth.signUp({
      email, password: senha, options: { data: { full_name: nome, username: usuario } }
    });
    if (error) return showMsg("Erro: " + error.message, "error");
    showMsg("Conta criada! Verifique seu e-mail.", "success");
    registerForm.reset();
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userOrEmail = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email: userOrEmail, password: pass });
    if (error) return showMsg("Erro: " + error.message, "error");

    // Armazena o nome do usuário e redireciona
    if (data.user) {
        localStorage.setItem('username', data.user.user_metadata?.full_name || data.user.email);
        showMsg("Login bem-sucedido! Redirecionando...", "success");
        setTimeout(() => { window.location.href = 'game.html'; }, 1000);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        // Se já está logado, redireciona direto
        localStorage.setItem('username', session.user.user_metadata?.full_name || session.user.email);
        window.location.href = 'game.html';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showMsg("Você saiu da conta.", "success");
  });

  forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    resetPasswordModal?.classList.add('active');
  });
  closeModal?.addEventListener('click', () => {
    resetPasswordModal?.classList.remove('active');
  });
  resetPasswordModal?.addEventListener('click', (e) => {
    if (e.target === resetPasswordModal) resetPasswordModal.classList.remove('active');
  });
  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) return showMsg("Erro: " + error.message, "error");
    showMsg("E-mail de redefinição enviado!", "success");
    resetPasswordModal.classList.remove('active');
  });

} else {
  console.warn("Supabase não configurado. Funcionalidades online desativadas.");
  loginForm?.remove();
  registerForm?.remove();
  googleLoginBtn?.remove();
  forgotPasswordLink?.remove();
  authMsg.innerHTML = "Modo online indisponível. <br> Verifique as credenciais ou jogue como convidado.";
  authMsg.className = "msg error";
}
