// Buy/Sell modal component for executing trades
// Handles transaction validation and database operations

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Stock, Holding } from '../lib/types';
import { formatCurrency } from '../lib/marketUtils';
import { fetchStockPrice } from '../lib/yahooFinance';
import { X, AlertCircle } from 'lucide-react';

interface BuySellModalProps {
  type: 'buy' | 'sell';
  stock: Stock;
  currentPrice: number;
  holding: Holding | null;
  onClose: () => void;
  onComplete: () => void;
}

export default function BuySellModal({ type, stock, currentPrice, holding, onClose, onComplete }: BuySellModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = quantity * currentPrice;
  const remainingCash = (profile?.virtual_cash || 0) - totalAmount;

  const profitLoss =
    type === 'sell' && holding ? (currentPrice - holding.average_buy_price) * quantity : 0;

  const maxSellQuantity = holding?.quantity || 0;

  useEffect(() => {
    if (type === 'sell' && maxSellQuantity > 0) {
      setQuantity(Math.min(1, maxSellQuantity));
    }
  }, [type, maxSellQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const latestPrice = await fetchStockPrice(stock.symbol);
      if (!latestPrice) {
        throw new Error('Unable to fetch current price. Please try again.');
      }

      const price = latestPrice.price;
      const total = quantity * price;

      if (type === 'buy') {
        if (total > (profile?.virtual_cash || 0)) {
          throw new Error('Insufficient funds');
        }

        const { error: txError } = await supabase.from('transactions').insert({
          user_id: profile?.id,
          stock_id: stock.id,
          type: 'BUY',
          quantity,
          price_per_share: price,
          total_amount: total,
        });

        if (txError) throw txError;

        const { error: cashError } = await supabase
          .from('profiles')
          .update({ virtual_cash: (profile?.virtual_cash || 0) - total })
          .eq('id', profile?.id);

        if (cashError) throw cashError;

        if (holding && holding.quantity > 0) {
          const newQuantity = holding.quantity + quantity;
          const newAvgPrice =
            (holding.average_buy_price * holding.quantity + price * quantity) / newQuantity;

          const { error: holdingError } = await supabase
            .from('holdings')
            .update({
              quantity: newQuantity,
              average_buy_price: newAvgPrice,
            })
            .eq('user_id', profile?.id)
            .eq('stock_id', stock.id);

          if (holdingError) throw holdingError;
        } else {
          const { error: holdingError } = await supabase.from('holdings').insert({
            user_id: profile?.id,
            stock_id: stock.id,
            quantity,
            average_buy_price: price,
          });

          if (holdingError) throw holdingError;
        }
      } else {
        if (!holding || quantity > holding.quantity) {
          throw new Error('Insufficient shares');
        }

        const { error: txError } = await supabase.from('transactions').insert({
          user_id: profile?.id,
          stock_id: stock.id,
          type: 'SELL',
          quantity,
          price_per_share: price,
          total_amount: total,
        });

        if (txError) throw txError;

        const { error: cashError } = await supabase
          .from('profiles')
          .update({ virtual_cash: (profile?.virtual_cash || 0) + total })
          .eq('id', profile?.id);

        if (cashError) throw cashError;

        const newQuantity = holding.quantity - quantity;

        if (newQuantity === 0) {
          const { error: holdingError } = await supabase
            .from('holdings')
            .delete()
            .eq('user_id', profile?.id)
            .eq('stock_id', stock.id);

          if (holdingError) throw holdingError;
        } else {
          const { error: holdingError } = await supabase
            .from('holdings')
            .update({ quantity: newQuantity })
            .eq('user_id', profile?.id)
            .eq('stock_id', stock.id);

          if (holdingError) throw holdingError;
        }
      }

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {type === 'buy' ? 'Buy' : 'Sell'} {stock.company_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Price</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(currentPrice)}</span>
            </div>

            {type === 'sell' && holding && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Your Holdings</span>
                <span className="text-lg font-semibold text-gray-900">
                  {holding.quantity} shares at avg {formatCurrency(holding.average_buy_price)}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={type === 'sell' ? maxSellQuantity : undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {type === 'sell' && (
                <p className="text-sm text-gray-500 mt-1">Maximum: {maxSellQuantity} shares</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total {type === 'buy' ? 'Cost' : 'Proceeds'}</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>

              {type === 'buy' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Cash</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(profile?.virtual_cash || 0)}
                  </span>
                </div>
              )}

              {type === 'buy' && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Remaining Cash</span>
                  <span
                    className={`font-bold ${
                      remainingCash < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(remainingCash)}
                  </span>
                </div>
              )}

              {type === 'sell' && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Profit/Loss</span>
                  <span
                    className={`font-bold ${
                      profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {profitLoss >= 0 ? '+' : ''}
                    {formatCurrency(profitLoss)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (type === 'buy' && remainingCash < 0) ||
                (type === 'sell' && quantity > maxSellQuantity)
              }
              className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${type === 'buy' ? 'Buy' : 'Sell'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
