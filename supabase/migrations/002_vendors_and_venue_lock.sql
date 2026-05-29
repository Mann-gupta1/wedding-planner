-- Vendor suggestions per category + venue selection locks budget

alter table intakes
  add column if not exists budget_locked boolean not null default false,
  add column if not exists selected_venue_vendor_id uuid,
  add column if not exists selected_venue_price_inr int check (selected_venue_price_inr is null or selected_venue_price_inr > 0);

create table if not exists vendor_suggestions (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references intakes(id) on delete cascade,
  recommendation_id uuid references recommendations(id) on delete cascade,
  vendor_category text not null,
  vendor_name text not null,
  quoted_price_inr int not null check (quoted_price_inr > 0),
  highlight text,
  created_at timestamptz default now()
);

create index if not exists vendor_suggestions_intake_id_idx on vendor_suggestions(intake_id);
create index if not exists vendor_suggestions_category_idx on vendor_suggestions(intake_id, vendor_category);

alter table intakes
  drop constraint if exists intakes_selected_venue_vendor_id_fkey;

alter table intakes
  add constraint intakes_selected_venue_vendor_id_fkey
  foreign key (selected_venue_vendor_id) references vendor_suggestions(id) on delete set null;
