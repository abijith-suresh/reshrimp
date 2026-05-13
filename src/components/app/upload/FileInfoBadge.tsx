import { formatFileSize } from "@/utils/imageUtils";

interface FileInfoBadgeProps {
  fileName: string;
  fileSize: number;
}

export default function FileInfoBadge(props: FileInfoBadgeProps) {
  return (
    <div id="file-info" class="mt-2 text-[0.75rem] text-sp-text-muted truncate max-w-full">
      <span class="font-medium text-sp-text">
        {props.fileName.length > 24 ? props.fileName.slice(0, 24) + "…" : props.fileName}
      </span>
      <span class="text-sp-text-soft"> · {formatFileSize(props.fileSize)}</span>
    </div>
  );
}
