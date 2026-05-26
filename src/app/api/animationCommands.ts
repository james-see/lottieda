import { useEditorStore } from "../store/editorStore";
import type { MotionPresetId, MotionPresetOptions } from "../../engine/motionPresets";

export interface ApplyAnimationPresetCommand {
  layerId?: number;
  presetId: MotionPresetId;
  options?: MotionPresetOptions;
}

export function applyAnimationPreset(command: ApplyAnimationPresetCommand): boolean {
  const store = useEditorStore.getState();
  const previousSelection = store.selectedLayerId;

  if (command.layerId !== undefined && command.layerId !== previousSelection) {
    store.selectLayer(command.layerId);
  }

  const applied = useEditorStore.getState().applyAnimationPreset(command.presetId, command.options);

  if (command.layerId !== undefined && previousSelection !== command.layerId) {
    useEditorStore.getState().selectLayer(previousSelection);
  }

  return applied;
}
