import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getLocalSession } from '../services/api';

export const ProtectedRoute: React.FC = () => {
  const session = getLocalSession();

  if (!session.accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
