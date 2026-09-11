import React, { useState, useEffect, useCallback } from 'react';
import { AuraRobotCanvas } from './AuraRobotCanvas';
import { useAuraRobotController } from '../../hooks/useAuraRobotController';

interface AuraFloatingWidgetProps {
  onOpenModal: () => void;
}

const THRESHOLD = 300;

export const AuraFloatingWidget: React.FC<AuraFloatingWidgetProps> = ({ onOpenModal }) => {
  const { RiveComponent, getGlowToken } = useAuraRobotController();
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const getScrollEl = useCallback((): Element | null => {
    return document.querySelector("main.flex-1.overflow-y-auto") ?? null;
  }, []);

  useEffect(() => {
    const el = getScrollEl();
    if (!el) return;

    const onScroll = () => {
      setIsScrolled(el.scrollTop > THRESHOLD);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [getScrollEl]);

  return (
    <div
      className={`fixed right-4 sm:right-6 z-40 cursor-pointer group transition-all duration-300 ease-out ${
        isScrolled ? 'bottom-20 sm:bottom-24' : 'bottom-4 sm:bottom-6'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpenModal}
    >
      {/* Cloud Speech Bubble on Hover (MinLish Style) */}
      {isHovered && (
        <div className="absolute -top-14 right-2 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-white text-xs px-4 py-2.5 rounded-3xl shadow-2xl backdrop-blur-md whitespace-nowrap border border-purple-400/40 animate-bounce flex items-center gap-2">
          <span>Hi! I&apos;m Aura 👋 Ready to speak?</span>
          {/* Cloud Tail Dots */}
          <div className="absolute -bottom-2 right-6 w-3 h-3 bg-indigo-900/90 rounded-full border border-purple-400/40" />
          <div className="absolute -bottom-4 right-8 w-1.5 h-1.5 bg-indigo-900/90 rounded-full border border-purple-400/40" />
        </div>
      )}

      {/* Floating Robot Canvas */}
      <div className="transform transition-transform duration-300 group-hover:scale-105">
        <AuraRobotCanvas
          RiveComponent={RiveComponent}
          glowColor={getGlowToken()}
          size={110}
        />
      </div>
    </div>
  );
};
