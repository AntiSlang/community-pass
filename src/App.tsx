import React, { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from 'ton-core';
import './App.css';

const COLLECTION_ADDRESS = "EQBvG0IcQOjrroo-mIjuKVNns1bRA7jETrFZUPsA3njleYWI";

function App() {
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [nftData, setNftData] = useState<{ owned: boolean, index?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Стейты для DAO
  const [vote, setVote] = useState<string | null>(null);
  const [voteStats, setVoteStats] = useState({ yes: 0, no: 0, raise: 0, total: 0 });

  // 1. Читаем ОБЩУЮ статистику напрямую со смарт-контракта
  const fetchVotingStats = async () => {
    try {
      const res = await fetch(`https://tonapi.io/v2/blockchain/accounts/${COLLECTION_ADDRESS}/methods/get_voting_stats`);
      const data = await res.json();
      
      // TonAPI возвращает массив stack, где лежат наши цифры в HEX формате
      if (data.success && data.stack.length === 4) {
        setVoteStats({
          yes: parseInt(data.stack[0].num, 16),
          no: parseInt(data.stack[1].num, 16),
          raise: parseInt(data.stack[2].num, 16),
          total: parseInt(data.stack[3].num, 16),
        });
      }
    } catch (e) {
      console.error("Ошибка загрузки статистики со смарт-контракта:", e);
    }
  };

  // 2. Читаем ЛИЧНЫЙ голос юзера со смарт-контракта (если он уже голосовал)
  const fetchUserVote = async (address: string) => {
    try {
      // Передаем адрес кошелька как аргумент в геттер
      const res = await fetch(`https://tonapi.io/v2/blockchain/accounts/${COLLECTION_ADDRESS}/methods/get_user_vote?args=${address}`);
      const data = await res.json();
      
      // Если юзер голосовал, вернется число (1, 2 или 3). Если нет — type будет "null"
      if (data.success && data.stack[0].type === 'num') {
        const val = parseInt(data.stack[0].num, 16);
        if (val === 1) setVote('vote_yes');
        if (val === 2) setVote('vote_no');
        if (val === 3) setVote('vote_raise');
      }
    } catch (e) {
      console.error("Ошибка загрузки голоса пользователя:", e);
    }
  };

  // Вызываем при загрузке
  useEffect(() => {
    fetchVotingStats(); // Статистика грузится всегда
    if (userAddress) {
      checkOwnership(userAddress);
      fetchUserVote(userAddress); // Голос конкретного человека
    } else {
      setNftData(null);
      setVote(null);
    }
  }, [userAddress]);

  // 3. ОТПРАВЛЯЕМ ТРАНЗАКЦИЮ ГОЛОСОВАНИЯ В БЛОКЧЕЙН
  const handleVote = async (option: string) => {
    // Формируем текстовое сообщение: записываем нули (опкод текста) и саму строку
    const body = beginCell()
      .storeUint(0, 32)
      .storeStringTail(option)
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: COLLECTION_ADDRESS,
          amount: toNano("0.02").toString(), // Сумма газа (остаток вернется)
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert("Транзакция отправлена в блокчейн! Статистика обновится через ~15 секунд.");
      setVote(option); // Оптимистично меняем UI
      
      // Блокчейну нужно время на запись блока, обновляем через 15 сек
      setTimeout(fetchVotingStats, 15000); 
    } catch (e) {
      alert("Ошибка или отмена: " + e);
    }
  };

  return (
    <div className="App" style={{ backgroundColor: '#111', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <header style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <TonConnectButton />
      </header>

      <main style={{ textAlign: 'center', padding: '20px', border: '1px solid #333', borderRadius: '20px', background: '#1a1a1a' }}>
        <h1>Community Pass 🎫</h1>
        
        {!userAddress ? (
          <p>Пожалуйста, подключите кошелек TON</p>
        ) : loading ? (
          <p>Проверяем блокчейн...</p>
       ) : nftData?.owned ? (
          <div>
            <h2 style={{ color: '#4caf50' }}>✅ Доступ разрешен</h2>
            <div style={{ fontSize: '24px', margin: '20px 0', padding: '20px', background: '#222', borderRadius: '10px' }}>
              CommunityPass #{nftData.index}
            </div>
            <p>Вы являетесь участником сообщества.</p>
            <p>Наш чат: https://t.me/+RxLNa8Oqxv_IgCqd</p>

            {/* БЛОК ОПРОСА ДЛЯ УЧАСТНИКОВ */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#2a2a2a', borderRadius: '15px', border: '1px solid #444' }}>
              <h3>🗳 Голосование сообщества</h3>
              <p>Понизить стоимость минта до 0.15 TON?</p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleVote('vote_yes')}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: vote === 'yes' ? '#4caf50' : '#444' }}
                >
                  Да
                </button>
                <button 
                  onClick={() => handleVote('vote_no')}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: vote === 'no' ? '#f44336' : '#444' }}
                >
                  Нет
                </button>
                <button 
                  onClick={() => handleVote('vote_raise')}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: vote === 'raise' ? '#ff9800' : '#444' }}
                >
                  Повысить до 0.3
                </button>
              </div>
              {vote && (
                <p style={{ color: '#aaa', fontSize: '13px', marginTop: '15px' }}>
                  Ваш голос учтен. Вы можете изменить его в любой момент.
                </p>
              )}
            </div>

          </div>
        ) : (
          <div>
            <p>У вас пока нет пропуска в наше сообщество.</p>
            <button 
              onClick={mintNft}
              style={{ padding: '15px 30px', fontSize: '18px', borderRadius: '10px', border: 'none', backgroundColor: '#0088cc', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Получить CommunityPass
            </button>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Цена: ~0.07 TON (только газ)</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
