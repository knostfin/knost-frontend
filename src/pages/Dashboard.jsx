import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { verify, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // We intentionally exclude `user` from the dependency array below to avoid
  // an effect loop: `verify()` updates the context `user`, which would
  // retrigger this effect. `verify` is stable via `useCallback` and will
  // change when `accessToken` changes.
   
  useEffect(() => {
    async function load() {
      try {
        // verify() now returns the user object on success
        const verifiedUser = await verify();
        if (!verifiedUser) {
          await logout();
          navigate('/login');
        } else {
          setInfo(verifiedUser);
        }
      } catch {
        await logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }

    load();
    // We intentionally exclude `user` from deps to avoid loop: verify() sets user,
    // which would retrigger this effect. `verify` is stable via useCallback
    // and will change when `accessToken` changes.
  }, [logout, navigate, verify]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container-max">
        <div className="k-card p-6">
          <h2 className="text-2xl font-semibold">Welcome, {info?.firstname || 'User'}</h2>
          <p className="text-[var(--muted)] mt-2">
            This is your dashboard - build further components here
          </p>
        </div>
      </div>
    </div>
  );
}
