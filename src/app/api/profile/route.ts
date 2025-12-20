import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Profile } from '@/lib/types';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    // Check if it's a table not found error - handle gracefully
    const isTableNotFound = 
      error.message?.includes('schema cache') || 
      error.message?.includes('does not exist') ||
      error.code === '42P01';
    
    if (isTableNotFound) {
      // Return null profile if table doesn't exist yet
      return NextResponse.json({ 
        profile: null,
        error: 'Database tables not initialized. Please run the migration SQL in Supabase.' 
      }, { status: 200 });
    }
    
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, bio, skills, user_type } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileCheckError) {
    // Check if it's a table not found error
    const isTableNotFound = 
      profileCheckError.message?.includes('schema cache') || 
      profileCheckError.message?.includes('does not exist') ||
      profileCheckError.code === '42P01';
    
    if (isTableNotFound) {
      return NextResponse.json({ 
        error: 'Database tables not initialized. Please run the migration SQL in Supabase: supabase-migration.sql' 
      }, { status: 500 });
    }
    
    console.error('Error checking existing profile:', profileCheckError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!user_type || !['SkillSeeker', 'SkillHolder', 'Both'].includes(user_type)) {
    return NextResponse.json({ error: 'Valid user_type is required (SkillSeeker, SkillHolder, or Both)' }, { status: 400 });
  }

  const updateData: Partial<Profile> = {
    name: name.trim(),
    bio: bio ? bio.trim() : null,
    skills: skills ? skills.trim() : null,
    user_type: user_type as 'SkillSeeker' | 'SkillHolder' | 'Both',
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existingProfile) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json({ profile: result }, { status: existingProfile ? 200 : 201 });
}

