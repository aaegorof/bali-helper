'use client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { GetTransactionsParams, Transaction } from './api/route';

const MantleTracker = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<GetTransactionsParams['searchParams']>({
    fromAddress: '0xC1C16dAA953A36Bece0d3b908110DbFDBcdf7A6B',
    toAddress: '0x8E3A13418743aB1a98434551937Ea687E451B589',
    transactionType: 'all',
    chainid: 5000,
  });

  const handleFilterChange = (key: keyof GetTransactionsParams['searchParams'], value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = async () => {
    setLoading(true);

    try {
      // Создаем URL с параметрами
      const params = new URLSearchParams();

      // Добавляем только непустые параметры
      if (filters.fromAddress) params.append('fromAddress', filters.fromAddress);
      if (filters.toAddress) params.append('toAddress', filters.toAddress);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.transactionType && filters.transactionType !== 'all')
        params.append('transactionType', filters.transactionType);

      const response = await fetch(`/mantlescanner/api/?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.result || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Ошибка при загрузке транзакций');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      fromAddress: '',
      toAddress: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      transactionType: 'all',
    });
    setTransactions([]);
  };

  const exportData = () => {
    if (transactions.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const csv = [
      ['Hash', 'From', 'To', 'Amount (MNT)', 'Date', 'Type', 'Gas Used', 'Gas Price'],
      ...transactions.map((tx) => [
        tx.hash,
        tx.from,
        tx.to,
        tx.amount,
        new Date(tx.timestamp).toLocaleDateString(),
        tx.type,
        tx.gasUsed,
        tx.gasPrice,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mantle-transactions.csv';
    a.click();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mantle Transaction Tracker</h1>
          <p className="text-slate-300">Отслеживайте свои транзакции в сети Mantle</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="text-purple-400" size={20} />
            <h2 className="text-xl font-semibold text-white">Фильтры</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* From Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Wallet size={16} className="inline mr-1" />
                От адреса
              </label>
              <input
                type="text"
                value={filters.fromAddress}
                onChange={(e) => handleFilterChange('fromAddress', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* To Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Wallet size={16} className="inline mr-1" />К адресу
              </label>
              <input
                type="text"
                value={filters.toAddress}
                onChange={(e) => handleFilterChange('toAddress', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Тип транзакции
              </label>
              <select
                value={filters.transactionType}
                onChange={(e) =>
                  handleFilterChange(
                    'transactionType',
                    e.target.value as 'all' | 'sent' | 'received'
                  )
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Все</option>
                <option value="sent">Отправленные</option>
                <option value="received">Полученные</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Дата от
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Дата до
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Amount Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Сумма (MNT)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="Мин"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="Макс"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Поиск...' : 'Применить фильтры'}
            </button>

            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Сбросить
            </button>

            <button
              onClick={exportData}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors ml-auto disabled:opacity-50"
            >
              <Download size={16} />
              Экспорт CSV
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Транзакции ({transactions.length})</h2>
          </div>

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                {loading
                  ? 'Загрузка транзакций...'
                  : 'Транзакции не найдены. Введите адрес и нажмите "Применить фильтры"'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Хэш</th>
                    <th className="text-left p-4 text-slate-300 font-medium">От</th>
                    <th className="text-left p-4 text-slate-300 font-medium">К</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Сумма</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Функция</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Дата</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Тип</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Gas</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="border-t border-slate-700 hover:bg-slate-700/30">
                      <td className="p-4">
                        <code className="text-blue-400 text-sm">{formatAddress(tx.hash)}</code>
                      </td>
                      <td className="p-4">
                        <code className="text-slate-300 text-sm">{formatAddress(tx.from)}</code>
                      </td>
                      <td className="p-4">
                        <code className="text-slate-300 text-sm">{formatAddress(tx.to)}</code>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            tx.type === 'received' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {tx.type === 'received' ? '+' : '-'}
                          {tx.amount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 text-sm">{tx.functionName}</span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">{formatDate(tx.timestamp)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {tx.type === 'sent' ? (
                            <ArrowUpRight className="text-red-400" size={16} />
                          ) : (
                            <ArrowDownLeft className="text-green-400" size={16} />
                          )}
                          <span
                            className={`text-sm capitalize ${
                              tx.type === 'received' ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {tx.type === 'sent' ? 'Отправлено' : 'Получено'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">{tx.gasUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>Mantle Network Transaction Tracker • Создано для отслеживания крипто-трат</p>
        </div>
      </div>
    </div>
  );
};

export default MantleTracker;
