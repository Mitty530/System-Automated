import React from 'react';
import { CheckCircle, Clock, AlertCircle, Pause, XCircle } from 'lucide-react';

const StatusIcon = ({ stage }) => {
  const icons = {
    disbursed: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    approved: <Clock className="w-5 h-5 text-blue-500" />,
    under_operations_review: <AlertCircle className="w-5 h-5 text-amber-500" />,
    under_loan_review: <Pause className="w-5 h-5 text-orange-500" />,
    returned_for_modification: <XCircle className="w-5 h-5 text-red-500" />,
    submitted: <Clock className="w-5 h-5 text-gray-500" />,
    default: <XCircle className="w-5 h-5 text-red-500" />
  };

  return icons[stage] || icons.default;
};

export default StatusIcon;