-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  DesignOffice — Supabase Schema                                 ║
-- ║  Выполните этот SQL в Supabase: SQL Editor → New Query → Run    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. USERS (profiles)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'designer' check (role in ('designer', 'client', 'worker')),
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  avatar_url text,
  city text,
  specialization text,
  bio text,
  created_at timestamptz not null default now()
);

-- 2. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'review', 'completed')),
  description text,
  address text,
  area numeric,
  rooms integer,
  style text,
  budget numeric,
  start_date date,
  deadline date,
  created_at timestamptz not null default now()
);

-- 3. PROJECT_MEMBERS
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'worker')),
  invited_at timestamptz not null default now(),
  accepted boolean not null default false,
  unique(project_id, user_id)
);

-- 4. STAGES
create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  order_number integer not null default 0,
  start_date date,
  end_date date
);

-- 5. TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  deadline date,
  created_at timestamptz not null default now()
);

-- 6. FILES
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  uploaded_by uuid references public.users(id) on delete set null,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

-- 7. MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 8. COMMENTS (on stages)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 9. BRIEFS
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.users(id) on delete set null,
  property_type text,
  area numeric,
  residents integer,
  has_children boolean default false,
  has_pets boolean default false,
  style_preferences text[],
  color_preferences text,
  functional_requirements jsonb,
  budget_range numeric,
  additional_notes text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

-- 10. BRIEF_REFERENCES
create table if not exists public.brief_references (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.briefs(id) on delete cascade,
  image_url text not null,
  description text
);

-- 11. ESTIMATES
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_at timestamptz not null default now()
);

-- 12. ESTIMATE_ITEMS
create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  category text not null check (category in ('furniture', 'materials', 'works', 'decor')),
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'шт',
  price_per_unit numeric not null default 0,
  total numeric generated always as (quantity * price_per_unit) stored
);

-- 13. PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'worker_payment')),
  description text,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  due_date date,
  paid_date date,
  category text
);

-- 14. DOCUMENTS
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('contract', 'estimate', 'schedule', 'act')),
  title text not null,
  generated_url text,
  signed_url text,
  status text not null default 'not_ready' check (status in ('generated', 'signed', 'not_ready')),
  created_at timestamptz not null default now()
);

-- 15. REVIEWS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.stages enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;
alter table public.messages enable row level security;
alter table public.comments enable row level security;
alter table public.briefs enable row level security;
alter table public.brief_references enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.reviews enable row level security;

-- USERS: everyone can read designers (guild), own profile writable
create policy "Anyone can view designers" on public.users for select using (role = 'designer');
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- PROJECTS: designer sees own, members see theirs
create policy "Designer sees own projects" on public.projects for select using (designer_id = auth.uid());
create policy "Members see their projects" on public.projects for select using (
  id in (select project_id from public.project_members where user_id = auth.uid())
);
create policy "Designer creates projects" on public.projects for insert with check (designer_id = auth.uid());
create policy "Designer updates own projects" on public.projects for update using (designer_id = auth.uid());
create policy "Designer deletes own projects" on public.projects for delete using (designer_id = auth.uid());

-- PROJECT_MEMBERS
create policy "Designer manages members" on public.project_members for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Members see own membership" on public.project_members for select using (user_id = auth.uid());

-- STAGES
create policy "Project participants see stages" on public.stages for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
  or project_id in (select project_id from public.project_members where user_id = auth.uid())
);
create policy "Designer manages stages" on public.stages for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);

-- TASKS
create policy "Project participants see tasks" on public.tasks for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
  or project_id in (select project_id from public.project_members where user_id = auth.uid())
  or assigned_to = auth.uid()
);
create policy "Designer manages tasks" on public.tasks for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Assigned user updates task" on public.tasks for update using (assigned_to = auth.uid());

-- FILES
create policy "Project participants see files" on public.files for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
  or project_id in (select project_id from public.project_members where user_id = auth.uid())
);
create policy "Participants upload files" on public.files for insert with check (
  project_id in (select id from public.projects where designer_id = auth.uid())
  or project_id in (select project_id from public.project_members where user_id = auth.uid())
);

-- MESSAGES
create policy "Project participants see messages" on public.messages for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
  or project_id in (select project_id from public.project_members where user_id = auth.uid())
);
create policy "Participants send messages" on public.messages for insert with check (
  sender_id = auth.uid() and (
    project_id in (select id from public.projects where designer_id = auth.uid())
    or project_id in (select project_id from public.project_members where user_id = auth.uid())
  )
);

-- COMMENTS
create policy "Project participants see comments" on public.comments for select using (
  stage_id in (
    select s.id from public.stages s
    join public.projects p on p.id = s.project_id
    where p.designer_id = auth.uid()
  )
  or stage_id in (
    select s.id from public.stages s
    join public.project_members pm on pm.project_id = s.project_id
    where pm.user_id = auth.uid()
  )
);
create policy "Participants add comments" on public.comments for insert with check (user_id = auth.uid());

-- BRIEFS
create policy "Designer sees project briefs" on public.briefs for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Client sees own brief" on public.briefs for select using (client_id = auth.uid());
create policy "Designer creates briefs" on public.briefs for insert with check (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Client updates own brief" on public.briefs for update using (client_id = auth.uid());

-- BRIEF_REFERENCES
create policy "Brief participants see refs" on public.brief_references for select using (
  brief_id in (select id from public.briefs where client_id = auth.uid())
  or brief_id in (
    select b.id from public.briefs b
    join public.projects p on p.id = b.project_id
    where p.designer_id = auth.uid()
  )
);
create policy "Participants add refs" on public.brief_references for insert with check (true);

-- ESTIMATES
create policy "Designer sees estimates" on public.estimates for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Designer manages estimates" on public.estimates for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);

-- ESTIMATE_ITEMS
create policy "Designer sees estimate items" on public.estimate_items for select using (
  estimate_id in (
    select e.id from public.estimates e
    join public.projects p on p.id = e.project_id
    where p.designer_id = auth.uid()
  )
);
create policy "Designer manages estimate items" on public.estimate_items for all using (
  estimate_id in (
    select e.id from public.estimates e
    join public.projects p on p.id = e.project_id
    where p.designer_id = auth.uid()
  )
);

-- PAYMENTS
create policy "Designer sees payments" on public.payments for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Client sees income payments" on public.payments for select using (
  type = 'income' and project_id in (select project_id from public.project_members where user_id = auth.uid() and role = 'client')
);
create policy "Designer manages payments" on public.payments for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);

-- DOCUMENTS
create policy "Designer sees documents" on public.documents for select using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);
create policy "Client sees documents" on public.documents for select using (
  project_id in (select project_id from public.project_members where user_id = auth.uid())
);
create policy "Designer manages documents" on public.documents for all using (
  project_id in (select id from public.projects where designer_id = auth.uid())
);

-- REVIEWS
create policy "Anyone sees reviews" on public.reviews for select using (true);
create policy "Client creates review" on public.reviews for insert with check (client_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
create index if not exists idx_projects_designer on public.projects(designer_id);
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_stages_project on public.stages(project_id);
create index if not exists idx_messages_project on public.messages(project_id);
create index if not exists idx_payments_project on public.payments(project_id);
create index if not exists idx_users_role on public.users(role);
