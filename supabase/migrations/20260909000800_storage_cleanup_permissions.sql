create policy storage_template_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'id-templates' and public.is_admin());

create policy storage_generated_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'generated-ids' and public.is_active_officer()
  and owner_id = (select auth.uid()::text)
);
