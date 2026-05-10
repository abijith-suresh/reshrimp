import SectionHeader from "@/components/app/ui/SectionHeader";
import BackgroundRemovalToggle from "./BackgroundRemovalToggle";

export default function BackgroundRemovalSection() {
  return (
    <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
      <SectionHeader>Background Removal</SectionHeader>
      <BackgroundRemovalToggle />
    </div>
  );
}
