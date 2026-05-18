export async function POST() {
  return Response.json({
    success: false,
    message:
      'La migration automatique n\'est pas disponible via cette route. Veuillez exécuter le fichier supabase/schema.sql directement dans le SQL Editor de votre projet Supabase (https://supabase.com/dashboard → SQL Editor).',
    schemaPath: 'supabase/schema.sql',
  }, { status: 200 });
}
