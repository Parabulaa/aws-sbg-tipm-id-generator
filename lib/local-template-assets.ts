const localTemplateAssets: Readonly<Record<string, string>> = {
  'id-templates/officer/front/32e43864-2b30-45f2-ac0e-265e9dee7304.png': '/assets/id/officer/executive/front.png',
  'id-templates/officer/front/c06b6676-fa5d-4bd3-8212-78fccf269836.png': '/assets/id/officer/operations/front.png',
  'id-templates/member/front/e9c5d981-2b66-4df4-9a9a-76cbfad591bb.png': '/assets/id/member/front.png',
  'id-templates/officer/back/58f173ee-e713-46ec-b402-232a6b513864.png': '/assets/id/officer/executive/back.png',
  'id-templates/member/back/6948995e-4066-4d15-a2cc-808ab93984ae.png': '/assets/id/member/back.png',
  'id-templates/officer/back/e468da3e-51d6-4691-8728-64a8b18e97ce.png': '/assets/id/officer/operations/back.png',
  'id-templates/officer/front/84a78edf-8529-400a-a7ee-e66d3dc0f2c9.png': '/assets/id/officer/buildhers/front.png',
  'id-templates/officer/back/0bda232e-1331-4a01-ad01-868bf064a200.png': '/assets/id/officer/buildhers/back.png',
  'id-templates/officer/front/1908266f-fa22-49a4-a03b-1ee481040228.png': '/assets/id/officer/relations/front.png',
};

export function localTemplateAsset(storagePath: string) {
  return localTemplateAssets[storagePath] ?? storagePath;
}
