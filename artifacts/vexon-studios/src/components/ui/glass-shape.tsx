import { cn } from "@/lib/utils";

interface GlassShapeProps {
  className?: string;
  color?: "primary" | "secondary" | "white";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function GlassShape({ className, color = "primary", size = "lg" }: GlassShapeProps) {
  const colorMap = {
    primary: "bg-primary",
    secondary: "bg-white/10",
    white: "bg-white/20",
  };

  const sizeMap = {
    sm: "w-32 h-32 blur-[40px]",
    md: "w-64 h-64 blur-[60px]",
    lg: "w-96 h-96 blur-[80px]",
    xl: "w-[500px] h-[500px] blur-[100px]",
    "2xl": "w-[800px] h-[800px] blur-[120px]",
  };

  return (
    <div
      className={cn(
        "glass-shape",
        colorMap[color],
        sizeMap[size],
        className
      )}
    />
  );
}
