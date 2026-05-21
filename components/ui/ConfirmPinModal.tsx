'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, KeyRound, Delete, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ConfirmPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
}

export function ConfirmPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Confirm Transaction PIN',
  description = 'Please enter your 4-digit security PIN to authorize this request.'
}: ConfirmPinModalProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Reset PIN on open/close
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorShake(false);
      setIsVerifying(false);
    }
  }, [isOpen]);

  const hasPin = !!profile?.withdrawal_pin;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  // Auto submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = async () => {
    setIsVerifying(true);
    // Add brief animation delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    // If the modal has an expected client PIN (e.g. for withdrawal verification), we can check it
    if (profile?.withdrawal_pin && pin !== profile.withdrawal_pin) {
      setIsVerifying(false);
      setErrorShake(true);
      setPin('');
      toast.error('Incorrect Transaction PIN');
      // Reset shake animation after it plays
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    setIsVerifying(false);
    onSuccess(pin);
  };

  const redirectToSetup = () => {
    onClose();
    router.push('/dashboard/settings?tab=security&setupPin=true');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#060d1a]/95 p-6 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-blue-500" />
              <span className="text-sm font-semibold text-white">Security Verification</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.05] hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {!hasPin ? (
            /* PIN Setup Required State */
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert size={28} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Transaction PIN Required</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed px-2">
                You must set up a secure 4-digit Transaction PIN to complete withdrawals and internal transfers.
              </p>

              <div className="mt-6 space-y-2">
                <button
                  onClick={redirectToSetup}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-all glow-blue"
                >
                  Create Secure PIN <ArrowRight size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Keypad PIN Entry State */
            <div className="flex flex-col items-center py-5">
              <h3 className="text-center text-lg font-bold text-white">{title}</h3>
              <p className="mt-1 text-center text-xs text-slate-400 max-w-[240px]">
                {description}
              </p>

              {/* Bouncing Dot Indicators */}
              <motion.div
                animate={errorShake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="my-7 flex gap-4"
              >
                {[0, 1, 2, 3].map((index) => {
                  const isActive = pin.length > index;
                  return (
                    <motion.div
                      key={index}
                      animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      className={`h-4.5 w-4.5 rounded-full border-2 transition-all duration-200 ${
                        isActive
                          ? 'border-blue-500 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          : 'border-white/20 bg-transparent'
                      }`}
                    />
                  );
                })}
              </motion.div>

              {/* Number Keypad */}
              <div className="grid w-full grid-cols-3 gap-3 px-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    disabled={isVerifying}
                    className="flex h-14 items-center justify-center rounded-2xl border border-white/[0.03] bg-white/[0.03] text-lg font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-50 transition-all font-mono"
                  >
                    {digit}
                  </button>
                ))}
                
                {/* Clear button */}
                <button
                  onClick={handleClear}
                  disabled={isVerifying || pin.length === 0}
                  className="flex h-14 items-center justify-center rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-300 active:scale-95 disabled:opacity-30 transition-all"
                >
                  Clear
                </button>

                {/* Zero button */}
                <button
                  onClick={() => handleKeyPress('0')}
                  disabled={isVerifying}
                  className="flex h-14 items-center justify-center rounded-2xl border border-white/[0.03] bg-white/[0.03] text-lg font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-50 transition-all font-mono"
                >
                  0
                </button>

                {/* Backspace button */}
                <button
                  onClick={handleBackspace}
                  disabled={isVerifying || pin.length === 0}
                  className="flex h-14 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-300 active:scale-95 disabled:opacity-30 transition-all"
                >
                  <Delete size={20} />
                </button>
              </div>

              {/* Loading overlay */}
              {isVerifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#060d1a]/85 backdrop-blur-sm">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <p className="mt-3 text-xs font-medium text-blue-400">Verifying security PIN...</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
