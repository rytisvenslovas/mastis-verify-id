-- Document Collection System Schema
-- Run this script in your Supabase SQL Editor to create the tables

-- Table: links
-- Stores the generated document collection links
CREATE TABLE IF NOT EXISTS "links" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "surname" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "require_id" BOOLEAN DEFAULT false,
  "require_selfie" BOOLEAN DEFAULT false,
  "require_address_proof" BOOLEAN DEFAULT false,
  "token" UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  "link" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Table: submissions
-- Stores the uploaded documents and submission data
CREATE TABLE IF NOT EXISTS "submissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_link_id" UUID NOT NULL,
  "token" UUID NOT NULL,
  "id_type" TEXT,
  "id_picture" TEXT,
  "selfie" TEXT,
  "address_proof_type" TEXT,
  "address_proof_picture" TEXT,
  "submitted_at" TIMESTAMPTZ DEFAULT NOW(),
  "status" TEXT DEFAULT 'pending'
);

-- Add foreign key constraint
ALTER TABLE "submissions"
ADD CONSTRAINT "submissions_token_fkey" 
FOREIGN KEY ("token") 
REFERENCES "links"("token") 
ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_links_token" ON "links"("token");
CREATE INDEX IF NOT EXISTS "idx_links_email" ON "links"("email");
CREATE INDEX IF NOT EXISTS "idx_links_phone" ON "links"("phone");
CREATE INDEX IF NOT EXISTS "idx_submissions_token" ON "submissions"("token");
CREATE INDEX IF NOT EXISTS "idx_submissions_document_link_id" ON "submissions"("document_link_id");
CREATE INDEX IF NOT EXISTS "idx_submissions_status" ON "submissions"("status");

-- Add comments for documentation
COMMENT ON TABLE "links" IS 'Stores generated document collection links with user information';
COMMENT ON TABLE "submissions" IS 'Stores submitted documents uploaded via the public verify page';

COMMENT ON COLUMN "links"."token" IS 'Unique UUID token used in the public verification URL';
COMMENT ON COLUMN "links"."link" IS 'Full URL for document collection (e.g., https://domain.com/verify/token)';
COMMENT ON COLUMN "submissions"."status" IS 'Submission status: pending, submitted, approved, rejected';
