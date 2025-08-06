import React from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

const ProcessTracking = ({ requests }) => {
  const stages = [
    { 
      stage: 'initial_review', 
      name: 'Initial Review', 
      count: requests.filter(r => r.currentStage === 'initial_review').length, 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      icon: Clock
    },
    { 
      stage: 'technical_review', 
      name: 'Technical Review', 
      count: requests.filter(r => r.currentStage === 'technical_review').length, 
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      icon: AlertTriangle
    },
    { 
      stage: 'core_banking', 
      name: 'Core Banking', 
      count: requests.filter(r => r.currentStage === 'core_banking').length, 
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      icon: Activity
    },
    { 
      stage: 'disbursed', 
      name: 'Disbursed', 
      count: requests.filter(r => r.currentStage === 'disbursed').length, 
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      icon: CheckCircle
    }
  ];

  const totalRequests = requests.length;
  const getPercentage = (count) => totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-500" />
            Live Process Tracking
          </h2>
          <p className="text-gray-600 text-sm mt-1">Real-time workflow status across all stages</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-800">Live</span>
        </div>
      </div>

      {/* Process Flow Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const percentage = getPercentage(stage.count);
          
          return (
            <div key={stage.stage} className="relative">
              <div className="text-center">
                <div className={`w-20 h-20 bg-gradient-to-r ${stage.color} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white block">{stage.count}</span>
                    <Icon className="w-4 h-4 text-white/80 mx-auto" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{stage.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Active requests</p>
                <Badge variant="default" className={`${stage.bgColor} ${stage.textColor} border-0`}>
                  {percentage}% of total
                </Badge>
              </div>
              
              {/* Arrow connector */}
              {index < stages.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 z-10">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{getPercentage(stages[3].count)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getPercentage(stages[3].count)}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalRequests}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stages[0].count + stages[1].count}</div>
          <div className="text-sm text-gray-600">In Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stages[2].count}</div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stages[3].count}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>
    </Card>
  );
};

export default ProcessTracking;