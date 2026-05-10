import { formatFileSize } from "@/utils/imageUtils";

interface ImageInfoBarProps {
  width: number;
  height: number;
  fileSize: number;
  metadataNote?: string;
}

export default function ImageInfoBar(props: ImageInfoBarProps) {
  return (
    <div class="info-bar">
      <p>
        Dimensions: {props.width} &times; {props.height}px
      </p>
      <p>Size: {formatFileSize(props.fileSize)}</p>
      {props.metadataNote && <p>{props.metadataNote}</p>}
    </div>
  );
}
