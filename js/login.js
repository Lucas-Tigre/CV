import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

document.addEventListener("DOMContentLoaded", () => {

  const SUPABASE_URL = "https://koliolijmlzifxulyejz.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGlvbGlqbWx6aWZ4dWx5ZWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEwNDAsImV4cCI6MjA3Mzg2NzA0MH0.s44jYbJDjZqjKwPBCdsJ5WZhmXI9xVggxMgH7IKFGYE";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const showMsg = (text, type = "success") => {
    if (!authMsg) return;
    authMsg.textContent = text;
    authMsg.className = `msg ${type}`;
  };
  const clearMsg = () => showMsg("");

  // ===== TROCA DE ABAS =====
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const paneId = btn.getAttribute('data-tab'); // Correção aqui
      const pane = document.getElementById(paneId);
      if(pane) pane.classList.add('active');
    });
  });

  // ===== LOGIN COM GOOGLE =====
  googleLoginBtn?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) showMsg("Erro ao entrar com Google: " + error.message, "error");
  });

  // ===== CADASTRO =====
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

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { full_name: nome, username: usuario }
        }
      });

      if (error) return showMsg("Erro ao cadastrar: " + error.message, "error");

      showMsg("Conta criada! Verifique seu e-mail para confirmação.", "success");
      registerForm.reset();
      document.querySelector('.tab[data-tab="login-pane"]').click();
    } catch {
      showMsg("Erro inesperado ao cadastrar.", "error");
    }
  });

  // ===== LOGIN =====
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();

    const email = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;

    // Validação de e-mail simples.
    if (!email.includes('@')) {
      return showMsg("Por favor, insira um e-mail válido.", "error");
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          return showMsg("Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.", "error");
        }
        return showMsg("Erro ao entrar: " + error.message, "error");
      }

    } catch {
      showMsg("Erro inesperado no login.", "error");
    }
  });

  // ===== ESTADO DE AUTENTICAÇÃO =====
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        const username = session.user.user_metadata?.full_name || session.user.user_metadata?.username || session.user.email;
        localStorage.setItem('username', username);

        showMsg("Login bem-sucedido! Redirecionando...", "success");
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1000);

    }
  });

    // ===== LOGOUT (Lógica de exemplo se houvesse um botão de logout nesta página) =====
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('username');
        showMsg("Você saiu da conta.", "success");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    });

  // Checa se o usuário já tem uma sessão ativa ao carregar a página
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      const username = session.user.user_metadata?.full_name || session.user.email;
      localStorage.setItem('username', username);
      window.location.href = 'game.html';
    }
  });

  // ===== LÓGICA DO MODAL DE REDEFINIÇÃO DE SENHA =====
  forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    resetPasswordModal?.classList.remove('hidden');
  });

  closeModal?.addEventListener('click', () => {
    resetPasswordModal?.classList.add('hidden');
  });

  resetPasswordModal?.addEventListener('click', (e) => {
    if (e.target === resetPasswordModal) {
      resetPasswordModal.classList.add('hidden');
    }
  });

  resetPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();
    const email = document.getElementById('resetEmail').value.trim().toLowerCase();

    if (!email.includes('@')) {
      return showMsg("Por favor, insira um e-mail válido.", "error");
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // URL para onde o usuário será redirecionado após redefinir a senha
      });

      if (error) {
        return showMsg("Erro ao enviar e-mail de redefinição: " + error.message, "error");
      }

      showMsg("E-mail de redefinição enviado! Verifique sua caixa de entrada.", "success");
      resetPasswordModal.classList.add('hidden');
    } catch {
      showMsg("Erro inesperado ao tentar redefinir a senha.", "error");
    }
  });
});
