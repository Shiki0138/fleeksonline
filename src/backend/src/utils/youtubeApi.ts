import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// YouTube URLから動画IDを抽出
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/,
    /youtube\.com\/v\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // 既に動画IDの場合
  if (/^[\w-]{11}$/.test(url)) {
    return url;
  }

  return null;
};

// YouTube APIから動画情報を取得
export const getVideoInfo = async (videoId: string) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API キーが設定されていません');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('動画が見つかりません');
    }

    const video = response.data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    // ISO 8601形式の時間を秒数に変換
    const duration = parseDuration(contentDetails.duration);

    return {
      videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnailUrl: snippet.thumbnails.maxresdefault?.url ||
                   snippet.thumbnails.high?.url ||
                   snippet.thumbnails.medium?.url ||
                   snippet.thumbnails.default?.url,
      duration,
      publishedAt: snippet.publishedAt,
      channelTitle: snippet.channelTitle,
      categoryId: snippet.categoryId,
      tags: snippet.tags || [],
      viewCount: parseInt(statistics.viewCount || '0'),
      likeCount: parseInt(statistics.likeCount || '0'),
      commentCount: parseInt(statistics.commentCount || '0'),
    };
  } catch (error) {
    console.error('YouTube API エラー:', error);
    throw new Error('動画情報の取得に失敗しました');
  }
};

// ISO 8601形式の時間（PT4M13S）を秒数に変換
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
};

// YouTube動画のサムネイルURL生成
export const getYoutubeThumbnailUrl = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxresdefault' = 'maxresdefault'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

// 動画が存在するかチェック
export const checkVideoExists = async (videoId: string): Promise<boolean> => {
  try {
    await getVideoInfo(videoId);
    return true;
  } catch {
    return false;
  }
};

// プレイリストから動画一覧を取得
export const getPlaylistVideos = async (playlistId: string, maxResults: number = 50) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API キーが設定されていません');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId,
        maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    return response.data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('YouTube プレイリスト API エラー:', error);
    throw new Error('プレイリスト情報の取得に失敗しました');
  }
};

// チャンネル情報を取得
export const getChannelInfo = async (channelId: string) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API キーが設定されていません');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
      params: {
        part: 'snippet,statistics',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('チャンネルが見つかりません');
    }

    const channel = response.data.items[0];
    return {
      channelId,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails.medium?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      viewCount: parseInt(channel.statistics.viewCount || '0'),
    };
  } catch (error) {
    console.error('YouTube チャンネル API エラー:', error);
    throw new Error('チャンネル情報の取得に失敗しました');
  }
};