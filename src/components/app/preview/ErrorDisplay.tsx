import { AlertCircle } from "lucide-solid";

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay(props: ErrorDisplayProps) {
  return (
    <div id="error-message" class="error-container">
      <div class="flex gap-3">
        <AlertCircle class="w-5 h-5 text-coral-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 class="text-sm font-semibold text-coral-600 m-0 mb-1">Processing Error</h3>
          <p id="error-text" class="text-xs text-coral-500 m-0">
            {props.message}
          </p>
        </div>
      </div>
    </div>
  );
}
