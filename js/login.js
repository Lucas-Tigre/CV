document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o envio real do formulário.

            const username = usernameInput.value.trim();

            // Lógica de login simulado:
            // Apenas verifica se um nome de usuário foi inserido.
            if (username) {
                // Salva o nome de usuário para talvez usar no jogo (opcional).
                localStorage.setItem('username', username);

                // Redireciona para a página do jogo.
                window.location.href = 'game.html';
            } else {
                // Poderia adicionar um feedback de erro aqui.
                alert('Por favor, insira um nome de usuário.');
            }
        });
    }
});
