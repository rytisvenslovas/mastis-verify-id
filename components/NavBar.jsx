'use client';

import React from 'react';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { useUser } from '@auth0/nextjs-auth0';

import AnchorLink from './AnchorLink';

const NavBar = () => {
  const { user, isLoading } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" data-testid="navbar">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo or empty space */}
          <div className="flex-1"></div>
          
          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {!isLoading && !user && (
              <a
                href="/auth/login"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                data-testid="navbar-login-desktop"
              >
                Log in
              </a>
            )}
            
            {user && (
              <UncontrolledDropdown data-testid="navbar-menu-desktop">
                <DropdownToggle 
                  tag="button"
                  className="flex items-center gap-3 bg-transparent border-none p-0 hover:opacity-80 transition-opacity cursor-pointer"
                  id="profileDropDown"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                    data-testid="navbar-picture-desktop"
                  />
                </DropdownToggle>
                <DropdownMenu right className="mt-2 shadow-lg border border-gray-200">
                  <DropdownItem header className="px-4 py-2 text-sm font-semibold text-gray-700 border-b" data-testid="navbar-user-desktop">
                    {user.name}
                  </DropdownItem>
                  <DropdownItem className="hover:bg-gray-50">
                    <AnchorLink
                      href="/auth/logout"
                      testId="navbar-logout-desktop"
                      className="text-gray-700 hover:text-red-600 flex items-center gap-2"
                    >
                      <span>🚪</span> Log out
                    </AnchorLink>
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;