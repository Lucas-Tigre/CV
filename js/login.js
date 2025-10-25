import { supabase } from './supabaseService.js';

// ===== ELEMENTOS =====
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMsg = document.getElementById('authMsg');
const googleLoginBtn = document.getElementById("googleLoginBtn");
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetPasswordModal = document.getElementById('resetPasswordModal');
const closeModal = document.getElementById('closeModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const guestModeBtn = document.getElementById('guestModeBtn');
const guestModeModal = document.getElementById('guestModeModal');
const guestConfirmBtn = document.getElementById('guestConfirmBtn');
const guestCancelBtn = document.getElementById('guestCancelBtn');

const showMsg = (text, type = "success") => {
  if (!authMsg) return;
  authMsg.textContent = text;
  authMsg.className = `msg ${type}`;
};
const clearMsg = () => showMsg("");

// ===== LÓGICA QUE NÃO DEPENDE DO SUPABASE =====

// Troca de Abas
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const paneId = btn.getAttribute('data-tab');
    const pane = document.getElementById(paneId);
    if(pane) pane.classList.add('active');
  });
});

// Modal de Redefinição de Senha
forgotPasswordLink?.addEventListener('click', (e) => {
  e.preventDefault();
  resetPasswordModal?.classList.add('active');
});

closeModal?.addEventListener('click', () => {
  resetPasswordModal?.classList.remove('active');
});

resetPasswordModal?.addEventListener('click', (e) => {
  if (e.target === resetPasswordModal) {
    resetPasswordModal.classList.remove('active');
  }
});

// Modo Convidado
guestModeBtn?.addEventListener('click', () => {
  guestModeModal?.classList.add('active');
});

guestCancelBtn?.addEventListener('click', () => {
  guestModeModal?.classList.remove('active');
});

guestModeModal?.addEventListener('click', (e) => {
  if (e.target === guestModeModal) {
    guestModeModal.classList.remove('active');
  }
});

guestConfirmBtn?.addEventListener('click', () => {
  localStorage.setItem('username', 'Convidado');
  window.location.href = 'game.html';
});

// ===== LÓGICA QUE DEPENDE DO SUPABASE =====

if (supabase) {
  // Se o Supabase foi inicializado, adicione os eventos que dependem dele.

  // LOGIN COM GOOGLE
  googleLoginBtn?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) showMsg("Erro ao entrar com Google: " + error.message, "error");
  });

  // CADASTRO
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const usuario = document.getElementById('regUsuario').value.trim().toLowerCase();
    const senha = document.getElementById('regSenha').value;

    if (senha.length < 6) {
        showMsg("A senha deve ter pelo menos 6 caracteres.", "error");
        return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome, username: usuario } }
    });
    if (error) return showMsg("Erro ao cadastrar: " + error.message, "error");
    showMsg("Conta criada! Verifique seu e-mail para confirmação.", "success");
    registerForm.reset();
    document.querySelector('.tab[data-tab="login-pane"]').click();
  });

  // LOGIN
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    if (!email.includes('@')) return showMsg("Por favor, insira um e-mail válido.", "error");

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return showMsg("Seu e-mail ainda não foi confirmado.", "error");
      }
      return showMsg("Erro ao entrar: " + error.message, "error");
    }
  });

  // ESTADO DE AUTENTICAÇÃO
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        const username = session.user.user_metadata?.full_name || session.user.user_metadata?.username || session.user.email;
        localStorage.setItem('username', username);
        showMsg("Login bem-sucedido! Redirecionando...", "success");
        setTimeout(() => { window.location.href = 'game.html'; }, 1000);
    }
  });

  // LOGOUT
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('username');
      showMsg("Você saiu da conta.", "success");
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  });

  // Checa sessão ativa
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      localStorage.setItem('username', session.user.user_metadata?.full_name || session.user.email);
      window.location.href = 'game.html';
    }
  });

  // Redefinição de Senha
  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = document.getElementById('resetEmail').value.trim().toLowerCase();
    if (!email.includes('@')) return showMsg("Por favor, insira um e-mail válido.", "error");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return showMsg("Erro ao enviar e--mail: " + error.message, "error");
    showMsg("E-mail de redefinição enviado!", "success");
    resetPasswordModal.classList.remove('active');
  });

} else {
  // Se o Supabase não foi inicializado, desabilite os formulários e mostre o erro.
  console.warn("Credenciais do Supabase não configuradas. A autenticação está desativada.");
  document.getElementById('loginForm')?.remove();
  document.getElementById('registerForm')?.remove();
  document.getElementById('googleLoginBtn')?.remove();
  document.querySelector('.container.auth').innerHTML += '<p class="msg error">A autenticação não está configurada corretamente.</p>';
}
