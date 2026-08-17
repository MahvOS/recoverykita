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
};

export function RemoteImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
}: RemoteImageProps) {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
