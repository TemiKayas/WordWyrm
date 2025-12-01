'use client';

interface Step {
  number: number;
  label: string;
}

interface MultiStepIndicatorProps {
  currentStep: number; // 1, 2, or 3
  steps: Step[];
}

export default function MultiStepIndicator({ currentStep, steps }: MultiStepIndicatorProps) {
  return (
    <div className="w-full max-w-[600px] mx-auto mb-6 md:mb-8">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10 flex-1">
              {/* Connecting Line (except for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-[16px] left-[50%] w-full h-[3px] transition-all duration-300 ${
                    isCompleted ? 'bg-[#96b902]' : 'bg-[#d1c5b8]'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step Circle */}
              <div
                className={`relative w-[32px] h-[32px] rounded-full flex items-center justify-center font-quicksand font-bold text-[14px] transition-all duration-300 border-[3px] ${
                  isActive
                    ? 'bg-[#96b902] border-[#006029] text-white scale-110'
                    : isCompleted
                    ? 'bg-[#96b902] border-[#006029] text-white'
                    : 'bg-white border-[#d1c5b8] text-[#a7613c]'
                }`}
                style={{ zIndex: 1 }}
              >
                {step.number}
              </div>

              {/* Step Label */}
              <div
                className={`mt-2 font-quicksand font-semibold text-[12px] md:text-[14px] text-center transition-all duration-300 ${
                  isActive
                    ? 'text-[#96b902]'
                    : isCompleted
                    ? 'text-[#473025]'
                    : 'text-[#a7613c]'
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
