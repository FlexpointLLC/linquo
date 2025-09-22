import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, orgId } = await request.json();

    if (!name || !email || !password || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create user account using signUp (this will auto-login the new user)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create account: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    // Sign out the newly created user to prevent session issues
    await supabase.auth.signOut();

    // Create agent record using the anon key (this should work with RLS)
    const { error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: authData.user.id,
        display_name: name,
        email: email,
        org_id: orgId,
        online_status: 'OFFLINE',
        is_active: true,
        role: role || 'AGENT'
      });

    if (agentError) {
      return NextResponse.json(
        { error: `Failed to create agent: ${agentError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
