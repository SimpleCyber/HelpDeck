import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary for server-side use
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Generates an optimized Cloudinary URL for an image.
 * This can be used on the client-side.
 */
export function getOptimizedImageUrl(publicId: string, options: any = {}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // Basic URL generation if we don't want to bring the whole SDK to the client
  // Format: https://res.cloudinary.com/<cloud_name>/image/upload/<transformations>/<public_id>

  const transformations = [];
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality || "auto"}`);
  if (options.format) transformations.push(`f_${options.format || "auto"}`);

  const transString =
    transformations.length > 0 ? transformations.join(",") + "/" : "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transString}${publicId}`;
}
