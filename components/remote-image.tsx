import Image from "next/image";

const NEXT_IMAGE_HOSTS = ["images.unsplash.com", "supabase.co"];

function canUseNextImage(src: string): boolean {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return true;
  try {
    const { hostname } = new URL(src);
    return NEXT_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

type RemoteImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
};

export function RemoteImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
  unoptimized,
}: RemoteImageProps) {
  const isSupabase = src.includes("supabase.co");
  const shouldUnoptimize = unoptimized ?? isSupabase;

  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={shouldUnoptimize}
      />
    );
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
