import { useEffect, useState, useRef } from 'react';  // Add useRef
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import Logo from '../../assets/images/logo.png';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerifiedRef = useRef(false);  // Add this ref to prevent multiple calls

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerifiedRef.current) return;  // Prevent multiple calls
      hasVerifiedRef.current = true;

      const uid = searchParams.get('uid');
      const token = searchParams.get('token');

      if (!uid || !token) {
        setStatus('error');
        setMessage('Invalid verification link. Missing uid or token.');
        return;
      }

      try {
        // Use the Vite proxy instead of direct URL
        const response = await fetch(`/api/auth/verify-email/?uid=${uid}&token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          setStatus('success');
          setMessage(data.detail || 'Email verified successfully!');
          // Redirect to login after a short delay
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.detail || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (error) {
        console.error('Network error:', error);
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#311D3F] to-[#88304E] text-white font-poppins overflow-x-hidden flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <img src={Logo} alt="HarmonyDB Logo" className="h-16 w-auto mx-auto" />
        </motion.div>

        {/* Status Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader size={48} className="animate-spin text-[#E23E57]" />
              <h2 className="text-2xl font-bold">Verifying Email...</h2>
              <p className="text-gray-300">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle size={48} className="text-primary" />
              <h2 className="text-2xl font-bold text-primary">Email Verified!</h2>
              <p className="text-gray-300">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to login in a few seconds...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle size={48} className="text-red-500" />
              <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
              <p className="text-gray-300">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-gradient-to-r from-[#E23E57] to-[#88304E] px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Go to Login
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;