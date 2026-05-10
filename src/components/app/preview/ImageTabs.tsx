interface ImageTabsProps {
  activeTab: "original" | "processed";
  onTabChange: (tab: "original" | "processed") => void;
}

export default function ImageTabs(props: ImageTabsProps) {
  return (
    <div class="flex border-b border-sp-border-light px-4 shrink-0" role="tablist">
      <button
        type="button"
        id="original-tab"
        class="sbs-tab"
        classList={{ "sbs-tab-active": props.activeTab === "original" }}
        role="tab"
        aria-selected={props.activeTab === "original"}
        aria-controls="original-panel"
        onClick={() => props.onTabChange("original")}
      >
        Original
      </button>
      <button
        type="button"
        id="processed-tab"
        class="sbs-tab"
        classList={{ "sbs-tab-active": props.activeTab === "processed" }}
        role="tab"
        aria-selected={props.activeTab === "processed"}
        aria-controls="processed-panel"
        onClick={() => props.onTabChange("processed")}
      >
        Processed
      </button>
    </div>
  );
}
