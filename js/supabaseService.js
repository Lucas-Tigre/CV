
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Envia a pontuação do jogador para a tabela de classificação (leaderboard).
 *
 * IMPORTANTE: Para que esta função funcione, você precisa criar a tabela `leaderboard`
 * no seu projeto Supabase. Execute o seguinte comando no seu editor de SQL do Supabase:
 *
 * CREATE TABLE leaderboard (
 *   id SERIAL PRIMARY KEY,
 *   username TEXT NOT NULL,
 *   score INTEGER NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 *
 * @param {string} username - O nome do jogador.
 * @param {number} score - A pontuação (partículas absorvidas).
 */
export async function submitScore(username, score) {
    if (!username || typeof score !== 'number') {
        console.error("Nome de usuário ou pontuação inválida.");
        return;
    }

    try {
        const { error } = await supabase
            .from('leaderboard')
            .insert([{ username, score }]);

        if (error) {
            console.error('Erro ao enviar pontuação:', error);
        } else {
            console.log('Pontuação enviada com sucesso!');
        }
    } catch (err) {
        console.error('Erro inesperado ao enviar pontuação:', err);
    }
}

/**
 * Busca as 10 melhores pontuações da tabela de classificação.
 * @returns {Promise<Array>} Uma promessa que resolve para um array com as melhores pontuações.
 */
export async function getLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('username, score')
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Erro ao buscar leaderboard:', error);
            return [];
        }

        return data;
    } catch (err) {
        console.error('Erro inesperado ao buscar leaderboard:', err);
        return [];
    }
}
