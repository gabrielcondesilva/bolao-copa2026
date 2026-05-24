-- Grant full access to service_role on all public tables.
-- service_role bypasses RLS but still requires table-level privileges.
-- With the new Supabase key format (sb_secret_*) these grants are not
-- applied automatically for tables created via migrations.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
