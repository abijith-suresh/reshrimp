import { createSignal } from "solid-js";
import type { ImageFormat } from "@/types/image";
import type { ResizeUnit } from "@/types/processing";
import { DEFAULT_DPI } from "@/config/constants";
import {
  getLinkedDimensionValues,
  getFormatStateForBackgroundRemoval,
  rebaseDimensionValues,
  getDimensionValuesForDpiChange,
  getPresetResizeValues,
} from "@/services/imageWorkflowService";
import { SOCIAL_MEDIA_PRESETS } from "@/config/presets";
import type { Accessor } from "solid-js";
import type { ProcessedImage } from "@/types/image";

export function useImageFormState(currentImage: Accessor<ProcessedImage | null>) {
  const [widthValue, setWidthValue] = createSignal("");
  const [heightValue, setHeightValue] = createSignal("");
  const [maintainAspectRatio, setMaintainAspectRatio] = createSignal(true);
  const [removeBackground, setRemoveBackground] = createSignal(false);
  const [formatValue, setFormatValue] = createSignal("");
  const [previousFormatValue, setPreviousFormatValue] = createSignal("");
  const [qualityValue, setQualityValue] = createSignal(92);
  const [resizeUnit, setResizeUnit] = createSignal<ResizeUnit>("px");
  const [dpiValue, setDpiValue] = createSignal(DEFAULT_DPI);
  const [presetValue, setPresetValue] = createSignal("");

  function handleRemoveBackgroundChange(checked: boolean): void {
    const nextFormatState = getFormatStateForBackgroundRemoval({
      checked,
      formatValue: formatValue(),
      previousFormatValue: previousFormatValue(),
    });

    setPreviousFormatValue(nextFormatState.previousFormatValue);
    setFormatValue(nextFormatState.formatValue);
    setRemoveBackground(checked);
  }

  function handleUnitChange(newUnit: ResizeUnit): void {
    const img = currentImage();

    if (img) {
      const nextDimensions = rebaseDimensionValues({
        widthValue: widthValue(),
        heightValue: heightValue(),
        oldUnit: resizeUnit(),
        newUnit,
        originalWidth: img.metadata.width,
        originalHeight: img.metadata.height,
        dpi: dpiValue(),
      });

      setWidthValue(nextDimensions.widthValue);
      setHeightValue(nextDimensions.heightValue);
    }

    setResizeUnit(newUnit);
  }

  function handleDpiChange(newDpi: number): void {
    const img = currentImage();

    if (img) {
      const nextDimensions = getDimensionValuesForDpiChange({
        widthValue: widthValue(),
        heightValue: heightValue(),
        resizeUnit: resizeUnit(),
        originalWidth: img.metadata.width,
        originalHeight: img.metadata.height,
        previousDpi: dpiValue(),
        nextDpi: newDpi,
      });

      setWidthValue(nextDimensions.widthValue);
      setHeightValue(nextDimensions.heightValue);
    }

    setDpiValue(newDpi);
  }

  function handlePresetChange(label: string): void {
    setPresetValue(label);
    if (!label) return;

    const presetValues = getPresetResizeValues(label, SOCIAL_MEDIA_PRESETS);
    if (!presetValues) return;

    setResizeUnit(presetValues.resizeUnit);
    setWidthValue(presetValues.widthValue);
    setHeightValue(presetValues.heightValue);
  }

  function handleWidthInput(val: string): void {
    setPresetValue("");

    if (!maintainAspectRatio()) {
      setWidthValue(val);
      return;
    }

    const img = currentImage();
    if (!img) {
      setWidthValue(val);
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "width",
      value: val,
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setWidthValue(val);
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
  }

  function handleHeightInput(val: string): void {
    setPresetValue("");

    if (!maintainAspectRatio()) {
      setHeightValue(val);
      return;
    }

    const img = currentImage();
    if (!img) {
      setHeightValue(val);
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "height",
      value: val,
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setHeightValue(val);
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
  }

  function handleAspectRatioChange(checked: boolean): void {
    setMaintainAspectRatio(checked);
    if (checked) {
      if (widthValue()) {
        handleWidthInput(widthValue());
      } else if (heightValue()) {
        handleHeightInput(heightValue());
      }
    }
  }

  function resetFormControls(initialFormat: ImageFormat): void {
    setWidthValue("");
    setHeightValue("");
    setMaintainAspectRatio(true);
    setRemoveBackground(false);
    setFormatValue(initialFormat);
    setPreviousFormatValue("");
    setQualityValue(92);
    setResizeUnit("px");
    setDpiValue(DEFAULT_DPI);
    setPresetValue("");
  }

  return {
    widthValue,
    heightValue,
    maintainAspectRatio,
    removeBackground,
    formatValue,
    previousFormatValue,
    qualityValue,
    resizeUnit,
    dpiValue,
    presetValue,
    handleRemoveBackgroundChange,
    handleUnitChange,
    handleDpiChange,
    handlePresetChange,
    handleWidthInput,
    handleHeightInput,
    handleAspectRatioChange,
    setFormatValue,
    setQualityValue,
    resetFormControls,
  };
}
