"use client";

import useClickSound from "@/hooks/useClickSound";

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function SoundButton({ children, onClick, ...props }: SoundButtonProps) {
  const playSound = useClickSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Immediate audio feedback
    playSound();
    
    // Execute original click handler
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
