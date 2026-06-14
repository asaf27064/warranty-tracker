import { useState, type ReactNode } from "react";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  // Rendered when there's no image or it fails to load (e.g. deleted from R2).
  fallback: ReactNode;
};

const ProductImage = ({ src, alt, className, fallback }: Props) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default ProductImage;
