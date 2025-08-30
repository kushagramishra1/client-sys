import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Load Chart.js when dashboard is loaded
    if (user?.role === 'admin') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        // Chart will be initialized in AdminDashboard component
        setTimeout(initializeChart, 100);
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [user]);

  const initializeChart = () => {
    const canvas = document.getElementById('projectChart') as HTMLCanvasElement;
    if (!canvas || !window.Chart) return;

    // Sample data - in real app this would come from API
    const ctx = canvas.getContext('2d');
    new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Active', 'Completed', 'Paused'],
        datasets: [{
          data: [45, 30, 25],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;