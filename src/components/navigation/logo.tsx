import Image from "next/image";

export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/aci-logo.png"
      alt="Aci"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
