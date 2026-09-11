import { useState, useCallback, useRef } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export type RobotState = 'IDLE' | 'LISTENING' | 'THINKING' | 'TALKING' | 'POUTING' | 'CELEBRATE';

export interface UseAuraRobotControllerOptions {
  assetUrl?: string;
  autoplay?: boolean;
}

export function useAuraRobotController(options: UseAuraRobotControllerOptions = {}) {
  const { assetUrl = '/models/wave-robot.riv', autoplay = true } = options;
  const [currentState, setCurrentState] = useState<RobotState>('IDLE');
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo Rive Canvas Runtime với State Machine 1
  const { rive, RiveComponent } = useRive({
    src: assetUrl,
    stateMachines: 'State Machine 1',
    autoplay,
  });

  // Tín hiệu Inputs từ wave-robot metadata
  const talkInput = useStateMachineInput(rive, 'State Machine 1', 'Talk');
  const hearInput = useStateMachineInput(rive, 'State Machine 1', 'Hear');
  const lookInput = useStateMachineInput(rive, 'State Machine 1', 'Look');
  const successTrigger = useStateMachineInput(rive, 'State Machine 1', 'success');
  const failTrigger = useStateMachineInput(rive, 'State Machine 1', 'fail');

  // Hàm chuyển đổi trạng thái cảm xúc theo Ma trận Spec
  const setRobotState = useCallback((nextState: RobotState) => {
    setCurrentState(nextState);

    if (!rive) return;

    // Reset tất cả boolean inputs
    if (talkInput) talkInput.value = false;
    if (hearInput) hearInput.value = false;

    switch (nextState) {
      case 'IDLE':
        break;
      case 'LISTENING':
        if (hearInput) hearInput.value = true;
        break;
      case 'THINKING':
        if (lookInput) lookInput.value = true;
        break;
      case 'TALKING':
        if (talkInput) talkInput.value = true;
        break;
      case 'POUTING':
        if (failTrigger) failTrigger.fire();
        break;
      case 'CELEBRATE':
        if (successTrigger) successTrigger.fire();
        break;
    }
  }, [rive, talkInput, hearInput, lookInput, successTrigger, failTrigger]);

  // CSS Glow Color Token theo DESIGN.md
  const getGlowToken = useCallback(() => {
    switch (currentState) {
      case 'IDLE': return 'var(--glow-idle, #9C48EA)';
      case 'LISTENING': return 'var(--glow-listening, #00F2FE)';
      case 'THINKING': return 'var(--glow-thinking, #FFB800)';
      case 'TALKING': return 'var(--glow-talking, #E040FB)';
      case 'POUTING': return 'var(--glow-pouting, #FF758C)';
      case 'CELEBRATE': return 'var(--glow-celebrate, #00E676)';
      default: return '#9C48EA';
    }
  }, [currentState]);

  return {
    RiveComponent,
    rive,
    currentState,
    setRobotState,
    getGlowToken,
    audioVolume,
    setAudioVolume,
  };
}
