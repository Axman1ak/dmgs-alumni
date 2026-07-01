-- ============================================================================
-- Disposable SAMPLE alumni for developing/testing the directory UI.
-- These are fictional. Remove them anytime with:
--     delete from public.alumni where chapter = 'Sample';
-- ============================================================================
insert into public.alumni (full_name, class_year, occupation, city, country, phone, email, bio, chapter) values
('Adebayo Okonkwo', 1977, 'Cardiologist', 'Houston, TX', 'United States', '+1 713 555 0142', 'adebayo.o@example.com', 'Retired consultant cardiologist; served as class prefect in 1977.', 'Sample'),
('Folake Adeyemi', 1982, 'Attorney', 'Toronto, ON', 'Canada', '+1 416 555 0198', 'folake.a@example.com', 'Immigration lawyer and community organiser in the GTA.', 'Sample'),
('Emeka Nwosu', 1975, 'Petroleum Engineer', 'Lagos', 'Nigeria', '+234 803 555 0111', null, 'Split time between Lagos and Aberdeen for two decades.', 'Sample'),
('Yetunde Balogun', 1980, 'Professor of Economics', 'London', 'United Kingdom', null, 'yetunde.b@example.com', null, 'Sample'),
('Chukwuma Eze', 1978, null, 'New York, NY', 'United States', '+1 212 555 0173', null, null, 'Sample'),
('Aisha Mohammed', 1982, 'Pharmacist', 'Calgary, AB', 'Canada', '+1 403 555 0166', 'aisha.m@example.com', null, 'Sample'),
('Olusegun Fashola', 1970, 'Architect', 'Abuja', 'Nigeria', '+234 807 555 0100', 'segun.f@example.com', 'Designed several public buildings across Ekiti State.', 'Sample'),
('Ngozi Okafor', null, 'Nurse', 'Manchester', 'United Kingdom', null, null, 'Year unknown — to be confirmed by the alumna.', 'Sample'),
('Tunde Bakare', 1979, 'Software Engineer', 'San Jose, CA', 'United States', '+1 408 555 0155', 'tunde.b@example.com', 'Early web engineer; mentors young DMGS alumni in tech.', 'Sample'),
('Kemi Alabi', 1985, 'Entrepreneur', 'Atlanta, GA', 'United States', '+1 404 555 0188', 'kemi.a@example.com', 'Founder of a logistics startup serving West Africa.', 'Sample');
