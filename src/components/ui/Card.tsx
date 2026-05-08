import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn("card", hover && "hover:shadow-card-hover cursor-pointer", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "navy",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: "navy" | "orange" | "teal" | "green";
}) {
  const colorClasses = {
    navy: "bg-navy-50 text-navy",
    orange: "bg-orange-50 text-orange",
    teal: "bg-teal-50 text-teal",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-josefin">{label}</p>
          <p className="font-outfit font-bold text-2xl text-navy mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 font-josefin mt-1">{trend}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
