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

-- Admin accounts — password_hash starts null; each admin sets their own
-- password via the "set password" email link (see /admin/login "Set up
-- your password" or POST /api/admin/set-password/request).
insert into admins (email)
values
  ('stephanie.anelli@gmail.com'),
  ('melissadanelli@gmail.com')
on conflict (email) do nothing;

-- Default approval/rejection email copy — editable at /admin/templates.
insert into email_templates (key, subject, body)
values
  (
    'approval',
    'Welcome to AI Counsel',
    E'Hi {{name}},\n\nYour application to join AI Counsel has been approved — welcome!\n\nYou can now log in to the member directory. Enter this email address on the login page and we''ll send you a secure login link:\n\n{{login_url}}\n\n— The AI Counsel team'
  ),
  (
    'rejection',
    'Your AI Counsel application',
    E'Hi {{name}},\n\nThank you for your interest in AI Counsel. After review, we''re not able to offer membership at this time.\n\n— The AI Counsel team'
  )
on conflict (key) do nothing;
