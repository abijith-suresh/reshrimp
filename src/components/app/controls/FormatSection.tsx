import SectionHeader from "@/components/app/ui/SectionHeader";
import FormatPills from "./FormatPills";

export default function FormatSection() {
  return (
    <div class="flex flex-col gap-3">
      <SectionHeader>Output Format</SectionHeader>
      <FormatPills />
    </div>
  );
}
