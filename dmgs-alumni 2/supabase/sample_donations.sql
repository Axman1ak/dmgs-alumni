-- ============================================================================
-- Disposable SAMPLE donations + class goals, for testing the dashboards.
-- Remove with:
--   delete from public.donations where paystack_reference like 'SAMPLE-%';
-- ============================================================================
update public.classes set donation_goal = 2000000 where year in (1977, 1982);
update public.classes set donation_goal = 1000000 where year in (1975, 1980);

insert into public.donations (donor_name, class_year, amount, currency, is_anonymous, paystack_reference, status) values
('Adebayo Okonkwo', 1977, 100000, 'NGN', false, 'SAMPLE-001', 'success'),
('Anonymous',       1977, 250000, 'NGN', true,  'SAMPLE-002', 'success'),
('Chukwuma Eze',    1977, 50000,  'NGN', false, 'SAMPLE-003', 'success'),
('Tunde Bakare',    1979, 75000,  'NGN', false, 'SAMPLE-004', 'success'),
('Folake Adeyemi',  1982, 500000, 'NGN', false, 'SAMPLE-005', 'success'),
('Aisha Mohammed',  1982, 25000,  'NGN', false, 'SAMPLE-006', 'success'),
('Anonymous',       1982, 100000, 'NGN', true,  'SAMPLE-007', 'success'),
('Emeka Nwosu',     1975, 200000, 'NGN', false, 'SAMPLE-008', 'success'),
('Olusegun Fashola',1970, 150000, 'NGN', false, 'SAMPLE-009', 'success'),
('Yetunde Balogun', 1980, 300000, 'NGN', false, 'SAMPLE-010', 'success'),
('Kemi Alabi',      1985, 40000,  'NGN', false, 'SAMPLE-011', 'success'),
('Adebayo Okonkwo', 1977, 60000,  'NGN', false, 'SAMPLE-012', 'success');
