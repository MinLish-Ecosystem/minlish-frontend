import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-white rounded-2xl shadow-sm border border-slate-100", className)}
      {...props}
    />
  );
}

