'use client';

import './globals.css';
import NavBar from '../components/NavBar';
import { Container } from 'reactstrap';
import React, {useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { Auth0Provider, useUser } from '@auth0/nextjs-auth0';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const isVerifyPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/verify');
  
  useEffect(() => {
    if (isVerifyPage) {
      return;
    }
    
    if (!isLoading && user) {
      router.push('/admin/document-collection');
    }
  }, [user, isLoading, router, isVerifyPage]);
  
  if (isVerifyPage) {
    return (
      <html lang="en">
        <head>
          <link
            rel="stylesheet"
            href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
            integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          {children}
        </body>
      </html>
    );
  }
  
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://cdn.auth0.com/js/auth0-samples-theme/1.0/css/auth0-theme.min.css" />
      </head>
      <body>
        <Auth0Provider>
        <Toaster position="top-right" />
          <main id="app" className="d-flex flex-column h-100" data-testid="layout">
            <NavBar />
            <Container className="flex-grow-1 mt-5">{children}</Container>
          </main>
        </Auth0Provider>
      </body>
    </html>
  );
}
