-- Research Agent Runtime — initial schema
-- Apply against your Supabase project (SQL editor or `supabase db push`) before
-- running with STORAGE_DRIVER=supabase. The server uses the service-role key,
-- which bypasses RLS; RLS is enabled with no public policies so the anon key
-- cannot read or write these tables.

create table if not exists research_tasks (
  id            text primary key,
  title         text not null,
  question      text not null,
  context       text,
  output_format text not null,
  depth         text not null,
  created_at    timestamptz not null default now()
);

create table if not exists agent_runs (
  id             text primary key,
  task_id        text not null references research_tasks (id) on delete cascade,
  status         text not null,
  model          text not null,
  created_at     timestamptz not null default now(),
  started_at     timestamptz,
  completed_at   timestamptz,
  estimated_cost double precision not null default 0,
  token_usage    integer not null default 0,
  retry_count    integer not null default 0,
  error          text,
  report         jsonb
);

create table if not exists agent_steps (
  id           text primary key,
  run_id       text not null references agent_runs (id) on delete cascade,
  "order"      integer not null,
  name         text not null,
  description  text not null,
  kind         text not null,
  status       text not null,
  started_at   timestamptz,
  completed_at timestamptz,
  output       text,
  error        text,
  retry_count  integer not null default 0,
  token_usage  integer not null default 0,
  cost_usd     double precision not null default 0
);

create table if not exists agent_logs (
  id         text primary key,
  run_id     text not null references agent_runs (id) on delete cascade,
  step_id    text,
  level      text not null,
  message    text not null,
  timestamp  timestamptz not null default now(),
  metadata   jsonb
);

create table if not exists review_decisions (
  id         text primary key,
  run_id     text not null references agent_runs (id) on delete cascade,
  decision   text not null,
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_created_at on agent_runs (created_at desc);
create index if not exists idx_agent_steps_run_id on agent_steps (run_id, "order");
create index if not exists idx_agent_logs_run_id on agent_logs (run_id, timestamp);
create index if not exists idx_review_decisions_run_id on review_decisions (run_id);

-- Lock down anon/public access; the server's service-role key bypasses RLS.
alter table research_tasks   enable row level security;
alter table agent_runs       enable row level security;
alter table agent_steps      enable row level security;
alter table agent_logs       enable row level security;
alter table review_decisions enable row level security;
