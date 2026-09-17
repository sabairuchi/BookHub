import React, { useState, useEffect } from 'react';

const DEFAULT_BOOK_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600";

const SafeImage = ({ src, alt, className, style, fallbackSrc = DEFAULT_BOOK_COVER, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || "Book cover"}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
