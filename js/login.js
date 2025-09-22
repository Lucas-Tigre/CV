document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const startGameBtn = document.getElementById('start-game-btn');

    // Estado do Login
    let isLoggedIn = false;

    // Função para abrir o modal
    function openModal() {
        if (loginModal) loginModal.style.display = 'flex';
    }

    // Função para fechar o modal
    function closeModal() {
        if (loginModal) loginModal.style.display = 'none';
    }

    // Função para atualizar a UI após o login
    function updateUIAfterLogin(username) {
        // Habilita o botão de iniciar o jogo
        if (startGameBtn) {
            startGameBtn.disabled = false;
        }
        // Altera o botão de login para mostrar o nome do usuário
        if (loginTriggerBtn) {
            loginTriggerBtn.textContent = `👤 ${username}`;
            loginTriggerBtn.disabled = true; // Impede de abrir o modal novamente
        }
        // Fecha o modal
        closeModal();
    }

    // Event Listeners
    if (loginTriggerBtn) {
        loginTriggerBtn.addEventListener('click', openModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Fecha o modal se o usuário clicar fora dele
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeModal();
            }
        });
    }

    // Lida com o envio do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();

            if (username) {
                isLoggedIn = true;
                localStorage.setItem('username', username);
                updateUIAfterLogin(username);
            } else {
                alert('Por favor, insira um nome de usuário.');
            }
        });
    }

    // Lida com o clique no botão de iniciar o jogo
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (isLoggedIn) {
                window.location.href = 'game.html';
            } else {
                alert('Você precisa fazer o login primeiro!');
            }
        });
    }
});
