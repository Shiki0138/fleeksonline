import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { watchedDuration } = body;

    if (typeof watchedDuration !== 'number' || watchedDuration < 0) {
      return NextResponse.json(
        { error: 'Invalid watch duration' },
        { status: 400 }
      );
    }

    // Get video details (if exists in database)
    const { data: video } = await supabase
      .from('videos')
      .select('duration, title')
      .eq('youtube_id', params.videoId)
      .single();

    // Insert viewing history
    const { data, error } = await supabase
      .from('video_access_logs')
      .insert({
        user_id: user.id,
        video_id: params.videoId,
        video_title: video?.title || 'Unknown Video',
        watch_duration: Math.floor(watchedDuration),
        total_duration: video?.duration || null,
        watch_percentage: video?.duration 
          ? Math.min(100, (watchedDuration / video.duration) * 100)
          : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving video history:', error);
      return NextResponse.json(
        { error: 'Failed to save viewing history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Viewing history updated successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in video history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get viewing history for this video
    const { data, error } = await supabase
      .from('video_access_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', params.videoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching video history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch viewing history' },
        { status: 500 }
      );
    }

    // Calculate total watch time
    const totalWatchTime = data?.reduce((sum, log) => sum + (log.watch_duration || 0), 0) || 0;
    const latestWatch = data?.[0];

    return NextResponse.json({
      success: true,
      data: {
        history: data || [],
        totalWatchTime,
        latestWatch,
        videoId: params.videoId,
      }
    });

  } catch (error) {
    console.error('Unexpected error in video history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}