// src/components/common/ProtectedRoute.tsx

import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';

export default function ProtectedRoute() {
  const { isLoggedIn } = useUserStore();
  const location = useLocation();
  const publicRoutes = ['/', '/login', '/signup'];

  if (!isLoggedIn && !publicRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}