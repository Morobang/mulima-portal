-- ENABLE UUID EXTENSION
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────
-- Extends Supabase auth.users with role and display name
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('student', 'parent', 'teacher', 'admin')),
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ─── LEARNERS ───────────────────────────────────────────
create table learners (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique,
  student_no text unique not null,
  full_name text not null,
  grade text not null,
  class_group text not null,
  date_of_birth date,
  gender text,
  created_at timestamptz default now()
);

-- ─── PARENTS ────────────────────────────────────────────
create table parents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- link table — one parent can have multiple children
create table parent_learner (
  parent_id uuid references parents(id) on delete cascade,
  learner_id uuid references learners(id) on delete cascade,
  primary key (parent_id, learner_id)
);

-- ─── STAFF ──────────────────────────────────────────────
create table staff (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique,
  full_name text not null,
  role text not null check (role in ('teacher', 'hod', 'admin', 'principal')),
  subjects text[], -- array e.g. {'Mathematics', 'Physical Sciences'}
  leave_balance int default 21,
  created_at timestamptz default now()
);

-- ─── SUBJECTS ───────────────────────────────────────────
create table subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null,
  grade text not null
);

-- ─── TIMETABLE ──────────────────────────────────────────
create table timetable (
  id uuid default uuid_generate_v4() primary key,
  grade text not null,
  class_group text not null,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  period int not null check (period between 1 and 8),
  subject_id uuid references subjects(id),
  teacher_id uuid references staff(id),
  room text,
  start_time text,
  end_time text
);

-- ─── MARKS ──────────────────────────────────────────────
create table assessments (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references subjects(id),
  teacher_id uuid references staff(id),
  class_group text not null,
  grade text not null,
  name text not null, -- e.g. "Test 1", "Mid-year Exam"
  type text check (type in ('test','exam','practical','assignment','project')),
  max_score int not null,
  date date not null,
  term int check (term between 1 and 4),
  created_at timestamptz default now()
);

create table marks (
  id uuid default uuid_generate_v4() primary key,
  assessment_id uuid references assessments(id) on delete cascade,
  learner_id uuid references learners(id) on delete cascade,
  score numeric,
  submitted_at timestamptz default now(),
  unique(assessment_id, learner_id)
);

-- ─── ATTENDANCE ─────────────────────────────────────────
create table attendance (
  id uuid default uuid_generate_v4() primary key,
  learner_id uuid references learners(id) on delete cascade,
  teacher_id uuid references staff(id),
  date date not null,
  period int,
  status text not null check (status in ('present','absent','late')),
  reason text,
  note_submitted boolean default false,
  created_at timestamptz default now(),
  unique(learner_id, date, period)
);

-- ─── HOMEWORK ───────────────────────────────────────────
create table homework (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references staff(id),
  subject_id uuid references subjects(id),
  grade text not null,
  class_group text not null,
  description text not null,
  due_date date not null,
  created_at timestamptz default now()
);

create table homework_submissions (
  id uuid default uuid_generate_v4() primary key,
  homework_id uuid references homework(id) on delete cascade,
  learner_id uuid references learners(id) on delete cascade,
  status text check (status in ('not_started','in_progress','submitted')),
  submitted_at timestamptz,
  mark numeric,
  unique(homework_id, learner_id)
);

-- ─── FEES ───────────────────────────────────────────────
create table fees (
  id uuid default uuid_generate_v4() primary key,
  learner_id uuid references learners(id) on delete cascade,
  description text not null,
  amount numeric not null,
  paid numeric default 0,
  due_date date,
  status text check (status in ('paid','partial','unpaid')) default 'unpaid',
  term int,
  year int default extract(year from now())::int,
  created_at timestamptz default now()
);

-- ─── NOTICES ────────────────────────────────────────────
create table notices (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  audience text check (audience in ('all','parents','students','teachers','admin')) default 'all',
  category text check (category in ('general','urgent','academic','finance','sport','events','culture')) default 'general',
  posted_by uuid references profiles(id),
  is_public boolean default false, -- shows on landing page if true
  created_at timestamptz default now()
);

-- ─── CALENDAR EVENTS ────────────────────────────────────
create table calendar_events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  date_start date not null,
  date_end date,
  category text check (category in ('academic','sport','culture','admin','exam','holiday')),
  audience text check (audience in ('all','parents','students','teachers')) default 'all',
  created_at timestamptz default now()
);

-- ─── MESSAGES ───────────────────────────────────────────
create table messages (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  subject text not null,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ─── REPORT COMMENTS ────────────────────────────────────
create table report_comments (
  id uuid default uuid_generate_v4() primary key,
  learner_id uuid references learners(id),
  teacher_id uuid references staff(id),
  subject_id uuid references subjects(id),
  term int not null,
  year int default extract(year from now())::int,
  comment text,
  status text check (status in ('not_started','draft','submitted','approved')) default 'not_started',
  updated_at timestamptz default now()
);

-- ─── LEAVE APPLICATIONS ─────────────────────────────────
create table leave_applications (
  id uuid default uuid_generate_v4() primary key,
  staff_id uuid references staff(id),
  type text check (type in ('annual','sick','family','study')),
  date_from date not null,
  date_to date not null,
  reason text,
  status text check (status in ('pending','approved','declined')) default 'pending',
  created_at timestamptz default now()
);

-- ─── AUTHORISED COLLECTORS ──────────────────────────────
create table authorised_collectors (
  id uuid default uuid_generate_v4() primary key,
  learner_id uuid references learners(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text not null,
  id_number text,
  created_at timestamptz default now()
);

-- ─── WELLBEING CHECK-INS ────────────────────────────────
create table wellbeing_checkins (
  id uuid default uuid_generate_v4() primary key,
  learner_id uuid references learners(id) on delete cascade,
  mood_score int check (mood_score between 1 and 5),
  note text,
  date date default current_date,
  created_at timestamptz default now()
);

-- ─── INVENTORY ──────────────────────────────────────────
create table inventory (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text check (category in ('textbook','furniture','equipment','technology','sport','other')),
  quantity int default 0,
  condition text check (condition in ('good','fair','poor','needs_repair')),
  location text,
  created_at timestamptz default now()
);

-- ─── MAINTENANCE REQUESTS ───────────────────────────────
create table maintenance_requests (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  location text not null,
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  status text check (status in ('not_started','in_progress','completed')) default 'not_started',
  logged_by uuid references profiles(id),
  assigned_to text,
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────
alter table profiles enable row level security;
alter table learners enable row level security;
alter table marks enable row level security;
alter table attendance enable row level security;
alter table fees enable row level security;
alter table notices enable row level security;
alter table messages enable row level security;
alter table wellbeing_checkins enable row level security;

-- Profiles: users can only read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Notices: everyone logged in can read notices meant for them
create policy "Authenticated users can read notices"
  on notices for select
  to authenticated
  using (true);

-- Messages: users only see their own messages
create policy "Users see own messages"
  on messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);