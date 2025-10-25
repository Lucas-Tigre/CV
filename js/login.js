import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm?v=2";

// Tenta inicializar o Supabase, mas não trava se falhar
let supabase;
try {
  const SUPABASE_URL = "https://koliolijmlzifxulyejz.supabase.co"; // Substitua com sua URL
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGlvbGlqbWx6aWZ4dWx5ZWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQxNzI2ODEsImV4cCI6MTk5OTc0ODY4MX0.3SnId2t0-8T638D9-c_27-i2oN5kTWau6F09a_1_v2o"; // Substitua com sua chave

  if (!SUPABASE_URL.includes('xxx') && !SUPABASE_ANON_KEY.includes('xxx')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.error("Erro ao inicializar Supabase:", error);
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
// Adicione os novos elementos aqui
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
const clearMsg = () => showMsg("");

// ===== LÓGICA GERAL (SEMPRE EXECUTA) =====

// Troca de Abas
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
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


// ===== LÓGICA DEPENDENTE DO SUPABASE =====

if (supabase) {
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

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { full_name: nome, username: usuario } }
    });
    if (error) return showMsg("Erro ao cadastrar: " + error.message, "error");
    showMsg("Conta criada! Verifique seu e-mail.", "success");
    registerForm.reset();
    document.querySelector('.tab[data-tab="login-pane"]').click();
  });

  // LOGIN
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const userOrEmail = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;

    const { error } = await supabase.auth.signInWithPassword({
      email: userOrEmail,
      password: pass
    });
    if (error) return showMsg("Erro ao entrar: " + error.message, "error");
    showMsg("Login realizado com sucesso!", "success");
    loginForm.reset();
  });

  // ESTADO DE AUTENTICAÇÃO
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      privateArea.classList.remove('hidden');
      welcomeUser.textContent = `Bem-vindo, ${session.user.user_metadata?.full_name || session.user.email}!`;
      // Redireciona para o jogo após login bem-sucedido
      setTimeout(() => { window.location.href = 'game.html'; }, 1000);
    } else {
      privateArea.classList.add('hidden');
    }
  });

  // LOGOUT
  logoutBtn?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showMsg("Você saiu da conta.", "success");
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
  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = document.getElementById('resetEmail').value.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return showMsg("Erro ao enviar e-mail: " + error.message, "error");
    showMsg("E-mail de redefinição enviado!", "success");
    resetPasswordModal.classList.remove('active');
  });

} else {
  // Se Supabase não inicializou, desabilita os botões e formulários
  console.warn("Supabase não configurado. Funcionalidades online desativadas.");
  loginForm?.remove();
  registerForm?.remove();
  googleLoginBtn?.remove();
  forgotPasswordLink?.remove();
  authMsg.textContent = "Modo online indisponível. Jogue como convidado.";
  authMsg.className = "msg error";
}
