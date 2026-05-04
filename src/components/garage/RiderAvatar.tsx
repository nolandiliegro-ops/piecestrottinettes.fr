import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface RiderAvatarProps {
  url?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-lg",
  xl: "h-32 w-32 text-2xl",
};

const getInitials = (name?: string | null) => {
  if (!name) return "R";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "R";
};

const RiderAvatar = ({ url, name, size = "md", className }: RiderAvatarProps) => {
  return (
    <Avatar
      className={cn(
        sizeMap[size],
        "ring-2 ring-white/40 shadow-md border border-mineral/10",
        className,
      )}
    >
      {url && <AvatarImage src={url} alt={name ?? "Rider avatar"} />}
      <AvatarFallback className="bg-gradient-to-br from-mineral/20 to-carbon/20 text-carbon font-semibold uppercase">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default RiderAvatar;
