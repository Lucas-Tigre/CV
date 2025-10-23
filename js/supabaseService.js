import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

// Cria o cliente Supabase uma única vez
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Envia a pontuação de um jogador para a tabela 'leaderboard'.
 * @param {string} username - O nome do jogador.
 * @param {number} score - A pontuação do jogador (partículas absorvidas).
 * @returns {Promise<object|null>} O resultado da inserção ou null em caso de erro.
 */
export async function submitScore(username, score) {
    if (!username || typeof score !== 'number') {
        console.error("Nome de usuário ou pontuação inválida.");
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .insert([{ username, score }]);

        if (error) {
            console.error('Erro ao enviar pontuação:', error);
            return null;
        }

        console.log('Pontuação enviada com sucesso:', data);
        return data;
    } catch (error) {
        console.error('Falha inesperada ao enviar pontuação:', error);
        return null;
    }
}

/**
 * Busca os 10 melhores jogadores da tabela 'leaderboard'.
 * @returns {Promise<Array<object>>} Uma lista com os melhores jogadores ou uma lista vazia em caso de erro.
 */
export async function getLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('username, score')
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Erro ao buscar placar:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Falha inesperada ao buscar placar:', error);
        return [];
    }
}
