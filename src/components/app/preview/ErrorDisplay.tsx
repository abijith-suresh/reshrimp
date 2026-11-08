import { CircleAlert } from "lucide-solid";

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay(props: ErrorDisplayProps) {
  return (
    <div
      id="error-message"
      class="bg-danger-subtle border border-danger/20 rounded-md py-4 px-5 mx-5 animate-feedback-in"
      role="alert"
    >
      <div class="flex gap-3">
        <CircleAlert class="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 class="text-sm font-semibold text-danger m-0 mb-1">Processing Error</h3>
          <p id="error-text" class="text-xs text-danger m-0">
            {props.message}
          </p>
        </div>
      </div>
    </div>
  );
}
