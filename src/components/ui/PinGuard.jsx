import { STORAGE_KEYS, isPinUnlocked } from '../../utils/pinSession';
import { useState, useRef } from 'react';
import InstallAppButton from './InstallAppButton';
import { Lock, ShieldCheck, Delete, KeyRound } from 'lucide-react';
import FantaLogo from './FantaLogo';


/**
 * PinGuard — Protects Admin (/admin/*) and Referee (/referee/*) portals from accidental fan entry.
 * Accessible: supports direct keyboard typing, paste, password managers, AND thumb-friendly keypad.
 */
export default function PinGuard({ role, expectedPin, children }) {
  const [unlocked, setUnlocked] = useState(() => isPinUnlocked(role));
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  if (unlocked) return children;

  const isAdmin = role === 'admin';

  const verifyPin = async (candidate, automatic = false) => {
    let valid = candidate === expectedPin;
    if (__VERCEL_PIN_CHECK__) {
      try {
        const result = await fetch('/api/notify?verify=1', {
          method:'POST', headers:{'x-fanta-pin':candidate, 'Content-Type':'application/json'}, body:JSON.stringify({role}),
        });
        valid = result.ok && (await result.json()).ok;
      } catch {
        setErrorMessage('تعذّر الاتصال. حاول مرة أخرى.');
        return;
      }
    }
    if (valid) {
      try {
        sessionStorage.setItem(STORAGE_KEYS[role], '1');
        sessionStorage.setItem('fanta_push_pin', candidate);
      } catch {
        // Ignore storage errors
      }
      setErrorMessage('');
      setUnlocked(true);
      return;
    }
    if (automatic) return;
    setErrorMessage('الرمز السري غير صحيح، حاول مرة أخرى.');
    setPin('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMessage('الرجاء إدخال رمز الدخول.');
      return;
    }
    verifyPin(pin);
  };

  const handleKeypadPress = (digit) => {
    setErrorMessage('');
    const next = `${pin}${digit}`.slice(0, 8);
    setPin(next);
    if (next.length === __STAFF_PIN_LENGTH__) {
      void verifyPin(next, true);
    }
  };

  const handleBackspace = () => {
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      dir="rtl"
      className={`min-h-dvh w-full flex flex-col items-center justify-center px-4 py-8 ${
        isAdmin ? 'bg-ops-canvas text-ops-ink' : 'bg-arena-stadium text-arena-ink'
      }`}
    >
      <div
        className={`glass-card w-full max-w-sm rounded-3xl border-2 p-6 sm:p-7 ${
          isAdmin
            ? 'bg-ops-surface border-ops-border shadow-[0_12px_36px_-12px_rgba(17,20,28,0.12)]'
            : 'bg-pitch-surface border-pitch-border shadow-[0_18px_48px_-12px_rgba(0,0,0,0.75)]'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <FantaLogo
            variant={isAdmin ? 'light' : 'dark'}
            size="sm"
            subtitle={isAdmin ? 'بوابة إدارة الدوري' : 'جهاز تحكم الحكم'}
          />
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isAdmin
                ? 'bg-fanta-orange/15 text-fanta-orange'
                : 'bg-fanta-volt/15 text-fanta-volt'
            }`}
            aria-hidden="true"
          >
            <Lock size={22} strokeWidth={2.4} />
          </div>
        </div>

        <div className="mb-4"><InstallAppButton /></div>
        <h1 className="font-display font-extrabold text-2xl mb-1.5">
          {isAdmin ? 'دخول الإدارة' : 'دخول طاقم التحكيم'}
        </h1>
        <p
          className={`text-sm mb-5 ${
            isAdmin ? 'text-ops-muted' : 'text-arena-muted'
          }`}
        >
          {isAdmin
            ? 'أدخل رمز الإدارة للوصول إلى جدول المباريات، الفرق، وإعدادات الدوري.'
            : 'أدخل رمز الحكم للبدء في إدارة الساعة وأحداث الملعب مباشرة.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={`pin-${role}`}
              className={`block text-xs font-bold mb-1.5 ${
                isAdmin ? 'text-ops-ink' : 'text-arena-ink'
              }`}
            >
              رمز الدخول السري (PIN)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id={`pin-${role}`}
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => {
                  setErrorMessage('');
                  setPin(e.target.value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
                    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)));
                }}
                placeholder="••••"
                className={`w-full h-13 px-4 rounded-xl border-2 text-center num-tabular text-2xl tracking-[0.45em] font-bold transition-colors ${
                  isAdmin
                    ? 'bg-ops-bg border-ops-border text-ops-ink focus:border-fanta-orange'
                    : 'bg-pitch-bg border-pitch-border text-arena-ink focus:border-fanta-volt'
                }`}
              />
              <KeyRound
                size={18}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isAdmin ? 'text-ops-muted' : 'text-arena-muted'
                }`}
                aria-hidden="true"
              />
            </div>
            {errorMessage && (
              <p role="alert" className="text-xs font-bold text-fanta-crimson mt-2">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Tactile Numeric Keypad (48px+ touch targets) */}
          <div className="grid grid-cols-3 gap-2" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className={`h-12 rounded-xl font-display font-bold text-xl num-tabular transition-colors cursor-pointer active:scale-95 ${
                  isAdmin
                    ? 'bg-ops-bg hover:bg-ops-subtle text-ops-ink border border-ops-border'
                    : 'bg-pitch-elevated hover:bg-arena-border text-arena-ink border border-pitch-border'
                }`}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className={`h-12 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isAdmin
                  ? 'bg-ops-subtle text-ops-muted hover:text-ops-ink'
                  : 'bg-pitch-bg text-arena-muted hover:text-arena-ink border border-pitch-border'
              }`}
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className={`h-12 rounded-xl font-display font-bold text-xl num-tabular transition-colors cursor-pointer active:scale-95 ${
                isAdmin
                  ? 'bg-ops-bg hover:bg-ops-subtle text-ops-ink border border-ops-border'
                  : 'bg-pitch-elevated hover:bg-arena-border text-arena-ink border border-pitch-border'
              }`}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              aria-label="حذف رقم"
              className={`h-12 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isAdmin
                  ? 'bg-ops-subtle text-ops-ink hover:bg-ops-border'
                  : 'bg-pitch-bg text-arena-ink hover:bg-pitch-elevated border border-pitch-border'
              }`}
            >
              <Delete size={20} />
            </button>
          </div>

          <button
            type="submit"
            className={`w-full min-h-[52px] rounded-xl font-display font-extrabold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98] ${
              isAdmin
                ? 'bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg shadow-[0_6px_20px_-6px_rgba(232,200,127,0.6)]'
                : 'bg-fanta-volt hover:bg-fanta-volt-dim text-arena-bg shadow-[0_6px_20px_-6px_rgba(164,212,182,0.45)]'
            }`}
          >
            <ShieldCheck size={20} strokeWidth={2.5} />
            <span>فتح البوابة</span>
          </button>
        </form>


      </div>
    </div>
  );
}
