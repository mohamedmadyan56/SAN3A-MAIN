'use client';

const steps = ['الخدمة', 'الفني', 'التفاصيل', 'تأكيد'];

export default function Stepper({ currentStep = 4 }: { currentStep?: number }) {
  return (
    <div className="flex items-center justify-center gap-0" dir="rtl">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const completed = stepNumber < currentStep;
        const current = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  completed
                    ? 'bg-[#0f5132] text-white'
                    : current
                    ? 'bg-white text-[#0f5132] border-2 border-[#0f5132]'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {completed ? '✓' : stepNumber}
              </div>
              <span className={`text-xs ${current ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-6 ${completed ? 'bg-[#0f5132]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
