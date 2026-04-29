import { motion } from "framer-motion";

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

interface OnboardingProgressProps {
  steps: Step[];
  currentStep: number;
}

export function OnboardingProgress({ steps, currentStep }: OnboardingProgressProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep >= step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.number} className={`relative flex-1 ${isLast ? "" : "pr-4 sm:pr-8 md:pr-12 lg:pr-16"}`}>
              {!isLast && (
                <div className="absolute left-0 top-4 -ml-px mt-0.5 h-0.5 w-full">
                  <div className={`h-full transition-colors duration-300 ${isActive ? "bg-primary" : "bg-muted"}`} />
                </div>
              )}
              <div className="group relative flex flex-col items-center">
                <span className="flex h-9 items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 border-2 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-muted text-muted-foreground opacity-50"
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {isActive && step.number < currentStep ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </span>
                  </span>
                </span>
                <span className="mt-2 flex flex-col items-center text-center">
                  <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground opacity-50"}`}>
                    {step.title}
                  </span>
                  <span className={`mt-0.5 text-xs hidden sm:block ${isActive ? "text-muted-foreground" : "text-muted-foreground opacity-50"}`}>
                    {step.subtitle}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <ol className="md:hidden flex flex-col space-y-4">
        {steps.map((step) => {
          const isActive = currentStep >= step.number;
          return (
            <li key={step.number} className="flex items-start space-x-3 cursor-default">
              <div className="flex-shrink-0">
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 border-2 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-muted text-muted-foreground opacity-50"
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {isActive && currentStep > step.number ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </span>
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium transition-colors duration-300 block ${isActive ? "text-foreground" : "text-muted-foreground opacity-50"}`}>
                  {step.title}
                </span>
                <span className={`text-xs block ${isActive ? "text-muted-foreground" : "text-muted-foreground opacity-50"}`}>
                  {step.subtitle}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
