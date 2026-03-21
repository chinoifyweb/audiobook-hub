import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadDocument(
  file: File,
  folder: string
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("application-documents")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("application-documents")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl, path: fileName };
}

export async function deleteDocument(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from("application-documents")
    .remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }
  return true;
}
