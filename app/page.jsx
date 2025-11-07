'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      // Check if on verify subdomain
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // If on verify subdomain, redirect to error page (root shouldn't be accessed)
        if (hostname.startsWith('verify.')) {
          router.push('/verify/invalid-link');
          return;
        }
      }

      // For admin subdomain or main domain
      if (user) {
        router.push('/admin/document-collection');
      } else {
        router.push('/admin');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );
}
