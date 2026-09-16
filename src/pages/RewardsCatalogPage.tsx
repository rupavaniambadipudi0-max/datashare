import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Coins, Copy, Check, Tag, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { Reward, RewardRedemption } from '../types';

export const RewardsCatalogPage: React.FC = () => {
  const { coinWallet, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'catalog' | 'vouchers'>('catalog');
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const [catRes, myRes] = await Promise.all([
        api.getRewardsCatalog(selectedCategory === 'ALL' ? undefined : selectedCategory),
        api.getMyRedemptions()
      ]);
      if (catRes.success && catRes.data) setRewards(catRes.data);
      if (myRes.success && myRes.data) setMyRedemptions(myRes.data);
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [selectedCategory]);

  const handleRedeem = async (reward: Reward) => {
    setError(null);
    const availableCoins = coinWallet ? coinWallet.coinBalance : 0;
    if (availableCoins < reward.coinCost) {
      setError(`Insufficient coins. You need ${reward.coinCost} coins to redeem ${reward.name}.`);
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await api.redeemReward(reward.id);
      if (res.success && res.data) {
        setRedeemSuccess(res.data);
        await refreshUser();
        await fetchRewards();
      } else {
        setError(res.message || 'Redemption failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Redemption failed.');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const categories = ['ALL', 'FOOD', 'SHOPPING', 'OTT', 'GIFT_CARD'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Rewards Marketplace</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Premium Vouchers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Redeem data sharing coins for curated brand discounts and gift cards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-2xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Balance:</span>
            <span className="text-sm font-bold text-amber-400">{coinWallet ? coinWallet.coinBalance : 0}</span>
            <span className="text-xs text-amber-400/80">Coins</span>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'catalog' ? 'vouchers' : 'catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vouchers'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-500/30'
            }`}
          >
            My Vouchers ({myRedemptions.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Modal / Banner */}
      {redeemSuccess && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Voucher Claimed!</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Here is your unique discount code:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-500/40 font-mono font-bold text-amber-400 text-sm">
                <span>{redeemSuccess.couponCode}</span>
                <button
                  onClick={() => handleCopy(redeemSuccess.couponCode)}
                  className="p-1 hover:text-white"
                  title="Copy code"
                >
                  {copiedCode === redeemSuccess.couponCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setRedeemSuccess(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'catalog' ? (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const userCoins = coinWallet ? coinWallet.coinBalance : 0;
              const canAfford = userCoins >= reward.coinCost;

              return (
                <div
                  key={reward.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/30 transition-all flex flex-col justify-between text-white"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-purple-400 border border-purple-500/20">
                        {reward.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Coins className="w-3.5 h-3.5" />
                        {reward.coinCost} Coins
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-white">{reward.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {reward.description}
                    </p>

                    <div className="my-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
                      <span>Value: <strong className="text-white">₹{reward.cashValue}</strong></span>
                      <span>Stock: <strong className="text-cyan-400">{reward.stock} left</strong></span>
                    </div>

                    {reward.terms && (
                      <p className="text-[11px] text-slate-500 italic mb-4">
                        *{reward.terms}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || redeemingId === reward.id}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {redeemingId === reward.id
                      ? 'Generating Voucher...'
                      : canAfford
                      ? `Redeem for ${reward.coinCost} Coins`
                      : `Need ${reward.coinCost - userCoins} More Coins`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* My Claimed Vouchers */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            My Active Voucher Codes
          </h2>

          {myRedemptions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You haven't redeemed any vouchers yet. Spend your data sharing coins to unlock them!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRedemptions.map((red) => (
                <div
                  key={red.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                      {red.rewardCategory || 'REWARD'}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">{red.rewardName}</h4>
                    <span className="text-[11px] text-slate-500 block">
                      Claimed: {new Date(red.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-500/30 font-mono font-bold text-amber-400 text-xs">
                      <span>{red.couponCode}</span>
                      <button
                        onClick={() => handleCopy(red.couponCode)}
                        className="p-0.5 hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode === red.couponCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                      ACTIVE & VALID
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
