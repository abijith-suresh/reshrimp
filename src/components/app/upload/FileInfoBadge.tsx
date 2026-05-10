import { formatFileSize } from "@/utils/imageUtils";

interface FileInfoBadgeProps {
  fileName: string;
  fileSize: number;
}

export default function FileInfoBadge(props: FileInfoBadgeProps) {
  return (
    <div id="file-info" class="mt-3 text-[0.8rem] text-sp-text-muted">
      Selected: {props.fileName} ({formatFileSize(props.fileSize)})
    </div>
  );
}
