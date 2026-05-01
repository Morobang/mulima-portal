-- Replace these UUIDs with your actual ones from Supabase Auth → Users
do $$
declare
  student_uid uuid := 'PASTE-STUDENT-UUID-HERE';
  parent_uid  uuid := 'PASTE-PARENT-UUID-HERE';
  teacher_uid uuid := 'PASTE-TEACHER-UUID-HERE';
  admin_uid   uuid := 'PASTE-ADMIN-UUID-HERE';

  learner_id  uuid;
  parent_id   uuid;
  teacher_id  uuid;
  subject_math uuid;
  subject_sci  uuid;
  subject_eng  uuid;
  subject_hist uuid;
  subject_afr  uuid;
  subject_pe   uuid;
  assessment_id uuid;

begin

  -- PROFILES
  insert into profiles (id, full_name, role, phone) values
    (student_uid, 'Lerato Mokgalaka', 'student', null),
    (parent_uid,  'Mr & Mrs Mokgalaka', 'parent', '0710001234'),
    (teacher_uid, 'Mr Ndlovu', 'teacher', '0720005678'),
    (admin_uid,   'Principal Mokoena', 'admin', '0730009012');

  -- LEARNER
  insert into learners (user_id, student_no, full_name, grade, class_group, gender)
    values (student_uid, '2021-1147', 'Lerato Mokgalaka', 'Grade 11', '11B', 'Female')
    returning id into learner_id;

  -- PARENT
  insert into parents (user_id, full_name, phone, email)
    values (parent_uid, 'Mr & Mrs Mokgalaka', '0710001234', 'parent@mulima.test')
    returning id into parent_id;

  insert into parent_learner (parent_id, learner_id) values (parent_id, learner_id);

  -- STAFF
  insert into staff (user_id, full_name, role, subjects)
    values (teacher_uid, 'Mr Ndlovu', 'hod', array['Mathematics'])
    returning id into teacher_id;

  -- AUTHORISED COLLECTORS
  insert into authorised_collectors (learner_id, full_name, relationship, phone) values
    (learner_id, 'Mr Mokgalaka', 'Father', '0710001234'),
    (learner_id, 'Mrs Mokgalaka', 'Mother', '0720005678'),
    (learner_id, 'Ms Nkosi', 'Aunt', '0730009012');

  -- GET SUBJECT IDS
  select id into subject_math from subjects where code = 'MATH11';
  select id into subject_sci  from subjects where code = 'LSCI11';
  select id into subject_eng  from subjects where code = 'ENG11';
  select id into subject_hist from subjects where code = 'HIST11';
  select id into subject_afr  from subjects where code = 'AFR11';
  select id into subject_pe   from subjects where code = 'PE11';

  -- TIMETABLE for Grade 11B
  insert into timetable (grade, class_group, day, period, subject_id, teacher_id, room, start_time, end_time) values
    ('Grade 11', '11B', 'Monday',    1, subject_math, teacher_id, 'B12', '07:30', '08:20'),
    ('Grade 11', '11B', 'Monday',    2, subject_sci,  teacher_id, 'Lab 2', '08:20', '09:10'),
    ('Grade 11', '11B', 'Monday',    3, subject_eng,  teacher_id, 'A06', '09:30', '10:20'),
    ('Grade 11', '11B', 'Monday',    4, subject_hist, teacher_id, 'A09', '10:20', '11:10'),
    ('Grade 11', '11B', 'Tuesday',   1, subject_math, teacher_id, 'B12', '07:30', '08:20'),
    ('Grade 11', '11B', 'Tuesday',   2, subject_sci,  teacher_id, 'Lab 2', '08:20', '09:10'),
    ('Grade 11', '11B', 'Tuesday',   3, subject_eng,  teacher_id, 'A06', '09:30', '10:20'),
    ('Grade 11', '11B', 'Tuesday',   4, subject_afr,  teacher_id, 'A04', '10:20', '11:10'),
    ('Grade 11', '11B', 'Wednesday', 1, subject_eng,  teacher_id, 'A06', '07:30', '08:20'),
    ('Grade 11', '11B', 'Wednesday', 2, subject_hist, teacher_id, 'A09', '08:20', '09:10'),
    ('Grade 11', '11B', 'Wednesday', 3, subject_sci,  teacher_id, 'Lab 2', '09:30', '10:20'),
    ('Grade 11', '11B', 'Wednesday', 4, subject_math, teacher_id, 'B12', '10:20', '11:10'),
    ('Grade 11', '11B', 'Thursday',  1, subject_sci,  teacher_id, 'Lab 2', '07:30', '08:20'),
    ('Grade 11', '11B', 'Thursday',  2, subject_math, teacher_id, 'B12', '08:20', '09:10'),
    ('Grade 11', '11B', 'Thursday',  3, subject_afr,  teacher_id, 'A04', '09:30', '10:20'),
    ('Grade 11', '11B', 'Thursday',  4, subject_pe,   teacher_id, 'Fields', '10:20', '11:10'),
    ('Grade 11', '11B', 'Friday',    1, subject_math, teacher_id, 'B12', '07:30', '08:20'),
    ('Grade 11', '11B', 'Friday',    2, subject_afr,  teacher_id, 'A04', '08:20', '09:10'),
    ('Grade 11', '11B', 'Friday',    3, subject_hist, teacher_id, 'A09', '09:30', '10:20'),
    ('Grade 11', '11B', 'Friday',    4, subject_sci,  teacher_id, 'Lab 2', '10:20', '11:10');

  -- ASSESSMENTS
  insert into assessments (subject_id, teacher_id, class_group, grade, name, type, max_score, date, term)
    values (subject_math, teacher_id, '11B', 'Grade 11', 'Test 1', 'test', 100, '2025-04-10', 2)
    returning id into assessment_id;

  insert into marks (assessment_id, learner_id, score) values (assessment_id, learner_id, 72);

  insert into assessments (subject_id, teacher_id, class_group, grade, name, type, max_score, date, term)
    values (subject_sci, teacher_id, '11B', 'Grade 11', 'Practical 1', 'practical', 50, '2025-04-15', 2)
    returning id into assessment_id;

  insert into marks (assessment_id, learner_id, score) values (assessment_id, learner_id, 41);

  insert into assessments (subject_id, teacher_id, class_group, grade, name, type, max_score, date, term)
    values (subject_hist, teacher_id, '11B', 'Grade 11', 'Essay', 'assignment', 50, '2025-04-20', 2)
    returning id into assessment_id;

  insert into marks (assessment_id, learner_id, score) values (assessment_id, learner_id, 29);

  insert into assessments (subject_id, teacher_id, class_group, grade, name, type, max_score, date, term)
    values (subject_eng, teacher_id, '11B', 'Grade 11', 'Comprehension', 'test', 50, '2025-04-22', 2)
    returning id into assessment_id;

  insert into marks (assessment_id, learner_id, score) values (assessment_id, learner_id, 34);

  insert into assessments (subject_id, teacher_id, class_group, grade, name, type, max_score, date, term)
    values (subject_afr, teacher_id, '11B', 'Grade 11', 'Test 1', 'test', 50, '2025-04-24', 2)
    returning id into assessment_id;

  insert into marks (assessment_id, learner_id, score) values (assessment_id, learner_id, 32);

  -- ATTENDANCE (April 2025)
  insert into attendance (learner_id, teacher_id, date, period, status) values
    (learner_id, teacher_id, '2025-04-07', 1, 'present'),
    (learner_id, teacher_id, '2025-04-08', 1, 'present'),
    (learner_id, teacher_id, '2025-04-09', 1, 'present'),
    (learner_id, teacher_id, '2025-04-10', 1, 'present'),
    (learner_id, teacher_id, '2025-04-11', 1, 'present'),
    (learner_id, teacher_id, '2025-04-14', 1, 'absent'),
    (learner_id, teacher_id, '2025-04-15', 1, 'absent'),
    (learner_id, teacher_id, '2025-04-16', 1, 'present'),
    (learner_id, teacher_id, '2025-04-17', 1, 'present'),
    (learner_id, teacher_id, '2025-04-22', 1, 'present'),
    (learner_id, teacher_id, '2025-04-23', 1, 'present'),
    (learner_id, teacher_id, '2025-04-24', 1, 'present'),
    (learner_id, teacher_id, '2025-04-25', 1, 'late'),
    (learner_id, teacher_id, '2025-04-28', 1, 'present'),
    (learner_id, teacher_id, '2025-04-29', 1, 'present');

  -- HOMEWORK
  insert into homework (teacher_id, subject_id, grade, class_group, description, due_date) values
    (teacher_id, subject_math, 'Grade 11', '11B', 'Exercise 4.3 — page 89 (questions 1–10)', '2025-04-29'),
    (teacher_id, subject_hist, 'Grade 11', '11B', 'Essay draft — The impact of apartheid on education in South Africa', '2025-05-01'),
    (teacher_id, subject_eng,  'Grade 11', '11B', 'Read chapters 5 and 6 of the prescribed novel', '2025-05-02');

  -- FEES
  insert into fees (learner_id, description, amount, paid, due_date, status, term) values
    (learner_id, 'Term 1 school fees', 1200, 1200, '2025-01-15', 'paid', 1),
    (learner_id, 'Sport levy', 350, 350, '2025-01-31', 'paid', 1),
    (learner_id, 'Term 2 school fees', 1200, 350, '2025-05-05', 'partial', 2),
    (learner_id, 'Grade 12 study camp', 450, 0, '2025-05-02', 'unpaid', 2),
    (learner_id, 'School magazine', 80, 0, '2025-04-30', 'unpaid', 2);

  -- WELLBEING
  insert into wellbeing_checkins (learner_id, mood_score, date) values
    (learner_id, 3, '2025-04-28'),
    (learner_id, 4, '2025-04-29');

  -- MESSAGES
  insert into messages (from_user_id, to_user_id, subject, body, read) values
    (teacher_uid, student_uid,
     'History essay marks',
     'Lerato, please see me before Thursday regarding your essay marks. I would like to discuss how we can improve before the mid-year exams. Room A09.',
     false),
    (admin_uid, parent_uid,
     'Term 2 fees reminder',
     'Dear Parent, please note that Term 2 fees are due by 5 May 2025. Please contact the school office if you require a payment arrangement.',
     false);

  -- REPORT COMMENTS
  insert into report_comments (learner_id, teacher_id, subject_id, term, status, comment) values
    (learner_id, teacher_id, subject_math, 2, 'draft', 'Lerato has shown good understanding of algebraic concepts. She should focus on functions and calculus preparation before the mid-year examination.'),
    (learner_id, teacher_id, subject_sci,  2, 'submitted', 'Excellent practical work this term. Lerato demonstrates strong scientific reasoning skills.');

end $$;