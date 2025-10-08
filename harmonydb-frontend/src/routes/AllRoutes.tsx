import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Landingpage from '../pages/Intro/Landingpage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Home from '../pages/home/Home';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ProtectedRoute from './ProtectedRoutes';




const router = createBrowserRouter([
  {
    path: '/',
    element: <Landingpage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  }
]);

const AllRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AllRoutes;