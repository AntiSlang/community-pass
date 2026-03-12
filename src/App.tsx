import React, { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from 'ton-core';
import './App.css';

// ТВОЙ АДРЕС КОНТРАКТА (Mainnet)
const COLLECTION_ADDRESS = "EQC5ViPcJ2tTUgIAIf5jXhHDBnqHAAZsTgul7YoLvxBo85mo";

function App() {
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [nftData, setNftData] = useState<{ owned: boolean, index?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Функция проверки наличия NFT через TonAPI
  const checkOwnership = async (address: string) => {
    setLoading(true);
    try {
      // Используем публичный API TonAPI для Mainnet
      const response = await fetch(`https://tonapi.io/v2/accounts/${address}/nfts?collection=${COLLECTION_ADDRESS}`);
      const data = await response.json();
      
      if (data.nft_items && data.nft_items.length > 0) {
        // Берем индекс первой найденной NFT
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

  useEffect(() => {
    if (userAddress) {
      checkOwnership(userAddress);
    } else {
      setNftData(null);
    }
  }, [userAddress]);

  // 2. Функция Минта (создания) NFT
  // 1. ВСТАВЬ НОВЫЙ АДРЕС ИЗ ТЕРМИНАЛА (он НЕ будет EQBDRBE...)
  const mintNft = async () => {
    // УДАЛИ СТРОКУ: const COLLECTION_ADDRESS = "..." (она уже есть вверху)

    const body = beginCell()
      .storeUint(0x2f4b3c3b, 32) // Твой правильный Opcode
      .storeUint(0, 64)
      .endCell();

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: COLLECTION_ADDRESS,
          amount: toNano("0.1").toString(),
          payload: body.toBoc().toString("base64"),
        },
      ],
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert("Транзакция отправлена!");
    } catch (e) {
      alert("Ошибка: " + e);
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
