import React from 'react';
import { Search } from 'lucide-react';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';

const FiltersSection = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  filterCountry, 
  setFilterCountry, 
  requests 
}) => {
  const countries = [...new Set(requests.map(r => r.country))];

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-3 bg-white/50 rounded-2xl px-4 py-3">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            variant="search"
            type="text"
            placeholder="Search by reference, beneficiary, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72"
          />
        </div>
        
        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="initial_review">Initial Review</option>
          <option value="technical_review">Technical Review</option>
          <option value="core_banking">Core Banking</option>
          <option value="disbursed">Disbursed</option>
        </Select>
        
        <Select 
          value={filterCountry} 
          onChange={(e) => setFilterCountry(e.target.value)}
        >
          <option value="all">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </Select>

        <div className="ml-auto bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Live Tracking Active</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FiltersSection;