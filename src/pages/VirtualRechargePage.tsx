import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Zap, Coins, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { api } from '../api/client';
import { RechargePlan, RechargeTransaction } from '../types';

export const VirtualRechargePage: React.FC = () => {
  const { user, coinWallet, refreshUser } = useAuth();
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedOperator, setSelectedOperator] = useState('Airtel');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [history, setHistory] = useState<RechargeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const fetchRechargeData = async () => {
    try {
      const [plansRes, opRes, histRes] = await Promise.all([
        api.getRechargePlans(),
        api.getOperators(),
        api.getRechargeHistory()
      ]);
      if (plansRes.success && plansRes.data) setPlans(plansRes.data);
      if (opRes.success && opRes.data) setOperators(opRes.data);
      if (histRes.success && histRes.data) setHistory(histRes.data);
    } catch (err) {
      console.error('Failed to load recharge data:', err);
    }
  };

  useEffect(() => {
    fetchRechargeData();
  }, []);

  const handleRecharge = async (plan: RechargePlan) => {
    setError(null);
    setSelectedPlan(plan);

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const availableCoins = coinWallet ? coinWallet.coinBalance : 0;
    if (availableCoins < plan.coinCost) {
      setError(`Insufficient coins. You have ${availableCoins} coins, but this plan requires ${plan.coinCost} coins.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.executeRecharge({
        phone: cleanPhone,
        operator: selectedOperator,
        planId: plan.id
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        await refreshUser();
        await fetchRechargeData();
      } else {
        setError(res.message || 'Recharge failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Recharge failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Virtual Mobile Recharge</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Instant Fulfillment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Redeem your DataShare reward coins for mobile recharge vouchers
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-2xl">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">Available:</span>
          <span className="text-sm font-bold text-amber-400">{coinWallet ? coinWallet.coinBalance : 0}</span>
          <span className="text-xs text-amber-400/80">Coins</span>
        </div>
      </div>

      {/* Prototype Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-200">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-white block">Simulation Prototype:</strong>
          This feature simulates commercial mobile operator top-up fulfillment via virtual operator gateways. Coins are safely debited from your authoritative coin wallet and fulfillment reference keys are archived.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successData && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Recharge Successful!</h3>
              <p className="text-xs text-emerald-300 mt-0.5">
                Ref No: <span className="font-mono">{successData.referenceNumber}</span> &bull; {successData.planName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessData(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Mobile Number & Operator Selection */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
        <h3 className="font-bold text-sm text-white">Recharge Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-xs text-slate-400 font-medium">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile"
                className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Telecom Operator
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Airtel', 'Jio', 'Vi', 'BSNL'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setSelectedOperator(op)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedOperator === op
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Plans Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-white">Available Recharge Packs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const userCoins = coinWallet ? coinWallet.coinBalance : 0;
            const canAfford = userCoins >= plan.coinCost;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                  canAfford
                    ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl font-black text-white">₹{plan.amountINR}</span>
                      <span className="text-xs text-slate-400 block font-medium mt-0.5">
                        {plan.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5" />
                      {plan.coinCost} Coins
                    </div>
                  </div>

                  <div className="my-4 p-3 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>
                      Validity: <strong className="text-white">{plan.validity}</strong>
                    </div>
                    <div>
                      Benefits: <strong className="text-cyan-400">{plan.benefits}</strong>
                    </div>
                    {plan.dataBonusMB && (
                      <div className="text-emerald-400 font-semibold">
                        +{(plan.dataBonusMB / 1024).toFixed(0)} GB Bonus Data included
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading || !canAfford}
                  onClick={() => handleRecharge(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  {canAfford ? `Redeem for ${plan.coinCost} Coins` : `Need ${plan.coinCost - userCoins} More Coins`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Recharge History */}
      {history.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Your Recharge History</h3>
          </div>

          <div className="divide-y divide-slate-800">
            {history.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">
                    {tx.planName} ({tx.operator})
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Phone: {tx.phone} &bull; Ref: {tx.referenceNumber}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-amber-400">-{tx.coinsSpent} Coins</span>
                  <span className="block text-[10px] text-emerald-400 font-semibold">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
