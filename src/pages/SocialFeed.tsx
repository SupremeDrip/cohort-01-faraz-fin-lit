// Social feed page for community interaction
// Allows students to share thoughts, like, and comment on posts

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Post, Profile } from '../lib/types';
import { getTimeAgo } from '../lib/marketUtils';
import { Heart, MessageCircle, Send, Users } from 'lucide-react';
import PostComments from '../components/PostComments';

export default function SocialFeed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { data: userLike } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', profile?.id)
            .maybeSingle();

          return {
            ...post,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
            user_has_liked: !!userLike,
          };
        })
      );

      setPosts(postsWithCounts as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: profile?.id,
        content: newPostContent,
      });

      if (error) throw error;

      setNewPostContent('');
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: number, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile?.id);
      } else {
        await supabase.from('likes').insert({
          post_id: postId,
          user_id: profile?.id,
        });
      }

      await fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Feed</h1>
          <p className="text-gray-600">Connect with other traders and share insights</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your trading thoughts..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={posting || !newPostContent.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{posting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
              <p className="text-gray-600">Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">
                      {(post.profile as Profile)?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {(post.profile as Profile)?.username}
                      </span>
                      <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleLike(post.id, post.user_has_liked || false)}
                    className={`flex items-center space-x-2 transition ${
                      post.user_has_liked
                        ? 'text-red-600'
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`}
                    />
                    <span className="font-medium">{post.like_count || 0}</span>
                  </button>

                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comment_count || 0}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPost && (
        <PostComments
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={fetchPosts}
        />
      )}
    </div>
  );
}
