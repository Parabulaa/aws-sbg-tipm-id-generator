alter table public.members add constraint members_officer_position_allowed check (
  officer_position is null or officer_position in (
    'LORSO REPRESENTATIVE',
    'CHIEF EXECUTIVE OFFICER/LEAD',
    'EXECUTIVE SECRETARY',
    'ASSOCIATE SECRETARY',
    'BUILDHERS+ AMBASSADOR',
    'CHIEF FINANCIAL OFFICER',
    'VICE-CHIEF FINANCIAL OFFICER',
    'CHIEF OPERATIONS OFFICER',
    'VICE-CHIEF OPERATIONS OFFICER',
    'CHIEF MARKETING OFFICER',
    'VICE-CHIEF MARKETING OFFICER',
    'CHIEF RELATIONS OFFICER',
    'VICE-CHIEF RELATIONS OFFICER',
    'CHIEF CREATIVES OFFICER',
    'VICE-CHIEF CREATIVES OFFICER',
    'CHIEF TECHNOLOGY OFFICER',
    'VICE-CHIEF TECHNOLOGY OFFICER',
    'AI/ML LEAD',
    'SOFTWARE ENGINEERING LEAD'
  )
);

comment on constraint members_officer_position_allowed on public.members
is 'Officer positions are controlled organization values, never free text.';
