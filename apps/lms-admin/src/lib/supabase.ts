import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const LIBRARY_BOOKS_BUCKET = "library-books";
export const LIBRARY_COVERS_BUCKET = "library-covers";

/**
 * Upload a book file to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadLibraryFile(
  file: File,
  bucket: string,
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, path: filePath };
}

/**
 * Delete a file from Supabase Storage by its path.
 */
export async function deleteLibraryFile(
  bucket: string,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }
  return true;
}
