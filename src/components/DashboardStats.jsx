import React from 'react';
import { DollarSign, Clock, TrendingUp, AlertCircle, BarChart3, CheckCircle } from 'lucide-react';
import Card from './ui/Card';

// eslint-disable-next-line no-unused-vars
const StatsCard = ({ icon: Icon, label, value, color, desc, trend }) => (
  <Card 
    variant="stats"
    className="p-6 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{desc}</p>
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${trend.positive ? '' : 'rotate-180'}`} />
            {trend.value}
          </div>
        )}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: '85%' }}></div>
    </div>
  </Card>
);

const DashboardStats = ({ requests }) => {
  const calculateStats = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(req => req.currentStage !== 'disbursed').length;
    const completedRequests = requests.filter(req => req.currentStage === 'disbursed').length;
    const urgentRequests = requests.filter(req => req.priority === 'urgent').length;
    
    const totalValue = requests.reduce((sum, req) => sum + req.amount, 0);
    const avgProcessingTime = totalRequests > 0 
      ? Math.round(requests.reduce((sum, req) => sum + req.processingDays, 0) / totalRequests)
      : 0;
    
    // Calculate due soon (within 3 days)
    const dueSoon = requests.filter(req => {
      const valueDate = new Date(req.valueDate);
      const today = new Date();
      const diffDays = Math.ceil((valueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && req.currentStage !== 'disbursed';
    }).length;

    return {
      totalRequests,
      pendingRequests,
      completedRequests,
      urgentRequests,
      totalValue,
      avgProcessingTime,
      dueSoon
    };
  };

  const stats = calculateStats();

  const statsConfig = [
    { 
      icon: BarChart3, 
      label: 'Total Requests', 
      value: stats.totalRequests, 
      color: 'from-blue-500 to-blue-600', 
      desc: 'All time',
      trend: { positive: true, value: '+12% from last month' }
    },
    { 
      icon: Clock, 
      label: 'Pending Review', 
      value: stats.pendingRequests, 
      color: 'from-amber-500 to-orange-500', 
      desc: 'Awaiting action',
      trend: { positive: false, value: '+5% from last week' }
    },
    { 
      icon: CheckCircle, 
      label: 'Completed', 
      value: stats.completedRequests, 
      color: 'from-emerald-500 to-green-600', 
      desc: 'Successfully processed',
      trend: { positive: true, value: '+8% completion rate' }
    },
    { 
      icon: AlertCircle, 
      label: 'Due Soon', 
      value: stats.dueSoon, 
      color: 'from-red-500 to-pink-500', 
      desc: 'Urgent attention',
      trend: { positive: false, value: '3 critical items' }
    },
    { 
      icon: DollarSign, 
      label: 'Total Value', 
      value: `$${(stats.totalValue / 1000000).toFixed(1)}M`, 
      color: 'from-purple-500 to-indigo-600', 
      desc: 'Portfolio value',
      trend: { positive: true, value: '+15% growth' }
    },
    { 
      icon: TrendingUp, 
      label: 'Avg Processing', 
      value: `${stats.avgProcessingTime} days`, 
      color: 'from-cyan-500 to-blue-500', 
      desc: 'Current efficiency',
      trend: { positive: true, value: '-2 days improved' }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsConfig.map((stat) => (
        <StatsCard 
          key={stat.label}
          {...stat}
        />
      ))}
    </div>
  );
};

export default DashboardStats;