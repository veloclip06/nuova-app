-- Plan values ratified 2026-07-10: free | essenziale | completo (annual billing only).
-- Defensive remap: the 0001 inline comment advertised 'starter | pro' but no code
-- ever wrote those values; remap just in case before adding the constraint.
update companies set plan = 'essenziale' where plan = 'starter';
update companies set plan = 'completo'   where plan = 'pro';

alter table companies
  add constraint companies_plan_check
  check (plan in ('free', 'essenziale', 'completo'));

comment on column companies.plan is 'free | essenziale | completo (annual)';
