-- Wedding planning app: intakes, recommendations, payments

create table intakes (
  id uuid primary key default gen_random_uuid(),
  wedding_date date not null,
  guest_count int not null check (guest_count > 0),
  city text not null,
  venue_type text not null,
  budget_bracket text not null,
  budget_inr int not null,
  priorities text[] not null check (array_length(priorities, 1) = 2),
  created_at timestamptz default now()
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references intakes(id) on delete cascade,
  vendor_category text not null,
  priority_rank int not null check (priority_rank between 1 and 10),
  suggested_budget_inr int not null check (suggested_budget_inr >= 0),
  rationale text not null,
  created_at timestamptz default now()
);

create index recommendations_intake_id_idx on recommendations(intake_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references intakes(id) on delete cascade,
  vendor_category text not null,
  vendor_name text not null,
  amount_inr int not null check (amount_inr > 0),
  paid_on date not null,
  created_at timestamptz default now()
);

create index payments_intake_id_idx on payments(intake_id);
