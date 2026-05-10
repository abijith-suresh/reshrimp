import SectionHeader from "@/components/app/ui/SectionHeader";
import FormatSelector from "./FormatSelector";

export default function FormatSection() {
  return (
    <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
      <SectionHeader>Format</SectionHeader>
      <FormatSelector />
    </div>
  );
}
