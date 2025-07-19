// src/routes/PrivateRoute.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { accessToken, user } = useSelector((state) => state.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.statut_validation === 'validee') {
    return children;
  }

  if (user.statut_validation === 'en_attente') {
    return <Navigate to="/en_attente" replace />;
  }

  return <Navigate to="/rejetee" replace />;
};

export default PrivateRoute;
