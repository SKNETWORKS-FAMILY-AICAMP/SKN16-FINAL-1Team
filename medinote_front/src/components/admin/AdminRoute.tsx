// src/components/admin/AdminRoute.tsx

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import { toast } from 'react-toastify';

export default function AdminRoute() {
  const { role } = useUserStore();

  if (role !== 'admin') {
    toast.error("접근 권한이 없습니다.");
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}