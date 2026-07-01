-- ============================================================================
-- 0010 — projects table
-- Fundraising projects managed by the super admin, readable by approved
-- members. Seeds the three starter projects (bursary, labs, library).
-- ============================================================================

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  tag         text not null,
  title       text not null,
  tagline     text,
  idea        jsonb not null default '[]'::jsonb,   -- array of paragraph strings
  budget      jsonb not null default '[]'::jsonb,   -- array of {label, amount}
  art         text not null default 'library',      -- svg style: bursary|labs|library
  photo_url   text,
  goal        numeric(14,2) not null default 0,
  impact      text,
  sort_order  int not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

create policy projects_select on public.projects
  for select using (
    (public.is_approved() and is_published) or public.is_super_admin()
  );

create policy projects_admin_all on public.projects
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Seed the three starter projects.
insert into public.projects (slug, tag, title, tagline, idea, budget, art, goal, impact, sort_order) values
(
  'bursary-fund', 'Bursary Fund', 'Send a bright student to school',
  'A full year of schooling for a child who would otherwise be sent home.',
  '["Every term, promising students at Doherty Memorial are sent home because their families cannot raise the fees. Talent isn''t the barrier — a few thousand naira is.","The Bursary Fund closes that gap. Alumni cover tuition, uniforms, books, and exam fees for the students the school identifies as most capable and most in need. No child who can learn should lose the chance over money.","Recipients are nominated by their teachers and reviewed by the association. Every dispersal is recorded and published back to donors."]'::jsonb,
  '[{"label":"Tuition & levies — 10 students","amount":750000},{"label":"Uniforms & textbooks","amount":300000},{"label":"WAEC / exam registration","amount":250000},{"label":"Meals & transport support","amount":200000}]'::jsonb,
  'bursary', 1500000, '10 students carried through a full academic year.', 1
),
(
  'science-labs', 'Science Labs', 'Re-equip the laboratories',
  'Real instruments for physics, chemistry, and biology.',
  '["For years, science at Doherty has been taught from the board — students memorise experiments they''ve never run. In a school that has produced doctors and engineers across three continents, that''s a loss the association can fix.","This project re-equips all three laboratories with working glassware, apparatus, microscopes, and the safety fittings a modern lab needs, so the next generation learns science by doing it.","Equipment is bought against published quotes, and the receipts are shared with every donor after purchase."]'::jsonb,
  '[{"label":"Chemistry glassware & reagents","amount":900000},{"label":"Physics apparatus","amount":800000},{"label":"Biology microscopes & specimens","amount":700000},{"label":"Benches, fittings & safety gear","amount":600000}]'::jsonb,
  'labs', 3000000, 'Three working labs serving roughly 600 students a year.', 2
),
(
  'library-digital', 'Library & Digital', 'Books and a computer room',
  'A restocked library and internet-connected computers.',
  '["The library shelves are thin and there isn''t a single working computer on campus. Students leave school having never sat at a keyboard — a real handicap the moment they step into the wider world.","This project refills the library with current books and builds a small computer room: fifteen desktops, networking, and an internet connection the whole school can share.","Hardware is purchased at published prices and inventoried on delivery, with the list shared back to donors."]'::jsonb,
  '[{"label":"New books & shelving","amount":700000},{"label":"15 desktop computers","amount":1050000},{"label":"Internet & networking","amount":450000},{"label":"Furniture & lighting","amount":300000}]'::jsonb,
  'library', 2500000, 'A stocked library and a computer room for the whole school.', 3
);
