import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "blue" | "orange" | "teal" | "gray";
  className?: string;
}

const variantClasses = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  teal: "bg-teal-100 text-teal-800",
  gray: "bg-gray-100 text-gray-700",
};

export default function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span className={cn("badge-status", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
