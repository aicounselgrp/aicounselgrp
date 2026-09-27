-- Sample/founding members — for local dev and demo. Replace with the real
-- initial roster, or delete this file if every real member should go
-- through the application flow instead.
--   psql "$DATABASE_URL" -f db/seed.sql

insert into members (name, email, title, firm, focus, location)
values
  ('Jordan Ellis', 'jordan@ellisferro.example', 'Partner', 'Ellis & Ferro LLP', array['AI Governance', 'Product Liability'], 'New York, NY'),
  ('Priya Nair', 'priya@nairtechlaw.example', 'Counsel', 'Nair Technology Law', array['Data Privacy', 'Model Training Rights'], 'San Francisco, CA'),
  ('Marcus Webb', 'marcus@webbailaw.example', 'Founding Attorney', 'Webb AI Law', array['Regulatory Compliance', 'Agentic Systems'], 'Austin, TX')
on conflict (email) do nothing;
