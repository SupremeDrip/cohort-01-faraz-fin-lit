// Post comments modal component
// Displays and manages comments on social feed posts

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post, Comment, Profile } from '../lib/types';
import { getTimeAgo } from '../lib/marketUtils';
import { X, Send } from 'lucide-react';

interface PostCommentsProps {
  post: Post;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PostComments({ post, onClose, onUpdate }: PostCommentsProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<(Comment & { profile: Profile })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data as (Comment & { profile: Profile })[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: profile?.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      onUpdate();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {(post.profile as Profile)?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-semibold text-gray-900">
                {(post.profile as Profile)?.username}
              </span>
              <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">
                      {comment.profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {comment.profile.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{posting ? 'Posting...' : 'Post'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
