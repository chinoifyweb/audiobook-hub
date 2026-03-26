import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Initializes the library_books table if it does not already exist.
 * Call this once after deployment if the Prisma migration hasn't been applied.
 */
export async function POST() {
  try {
    await requireAdmin();

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "library_books" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "author" TEXT NOT NULL,
        "description" TEXT,
        "category" TEXT NOT NULL,
        "subcategory" TEXT,
        "cover_image_url" TEXT,
        "file_url" TEXT NOT NULL,
        "file_type" TEXT NOT NULL,
        "file_size" BIGINT NOT NULL,
        "isbn" TEXT,
        "publisher" TEXT,
        "publication_year" INTEGER,
        "language" TEXT NOT NULL DEFAULT 'English',
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "download_count" INTEGER NOT NULL DEFAULT 0,
        "is_public" BOOLEAN NOT NULL DEFAULT true,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "uploaded_by" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "library_books_category_idx" ON "library_books"("category");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "library_books_uploaded_by_idx" ON "library_books"("uploaded_by");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "library_books_is_active_is_public_idx" ON "library_books"("is_active", "is_public");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'library_books_uploaded_by_fkey'
        ) THEN
          ALTER TABLE "library_books"
            ADD CONSTRAINT "library_books_uploaded_by_fkey"
            FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: "Library books table initialized successfully",
    });
  } catch (error) {
    console.error("Library init error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to initialize library table", details: message },
      { status: 500 },
    );
  }
}
