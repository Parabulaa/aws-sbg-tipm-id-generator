alter table public.generated_ids
  alter column back_path drop not null,
  alter column pdf_path drop not null;

comment on column public.generated_ids.back_path is
  'Private generated back-side file; null for front-only generations.';
comment on column public.generated_ids.pdf_path is
  'Private generated PDF file; null for front-only generations.';
