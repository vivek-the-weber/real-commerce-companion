-- Drop the existing policy that doesn't work for guests
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Policy for authenticated users: must own the order
CREATE POLICY "Authenticated users can create their own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for guest orders: user_id must be NULL
CREATE POLICY "Guest orders can be created" ON orders
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);