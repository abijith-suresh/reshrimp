import { CircleAlert } from "lucide-solid";

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay(props: ErrorDisplayProps) {
  return (
    <div
      class="w-full animate-feedback-in rounded-md border border-danger/20 bg-danger-subtle px-4 py-3 text-left"
      role="alert"
    >
      <div class="flex gap-3">
        <CircleAlert class="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h3 class="mb-0.5 text-sm font-semibold text-danger">Processing error</h3>
          <p class="text-xs text-danger">{props.message}</p>
        </div>
      </div>
    </div>
  );
}
