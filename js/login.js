document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
    const startGameBtn = document.getElementById('start-game-btn');
    const startGamePrompt = document.getElementById('start-game-prompt');

    // Estado do Login
    let isLoggedIn = false;

    // Função para validar a senha
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push("Pelo menos 8 caracteres.");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Pelo menos 1 letra minúscula.");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Pelo menos 1 letra maiúscula.");
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push("Pelo menos 1 símbolo (@$!%*?&).");
        }
        return errors;
    }

    // Função para abrir o modal
    function openModal() {
        if (loginModal) loginModal.style.display = 'flex';
    }

    // Função para fechar o modal
    function closeModal() {
        if (loginModal) loginModal.style.display = 'none';
        passwordError.textContent = ''; // Limpa os erros ao fechar
    }

    // Função para atualizar a UI após o login
    function updateUIAfterLogin(username) {
        if (startGameBtn) {
            startGameBtn.disabled = false;
        }
        if (loginTriggerBtn) {
            loginTriggerBtn.textContent = `👤 ${username}`;
            loginTriggerBtn.disabled = true;
        }
        if (startGamePrompt) {
            startGamePrompt.textContent = 'Universo aguardando. Pressione Iniciar!';
        }
        closeModal();
    }

    // Event Listeners
    if (loginTriggerBtn) {
        loginTriggerBtn.addEventListener('click', openModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeModal();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const validationErrors = validatePassword(password);

            if (username && validationErrors.length === 0) {
                isLoggedIn = true;
                localStorage.setItem('username', username);
                updateUIAfterLogin(username);
            } else {
                if (!username) {
                    passwordError.textContent = 'Por favor, insira um nome de usuário.';
                } else {
                    passwordError.textContent = 'Senha inválida: ' + validationErrors.join(' ');
                }
            }
        });
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (isLoggedIn) {
                window.location.href = 'game.html';
            }
            // O botão está desabilitado, então não precisamos de um 'else'.
        });
    }
});
