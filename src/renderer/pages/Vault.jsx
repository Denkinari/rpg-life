import React, { useState, useEffect } from 'react';

const Vault = () => {
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    category: 'Geral',
    type: 'income', // income (entrada) ou expense (saída)
  });

  // Carrega o histórico financeiro ao abrir a página
  useEffect(() => {
    const loadData = async () => {
      const data = await window.api.getFinances();
      setTransactions(data || []);
    };
    loadData();
  }, []);

  const handleAddTransaction = async () => {
    if (!newTx.description || !newTx.amount) return;

    const txData = { ...newTx, amount: parseFloat(newTx.amount) };
    const res = await window.api.addTransaction(txData);

    if (res.id) {
      // Atualiza a lista colocando a nova transação no topo
      setTransactions([
        { ...txData, id: res.id, date: res.date },
        ...transactions,
      ]);
      setNewTx({ ...newTx, description: '', amount: '' }); // Limpa os campos
    }
  };

  const handleDelete = async (id) => {
    const res = await window.api.deleteTransaction(id);
    if (res.success) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  // Calcula o saldo total
  const balance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  return (
    <div className="p-8 h-screen flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-yellow-500/20 pb-2">
        <h2 className="text-3xl font-bold text-yellow-500">
          THE VAULT{' '}
          <span className="text-sm font-normal text-gray-400">
            // Gestão de Recursos
          </span>
        </h2>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block">
            Saldo Atual
          </span>
          <span
            className={`text-2xl font-black ${balance >= 0 ? 'text-green-400' : 'text-red-500'}`}
          >
            R$ {balance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Painel de Registro de Transação */}
      <div className="bg-[#252525] p-4 rounded-lg border-l-4 border-yellow-500 shadow-xl flex gap-4 items-end z-20">
        <div className="w-32">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Tipo
          </label>
          <select
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white outline-none text-sm focus:border-yellow-500"
            value={newTx.type}
            onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
          >
            <option value="income">Entrada (+)</option>
            <option value="expense">Saída (-)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Descrição
          </label>
          <input
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white focus:border-yellow-500 outline-none text-sm"
            placeholder="Ex: Pagamento Cliente (Edição), Assinatura Mensal..."
            value={newTx.description}
            onChange={(e) =>
              setNewTx({ ...newTx, description: e.target.value })
            }
          />
        </div>
        <div className="w-32">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white focus:border-yellow-500 outline-none text-sm"
            placeholder="0.00"
            value={newTx.amount}
            onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
          />
        </div>
        <button
          onClick={handleAddTransaction}
          className={`${newTx.type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white font-black text-xs py-3 px-6 rounded transition-colors`}
        >
          {newTx.type === 'income' ? '+ ADICIONAR LOOT' : '- REGISTRAR GASTO'}
        </button>
      </div>

      {/* Histórico Financeiro */}
      <div className="flex-1 bg-[#0a0a0a] rounded-lg border border-gray-800 p-6 overflow-y-auto shadow-inner">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
          Registro de Atividades
        </h3>

        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-600 text-xs uppercase tracking-widest mt-10">
              O cofre está vazio.
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-[#1A1A1A] border border-gray-800 p-3 rounded hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-green-400' : 'bg-red-500'}`}
                  ></div>
                  <span className="text-white text-sm font-medium">
                    {tx.description}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-500'}`}
                  >
                    {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-gray-600 hover:text-red-500 text-[10px] uppercase font-bold tracking-widest"
                  >
                    [ X ]
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Vault;
