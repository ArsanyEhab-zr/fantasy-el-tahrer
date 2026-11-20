import { useEffect, useId, useRef, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function InstallAppButton() {
  const { installed, install } = usePWAInstall();
  const [help, setHelp] = useState(null);
  const dialog = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (help && !installed) dialog.current?.showModal();
  }, [help, installed]);

  if (installed) return null;
  return (
    <>
      <button type="button" onClick={async () => setHelp(await install())}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-fanta-orange px-3 text-xs font-bold text-arena-bg hover:bg-fanta-orange-hot">
        <Download size={16} aria-hidden="true" /> تثبيت التطبيق
      </button>
      {help && <dialog ref={dialog} dir="rtl" aria-labelledby={titleId} onClose={() => setHelp(null)}
        className="fixed inset-0 m-auto w-[min(92vw,26rem)] rounded-2xl border border-arena-border bg-arena-surface p-6 text-arena-ink shadow-2xl backdrop:bg-black/75">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">تثبيت التطبيق</h2>
          <button type="button" onClick={() => dialog.current.close()} aria-label="إغلاق"
            className="grid size-11 place-items-center rounded-xl bg-arena-elevated"><X size={18} /></button>
        </div>
        {help === 'ios' ? <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed">
          <li>اضغط زر المشاركة <Share size={16} className="inline" /> (Share) أسفل الشاشة.</li>
          <li>اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
        </ol> : <p className="text-sm leading-relaxed">افتح قائمة المتصفح (⋮)، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>}
      </dialog>}
    </>
  );
}
