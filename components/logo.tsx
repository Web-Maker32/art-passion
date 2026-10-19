import Image from "next/image";

const logoSources = {
  gold: "/logo-gold.png",
  badge: "/logo-badge.png",
} as const;

export function Logo({
  variant,
  size,
  priority,
  className,
}: {
  variant: "gold" | "badge";
  size: number;
  priority: boolean;
  className?: string;
}) {
  return (
    <Image
      alt="Art Passion"
      className={className}
      height={size}
      preload={priority}
      src={logoSources[variant]}
      width={Math.round((size * 1318) / 1394)}
    />
  );
}
