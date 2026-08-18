import { supabase, isSupabaseConfigured } from "../supabaseClient";

/**
 * Compress an image file using Canvas before uploading.
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);

    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Supabase Storage bucket.
 * Falls back to Data URL / Blob URL if offline or unconfigured.
 */
export async function uploadFile(bucket, file, pathPrefix = "uploads") {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file);
  }

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.warn(`Storage upload to ${bucket} failed:`, error.message);
      return URL.createObjectURL(file);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData?.publicUrl || URL.createObjectURL(file);
  } catch (err) {
    console.warn("Storage upload error fallback:", err);
    return URL.createObjectURL(file);
  }
}
