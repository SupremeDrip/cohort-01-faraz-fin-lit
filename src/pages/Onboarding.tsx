// Onboarding page for role selection and setup
// Allows users to choose between student or parent role and complete profile setup

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, GraduationCap, Copy, Check } from 'lucide-react';

function generateParentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Onboarding() {
  const [step, setStep] = useState<'role' | 'username' | 'parent-code' | 'student-success'>('role');
  const [role, setRole] = useState<'student' | 'parent' | null>(null);
  const [username, setUsername] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole: 'student' | 'parent') => {
    setRole(selectedRole);
    setStep('username');
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        setError('Username already taken');
        setLoading(false);
        return;
      }

      if (role === 'student') {
        let code = generateParentCode();
        let isUnique = false;

        while (!isUnique) {
          const { data } = await supabase
            .from('profiles')
            .select('parent_code')
            .eq('parent_code', code)
            .maybeSingle();

          if (!data) {
            isUnique = true;
          } else {
            code = generateParentCode();
          }
        }

        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          username,
          role: 'student',
          parent_code: code,
          virtual_cash: 100000.0,
        });

        if (insertError) throw insertError;

        setGeneratedCode(code);
        await refreshProfile();
        setStep('student-success');
      } else {
        setStep('parent-code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleParentCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('parent_code', parentCode)
        .eq('role', 'student')
        .maybeSingle();

      if (studentError) throw studentError;

      if (!student) {
        setError('Invalid parent code');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username,
        role: 'parent',
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ linked_parent_id: user.id })
        .eq('id', student.id);

      if (updateError) throw updateError;

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to link account');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose Your Role</h2>
          <p className="text-gray-600 mb-8 text-center">Select how you'll be using FinSim</p>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleRoleSelect('student')}
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition group"
            >
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-blue-600 group-hover:scale-110 transition" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Student</h3>
              <p className="text-gray-600 text-sm">
                Learn stock trading with virtual money and track your portfolio
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('parent')}
              className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition group"
            >
              <Users className="w-16 h-16 mx-auto mb-4 text-blue-600 group-hover:scale-110 transition" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Parent</h3>
              <p className="text-gray-600 text-sm">
                Monitor your child's trading activity and portfolio performance
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'username') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choose Username</h2>
          <p className="text-gray-600 mb-6 text-center">This will be your display name</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9_]+"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter username"
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'parent-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Link to Your Child</h2>
          <p className="text-gray-600 mb-6 text-center">Enter your child's parent code</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleParentCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="parentCode" className="block text-sm font-medium text-gray-700 mb-1">
                Parent Code
              </label>
              <input
                id="parentCode"
                type="text"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase text-center text-2xl font-mono tracking-wider"
                placeholder="XXXX1234"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Linking Account...' : 'Link Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'student-success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600">Share this code with your parent to link accounts</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-700 mb-2 text-center font-medium">Your Parent Code</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {generatedCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-blue-100 rounded-lg transition"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
