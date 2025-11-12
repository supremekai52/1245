/*
  # Create institution authorization requests table

  1. New Tables
    - `institution_authorization_requests`
      - `id` (uuid, primary key)
      - `institution_name` (text, institution name)
      - `wallet_address` (text, ethereum wallet address)
      - `email` (text, contact email)
      - `phone` (text, phone number)
      - `description` (text, institution description)
      - `status` (text, pending/approved/rejected)
      - `admin_notes` (text, notes from admin)
      - `authorization_hash` (text, blockchain authorization hash)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `institution_authorization_requests` table
    - Add policy for institutions to read their own requests
    - Add policy for institutions to create new requests
    - Add policy for admin to read all requests
    - Add policy for admin to update requests
*/

CREATE TABLE IF NOT EXISTS institution_authorization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name text NOT NULL,
  wallet_address text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text DEFAULT '',
  authorization_hash text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE institution_authorization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institutions can view their own authorization requests"
  ON institution_authorization_requests FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Institutions can create authorization requests"
  ON institution_authorization_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all authorization requests"
  ON institution_authorization_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update authorization requests"
  ON institution_authorization_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_institution_auth_status ON institution_authorization_requests(status);
CREATE INDEX IF NOT EXISTS idx_institution_auth_email ON institution_authorization_requests(email);
CREATE INDEX IF NOT EXISTS idx_institution_auth_wallet ON institution_authorization_requests(wallet_address);