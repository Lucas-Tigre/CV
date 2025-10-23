
import { getLeaderboard } from './supabaseService.js';

/**
 * Busca os dados da tabela de classificação e os exibe na tela de Game Over.
 */
export async function displayLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    // Limpa a tabela antes de preencher
    leaderboardBody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    const scores = await getLeaderboard();

    if (scores.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="3">Nenhuma pontuação registrada ainda.</td></tr>';
        return;
    }

    leaderboardBody.innerHTML = ''; // Limpa a mensagem de "Carregando..."

    scores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(entry.username)}</td>
            <td>${entry.score}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

/**
 * Escapa caracteres HTML para prevenir ataques de XSS.
 * @param {string} unsafe - A string a ser escapada.
 * @returns {string} A string segura para ser inserida no HTML.
 */
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
