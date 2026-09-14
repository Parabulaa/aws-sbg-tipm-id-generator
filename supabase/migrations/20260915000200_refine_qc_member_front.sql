-- Keep already-migrated projects aligned with the final empty QC front artwork.
update public.templates
set layout = $json${
  "photo":{"x":329,"y":447,"width":538,"height":538,"borderRadius":48},
  "fields":[
    {"field":"name","x":105,"y":1050,"width":990,"height":120,"fontSize":68,"minFontSize":38,"color":"#663030","align":"center","weight":"bold","fontFamily":"montserrat"},
    {"field":"role","x":80,"y":1248,"width":1040,"height":90,"fontSize":70,"minFontSize":48,"color":"#ffffff","align":"center","weight":"bold","fontFamily":"montserrat"},
    {"field":"aws_sbg_id","prefix":"ID NO. ","x":120,"y":1375,"width":960,"height":80,"fontSize":48,"minFontSize":32,"color":"#663030","align":"center","weight":"bold","fontFamily":"montserrat"},
    {"field":"email","x":130,"y":1464,"width":940,"height":68,"fontSize":39,"minFontSize":26,"color":"#8f431d","align":"center","weight":"bold","fontFamily":"montserrat"}
  ],
  "accents":[]
}$json$::jsonb,
version = gen_random_uuid(),
updated_at = now()
where category = 'Member'
  and side = 'front'
  and team = ''
  and campus = 'Quezon City';
