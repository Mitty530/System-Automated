import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AtSign, Mail, Shield } from 'lucide-react';
import { UserMention } from '../types/withdrawalTypes';
import { commentService } from '../services/commentService';

interface UserTaggingProps {
  onUserSelect: (user: UserMention) => void;
  onClose: () => void;
  searchTerm?: string;
}

const UserTagging: React.FC<UserTaggingProps> = ({
  onUserSelect,
  onClose,
  searchTerm = ''
}) => {
  const [availableUsers, setAvailableUsers] = useState<UserMention[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserMention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load available users
    const users = commentService.getAvailableUsersForMentions();
    setAvailableUsers(users);
    setFilteredUsers(users);
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim()) {
      const filtered = availableUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers);
    }
    setSelectedIndex(0);
  }, [searchTerm, availableUsers]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onUserSelect(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onUserSelect, onClose]);

  useEffect(() => {
    // Handle clicks outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'archive_team':
        return 'bg-blue-100 text-blue-800';
      case 'operations_team':
        return 'bg-green-100 text-green-800';
      case 'core_banking':
        return 'bg-orange-100 text-orange-800';
      case 'loan_administrator':
        return 'bg-gray-100 text-gray-800';
      case 'observer':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'archive_team':
        return 'Archive';
      case 'operations_team':
        return 'Operations';
      case 'core_banking':
        return 'Banking';
      case 'loan_administrator':
        return 'Loan Admin';
      case 'observer':
        return 'Observer';
      default:
        return role;
    }
  };

  if (filteredUsers.length === 0) {
    return (
      <motion.div
        ref={dropdownRef}
        className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="text-center text-gray-500">
          <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No users found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-w-sm max-h-64 overflow-y-auto backdrop-blur-sm"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
            <div className="p-1 rounded-lg bg-blue-100">
              <AtSign className="w-4 h-4 text-blue-600" />
            </div>
            <span>Mention team member</span>
          </div>
        </div>

        {/* User List */}
        <div className="py-2">
          {filteredUsers.map((user, index) => (
            <motion.button
              key={user.id}
              onClick={() => onUserSelect(user)}
              className={`w-full px-5 py-4 text-left transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 shadow-sm'
                  : 'hover:bg-gray-50'
              }`}
              whileHover={{ backgroundColor: '#F9FAFB', x: 4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                    {user.avatar || <User className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {!user.isActive && (
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Inactive
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>↑↓ Navigate • Enter Select • Esc Close</span>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>ADFD Team</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserTagging;
