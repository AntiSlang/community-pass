import React, { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, toNano } from 'ton-core';
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

  // --- ФУНКЦИЯ ПРОВЕРКИ NFT ---
  const checkOwnership = async (address: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://tonapi.io/v2/accounts/${address}/nfts?collection=${COLLECTION_ADDRESS}`);
      const data = await response.json();
      
      if (data.nft_items && data.nft_items.length > 0) {
        const index = data.nft_items[0].index;
        setNftData({ owned: true, index: index });
      } else {
        setNftData({ owned: false });
      }
    } catch (e) {
      console.error("Ошибка при проверке NFT:", e);
    }
    setLoading(false);
  };

  // --- ФУНКЦИЯ МИНТА NFT ---
  const mintNft = async () => {
    const body = beginCell()
      .storeUint(0x2F47783B, 32)
      .storeUint(0, 64)
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: COLLECTION_ADDRESS,
          amount: toNano("0.10").toString(),
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert("Транзакция отправлена! Подождите около 15 секунд и обновите страницу.");
    } catch (e) {
      alert("Ошибка: " + e);
    }
  };

  // --- 1. Читаем ОБЩУЮ статистику напрямую со смарт-контракта ---
  const fetchVotingStats = async () => {
    try {
      const res = await fetch(`https://tonapi.io/v2/blockchain/accounts/${COLLECTION_ADDRESS}/methods/get_voting_stats`);
      const data = await res.json();
      
      if (data.success && data.stack.length === 4) {
        // parseInt безопасно парсит и hex (0x...) и обычные числа
        setVoteStats({
          yes: parseInt(data.stack[0].num),
          no: parseInt(data.stack[1].num),
          raise: parseInt(data.stack[2].num),
          total: parseInt(data.stack[3].num),
        });
      }
    } catch (e) {
      console.error("Ошибка загрузки статистики со смарт-контракта:", e);
    }
  };

  // --- 2. Читаем ЛИЧНЫЙ голос юзера со смарт-контракта ---
  const fetchUserVote = async (address: string) => {
    try {
      const res = await fetch(`https://tonapi.io/v2/blockchain/accounts/${COLLECTION_ADDRESS}/methods/get_user_vote?args=${address}`);
      const data = await res.json();
      
      // 👈 Добавил проверку на наличие данных в stack
      if (data.success && data.stack && data.stack.length > 0 && data.stack[0].type === 'num') {
        const val = parseInt(data.stack[0].num);
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
    fetchVotingStats(); 
    if (userAddress) {
      checkOwnership(userAddress);
      fetchUserVote(userAddress);
    } else {
      setNftData(null);
      setVote(null);
    }
  }, [userAddress]);

  // --- 3. ОТПРАВЛЯЕМ ТРАНЗАКЦИЮ ГОЛОСОВАНИЯ ---
  const handleVote = async (option: string) => {
    const body = beginCell()
      .storeUint(0, 32)
      .storeStringTail(option)
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: COLLECTION_ADDRESS,
          amount: toNano("0.05").toString(), 
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert("Транзакция отправлена в блокчейн! Статистика обновится через ~15 секунд.");
      setVote(option); 
      setTimeout(fetchVotingStats, 15000); 
    } catch (e) {
      alert("Ошибка или отмена: " + e);
    }
  };

  // --- ФУНКЦИЯ ДЛЯ ОТРИСОВКИ ШКАЛЫ ГОЛОСОВАНИЯ ---
  const renderProgressBar = (option: 'yes' | 'no' | 'raise', label: string, color: string) => {
    const count = voteStats[option] || 0;
    const percent = voteStats.total > 0 ? Math.round((count / voteStats.total) * 100) : 0;
    
    return (
      <div style={{ marginBottom: '15px', textAlign: 'left', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
          <span>{label}</span>
          <span>{percent}% ({count})</span>
        </div>
        <div style={{ width: '100%', backgroundColor: '#444', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, backgroundColor: color, height: '100%', transition: 'width 0.4s ease-in-out' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="App" style={{ backgroundColor: '#111', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <header style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <TonConnectButton />
      </header>

      <main style={{ textAlign: 'center', padding: '20px', border: '1px solid #333', borderRadius: '20px', background: '#1a1a1a', maxWidth: '500px', width: '90%' }}>
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
            <p>Наш чат: <a href="https://t.me/+RxLNa8Oqxv_IgCqd" target="_blank" rel="noreferrer" style={{color: '#0088cc'}}>перейти</a></p>

            {/* БЛОК ОПРОСА ДЛЯ УЧАСТНИКОВ */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#2a2a2a', borderRadius: '15px', border: '1px solid #444' }}>
              <h3>🗳 Голосование сообщества</h3>
              <p style={{ marginBottom: '20px' }}>Понизить стоимость минта до 0.15 TON?</p>
              
              {/* РИСУЕМ КРАСИВЫЕ ПРОГРЕСС-БАРЫ */}
              {renderProgressBar('yes', 'Да', '#4caf50')}
              {renderProgressBar('no', 'Нет', '#f44336')}
              {renderProgressBar('raise', 'Повысить до 0.3', '#ff9800')}

              {/* КНОПКИ ДЛЯ ГОЛОСОВАНИЯ */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleVote('vote_yes')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: vote === 'vote_yes' ? '2px solid white' : 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: '#4caf50', opacity: vote === 'vote_yes' ? 1 : 0.7 }}
                >
                  Да
                </button>
                <button 
                  onClick={() => handleVote('vote_no')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: vote === 'vote_no' ? '2px solid white' : 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: '#f44336', opacity: vote === 'vote_no' ? 1 : 0.7 }}
                >
                  Нет
                </button>
                <button 
                  onClick={() => handleVote('vote_raise')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: vote === 'vote_raise' ? '2px solid white' : 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: '#ff9800', opacity: vote === 'vote_raise' ? 1 : 0.7 }}
                >
                  До 0.3
                </button>
              </div>
              {vote && (
                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '15px' }}>
                  Ваш голос учтен в блокчейне. Всего голосов: {voteStats.total}.
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