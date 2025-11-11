import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function ensureDbInitialized(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) {
    return await initPromise;
  }
  initPromise = initDatabase();
  return await initPromise;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db; // Já inicializado
  
  try {
    console.log('🔄 Inicializando banco de dados...');
    const database = await SQLite.openDatabaseAsync('rifa.db');
    
    console.log('🔄 Criando tabelas...');
    // Criar tabela de sorteios
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS raffles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prize_name TEXT NOT NULL,
        prize_image TEXT,
        total_numbers INTEGER NOT NULL,
        draw_date TEXT,
        number_price REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        winner_number INTEGER,
        winner_name TEXT,
        seller_name TEXT,
        status TEXT DEFAULT 'active'
      );
    `);

    // Criar tabela de participantes
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raffle_id INTEGER NOT NULL,
        participant_name TEXT NOT NULL,
        seller_name TEXT,
        numbers TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (raffle_id) REFERENCES raffles (id)
      );
    `);

    // Criar tabela de números vendidos
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sold_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raffle_id INTEGER NOT NULL,
        number INTEGER NOT NULL,
        participant_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (raffle_id) REFERENCES raffles (id),
        FOREIGN KEY (participant_id) REFERENCES participants (id),
        UNIQUE(raffle_id, number)
      );
    `);

    // Migração: Adicionar novas colunas se não existirem
    // Verificar se as colunas já existem consultando pragma
    try {
      const columns = await database.getAllAsync('PRAGMA table_info(raffles)') as any[];
      const columnNames = columns.map((col: any) => col.name);
      
      if (!columnNames.includes('draw_date')) {
        await database.execAsync('ALTER TABLE raffles ADD COLUMN draw_date TEXT;');
        console.log('✅ Coluna draw_date adicionada');
      }
      
      if (!columnNames.includes('number_price')) {
        await database.execAsync('ALTER TABLE raffles ADD COLUMN number_price REAL;');
        console.log('✅ Coluna number_price adicionada');
      }
    } catch (e) {
      console.warn('⚠️ Erro na migração de colunas:', e);
    }

    db = database;
    console.log('✅ Banco de dados inicializado com sucesso');
    return database;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    initPromise = null; // Reset para permitir retry
    throw error;
  }
}

// ==================== RAFFLES ====================

export async function createRaffle(
  prizeName: string, 
  totalNumbers: number, 
  prizeImage?: string,
  drawDate?: string,
  numberPrice?: number
) {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'INSERT INTO raffles (prize_name, prize_image, total_numbers, draw_date, number_price) VALUES (?, ?, ?, ?, ?)'
    );
    try {
      const result = await statement.executeAsync([
        prizeName, 
        prizeImage || null, 
        totalNumbers,
        drawDate || null,
        numberPrice || null
      ]);
      console.log(`✅ Sorteio criado com ID: ${result.lastInsertRowId}`);
      return result.lastInsertRowId;
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao criar sorteio:', error);
    throw error;
  }
}

export async function updateRaffleTotalNumbers(raffleId: number, additionalNumbers: number) {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'UPDATE raffles SET total_numbers = total_numbers + ? WHERE id = ?'
    );
    try {
      await statement.executeAsync([additionalNumbers, raffleId]);
      console.log(`✅ ${additionalNumbers} números adicionados ao sorteio ${raffleId}`);
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar números:', error);
    throw error;
  }
}

export async function setRaffleWinner(raffleId: number, winnerNumber: number, winnerName: string, sellerName: string) {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'UPDATE raffles SET winner_number = ?, winner_name = ?, seller_name = ?, status = ? WHERE id = ?'
    );
    try {
      await statement.executeAsync([winnerNumber, winnerName, sellerName, 'finished', raffleId]);
      console.log(`✅ Vencedor definido para o sorteio ${raffleId}`);
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao definir vencedor:', error);
    throw error;
  }
}

export async function getActiveRaffle() {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'SELECT * FROM raffles WHERE status = ? ORDER BY created_at DESC LIMIT 1'
    );
    try {
      const result = await statement.executeAsync<{
        id: number;
        prize_name: string;
        prize_image: string | null;
        total_numbers: number;
        draw_date: string | null;
        number_price: number | null;
        created_at: string;
        winner_number: number | null;
        winner_name: string | null;
        seller_name: string | null;
        status: string;
      }>(['active']);
      const row = await result.getFirstAsync();
      return row;
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar sorteio ativo:', error);
    throw error;
  }
}

export async function getAllRaffles() {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'SELECT * FROM raffles ORDER BY created_at DESC'
    );
    try {
      const result = await statement.executeAsync<{
        id: number;
        prize_name: string;
        prize_image: string | null;
        total_numbers: number;
        created_at: string;
        winner_number: number | null;
        winner_name: string | null;
        seller_name: string | null;
        status: string;
      }>();
      const rows = await result.getAllAsync();
      return rows;
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar sorteios:', error);
    throw error;
  }
}

export async function getFinishedRaffles() {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'SELECT * FROM raffles WHERE status = ? AND winner_number IS NOT NULL ORDER BY created_at DESC'
    );
    try {
      const result = await statement.executeAsync<{
        id: number;
        prize_name: string;
        prize_image: string | null;
        total_numbers: number;
        draw_date: string | null;
        number_price: number | null;
        created_at: string;
        winner_number: number | null;
        winner_name: string | null;
        seller_name: string | null;
        status: string;
      }>(['finished']);
      const rows = await result.getAllAsync();
      return rows;
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar sorteios finalizados:', error);
    throw error;
  }
}

// ==================== PARTICIPANTS ====================

export async function addParticipant(
  raffleId: number,
  participantName: string,
  numbers: number[],
  sellerName: string
) {
  const database = await ensureDbInitialized();
  
  try {
    // Adicionar participante
    const stmt1 = await database.prepareAsync(
      'INSERT INTO participants (raffle_id, participant_name, seller_name, numbers) VALUES (?, ?, ?, ?)'
    );
    let participantId: number;
    try {
      const result = await stmt1.executeAsync([raffleId, participantName, sellerName, numbers.join(',')]);
      participantId = result.lastInsertRowId;
    } finally {
      await stmt1.finalizeAsync();
    }

    // Adicionar números vendidos
    const stmt2 = await database.prepareAsync(
      'INSERT INTO sold_numbers (raffle_id, number, participant_id) VALUES (?, ?, ?)'
    );
    try {
      for (const number of numbers) {
        await stmt2.executeAsync([raffleId, number, participantId]);
      }
    } finally {
      await stmt2.finalizeAsync();
    }

    console.log(`✅ Participante ${participantName} adicionado com ${numbers.length} números`);
    return participantId;
  } catch (error) {
    console.error('❌ Erro ao adicionar participante:', error);
    throw error;
  }
}

export async function getParticipantsByRaffle(raffleId: number) {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'SELECT * FROM participants WHERE raffle_id = ? ORDER BY created_at DESC'
    );
    try {
      const result = await statement.executeAsync<{
        id: number;
        participant_name: string;
        seller_name: string;
        numbers: string;
        created_at: string;
      }>([raffleId]);
      const rows = await result.getAllAsync();
      return rows;
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar participantes:', error);
    throw error;
  }
}

export async function getSoldNumbers(raffleId: number) {
  const database = await ensureDbInitialized();
  
  try {
    const statement = await database.prepareAsync(
      'SELECT number FROM sold_numbers WHERE raffle_id = ? ORDER BY number'
    );
    try {
      const result = await statement.executeAsync<{ number: number }>([raffleId]);
      const rows = await result.getAllAsync();
      return rows.map(r => r.number);
    } finally {
      await statement.finalizeAsync();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar números vendidos:', error);
    throw error;
  }
}

// ==================== STATISTICS ====================

export async function getRaffleStatistics(raffleId: number) {
  const database = await ensureDbInitialized();
  
  try {
    // Buscar informações do sorteio
    const stmtRaffle = await database.prepareAsync(
      'SELECT prize_name FROM raffles WHERE id = ?'
    );
    let prizeName = '';
    try {
      const result = await stmtRaffle.executeAsync<{ prize_name: string }>([raffleId]);
      const raffle = await result.getFirstAsync();
      prizeName = raffle?.prize_name || '';
    } finally {
      await stmtRaffle.finalizeAsync();
    }

    const stmt1 = await database.prepareAsync(
      `SELECT 
        COUNT(DISTINCT participant_id) as total_participants,
        COUNT(*) as total_sold
      FROM sold_numbers 
      WHERE raffle_id = ?`
    );
    let stats: { total_participants: number; total_sold: number } | null = null;
    try {
      const result = await stmt1.executeAsync<{
        total_participants: number;
        total_sold: number;
      }>([raffleId]);
      stats = await result.getFirstAsync();
    } finally {
      await stmt1.finalizeAsync();
    }

    const stmt2 = await database.prepareAsync(
      `SELECT 
        p.seller_name,
        COUNT(*) as quantity,
        COUNT(sn.number) as total_numbers
      FROM participants p
      LEFT JOIN sold_numbers sn ON p.id = sn.participant_id
      WHERE p.raffle_id = ?
      GROUP BY p.seller_name
      ORDER BY total_numbers DESC
      LIMIT 10`
    );
    let topSellers: Array<{ seller_name: string; quantity: number; total_numbers: number }> = [];
    try {
      const result = await stmt2.executeAsync<{
        seller_name: string;
        quantity: number;
        total_numbers: number;
      }>([raffleId]);
      topSellers = await result.getAllAsync();
    } finally {
      await stmt2.finalizeAsync();
    }

    // Ranking de compradores (participantes)
    const stmt3 = await database.prepareAsync(
      `SELECT 
        p.participant_name,
        p.seller_name,
        COUNT(sn.number) as quantity,
        p.numbers
      FROM participants p
      LEFT JOIN sold_numbers sn ON p.id = sn.participant_id
      WHERE p.raffle_id = ?
      GROUP BY p.id
      ORDER BY quantity DESC`
    );
    let topBuyers: Array<{ 
      participant_name: string; 
      seller_name: string;
      quantity: number;
      numbers: string;
    }> = [];
    try {
      const result = await stmt3.executeAsync<{
        participant_name: string;
        seller_name: string;
        quantity: number;
        numbers: string;
      }>([raffleId]);
      topBuyers = await result.getAllAsync();
    } finally {
      await stmt3.finalizeAsync();
    }

    return {
      prizeName,
      totalParticipants: stats?.total_participants || 0,
      totalSold: stats?.total_sold || 0,
      topSellers: topSellers || [],
      topBuyers: topBuyers || [],
    };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

export async function getChartData() {
  const database = await ensureDbInitialized();
  
  try {
    // Buscar todos os sorteios com seus valores
    const raffles = await database.getAllAsync<{
      id: number;
      prize_name: string;
      status: string;
      number_price: number | null;
    }>('SELECT id, prize_name, status, number_price FROM raffles');

    // Para cada sorteio, buscar números vendidos e calcular valor arrecadado
    const raffleData = await Promise.all(
      raffles.map(async (raffle) => {
        const soldCount = await database.getAllAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM sold_numbers WHERE raffle_id = ?',
          [raffle.id]
        );
        
        const totalNumbers = soldCount[0]?.count || 0;
        const totalValue = (raffle.number_price || 0) * totalNumbers;
        
        return {
          prize_name: raffle.prize_name,
          status: raffle.status,
          total_numbers: totalNumbers,
          total_value: totalValue,
        };
      })
    );

    // Buscar vendas por vendedor (todos os sorteios)
    const sellerStats = await database.getAllAsync<{
      seller_name: string;
      total_rifas: number;
      total_numbers: number;
    }>(`
      SELECT 
        p.seller_name,
        COUNT(DISTINCT p.id) as total_rifas,
        COUNT(sn.number) as total_numbers
      FROM participants p
      LEFT JOIN sold_numbers sn ON p.id = sn.participant_id
      WHERE p.seller_name IS NOT NULL
      GROUP BY p.seller_name
      ORDER BY total_numbers DESC
      LIMIT 10
    `);

    return {
      raffleData,
      sellerStats,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados dos gráficos:', error);
    throw error;
  }
}

export { db };

