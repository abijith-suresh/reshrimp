import { Check, Download } from "lucide-solid";
import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Button from "@/components/ui/Button";

interface DownloadSectionProps {
  idPrefix?: string;
  showStatusMessages?: boolean;
  showFormatNotice?: boolean;
  allowApplyAction?: boolean;
}

export default function DownloadSection(props: DownloadSectionProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";
  const showFormatNotice = () => props.showFormatNotice ?? props.showStatusMessages !== false;
  const canApply = () =>
    props.allowApplyAction === true &&
    state.hasPendingChanges() &&
    !state.isProcessing() &&
    state.resizeError() === null;
  const buttonLabel = () => {
    if (canApply()) {
      return state.processResult() === null ? "Retry processing" : "Apply changes";
    }
    if (state.resizeError()) return "Fix dimensions to apply";
    if (
      props.allowApplyAction === true &&
      state.error() &&
      state.hasPendingChanges() &&
      state.processResult() === null
    ) {
      return "Apply again";
    }
    if (
      props.allowApplyAction === true &&
      state.hasPendingChanges() &&
      state.processResult() !== null
    ) {
      return "Apply changes first";
    }
    return "Download";
  };

  return (
    <div id={`${prefix}download-section`} class="flex flex-col items-center gap-2 pt-3">
      <Show when={showFormatNotice() && state.formatNotice()}>
        {(message) => (
          <p
            id={`${prefix}format-fallback-warning`}
            class="w-full text-xs leading-relaxed text-yellow-700"
            role="status"
          >
            {message()}
          </p>
        )}
      </Show>
      <Show
        when={
          props.showStatusMessages !== false && state.resizeError() && state.hasPendingChanges()
        }
      >
        <p class="w-full text-xs leading-relaxed text-coral-600" role="status" aria-live="polite">
          Fix the highlighted dimensions before applying.
        </p>
      </Show>
      <Show
        when={
          props.showStatusMessages !== false &&
          state.error() &&
          !state.resizeError() &&
          state.hasPendingChanges()
        }
      >
        <p class="w-full text-xs leading-relaxed text-coral-600" role="status" aria-live="polite">
          {props.allowApplyAction
            ? "Processing failed. Retry processing."
            : "Processing failed. Use Apply all changes to retry."}
        </p>
      </Show>
      <Show
        when={
          props.showStatusMessages !== false &&
          state.hasPendingChanges() &&
          state.processResult() !== null &&
          !state.error()
        }
      >
        <p
          class="w-full text-xs leading-relaxed text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Apply changes before downloading.
        </p>
      </Show>
      <Button
        id={`${prefix}download-button`}
        variant="primary"
        tone="mint"
        fullWidth={true}
        disabled={canApply() ? false : !state.downloadActive()}
        onClick={() => (canApply() ? actions.applyChanges() : actions.handleDownload())}
      >
        {canApply() ? (
          <Check class="w-4 h-4" aria-hidden="true" />
        ) : (
          <Download class="w-4 h-4" aria-hidden="true" />
        )}
        <span>{buttonLabel()}</span>
      </Button>
    </div>
  );
}
