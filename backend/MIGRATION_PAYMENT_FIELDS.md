# Migration Guide: Payment Fields

## Database Migration Required

After updating the schema, you need to run a migration to add the new payment fields to the `event_attendees` table.

### Steps:

1. **Generate the migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_payment_fields_to_event_attendees
   ```

2. **Or manually create migration SQL:**
   ```sql
   ALTER TABLE event_attendees 
   ADD COLUMN payment_method VARCHAR(20),
   ADD COLUMN points_used INTEGER,
   ADD COLUMN cash_price DOUBLE PRECISION,
   ADD COLUMN credit_card_price DOUBLE PRECISION;
   ```

3. **Apply the migration:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Notes

- Existing records will have `NULL` values for payment fields (which is fine for free events)
- For paid events, payment fields will be populated when users join
- Consider adding refund logic when users leave paid events (points refund)
