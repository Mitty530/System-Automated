import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  File,
  Image,
  FileSpreadsheet,
  FileText as FilePdf,
  Calendar,
  User,
  Search,
  Filter,
  Plus,
  Paperclip,
  Shield,
  Clock
} from 'lucide-react';
import { RequestDocument } from '../types/withdrawalTypes';
import { useAuth } from '../contexts/AuthContext';

interface EnhancedDocumentsSectionProps {
  requestId: string;
  documents: RequestDocument[];
  onDocumentUploaded?: () => void;
}

const EnhancedDocumentsSection: React.FC<EnhancedDocumentsSectionProps> = ({
  requestId,
  documents,
  onDocumentUploaded
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Document type configurations
  const documentTypes = {
    agreement: { label: 'Agreement', icon: FileText, color: 'blue', bgColor: 'bg-blue-500' },
    invoice: { label: 'Invoice', icon: FileSpreadsheet, color: 'green', bgColor: 'bg-green-500' },
    receipt: { label: 'Receipt', icon: File, color: 'purple', bgColor: 'bg-purple-500' },
    bank_statement: { label: 'Bank Statement', icon: FilePdf, color: 'orange', bgColor: 'bg-orange-500' },
    other: { label: 'Other', icon: FileText, color: 'gray', bgColor: 'bg-gray-500' }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return Image;
    if (fileType.includes('pdf')) return FilePdf;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual file upload logic
      console.log('Uploading files:', files);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      onDocumentUploaded?.();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const canUploadDocuments = user && (
    user.can_create_requests || 
    user.can_approve_reject || 
    user.can_disburse
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 text-white shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <FileText className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
              Documents & Attachments
            </h3>
            <p className="text-sm text-gray-600 font-medium">{filteredDocuments.length} documents</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </motion.div>

          {/* Filter */}
          <motion.select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <option value="all">All Types</option>
            {Object.entries(documentTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.label}</option>
            ))}
          </motion.select>

          {/* Upload Button */}
          {canUploadDocuments && (
            <motion.label
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl font-bold cursor-pointer hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              {isUploading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </motion.label>
          )}
        </div>
      </motion.div>

      {/* Documents Grid - Horizontal Layout */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredDocuments.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border-2 border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-500 mb-3">No Documents Found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload documents to get started'
                }
              </p>
              {canUploadDocuments && !searchTerm && filterType === 'all' && (
                <motion.label
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl font-bold cursor-pointer hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Upload First Document</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </motion.label>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDocuments.map((document, index) => {
                const docType = documentTypes[document.documentType] || documentTypes.other;
                const FileIcon = getFileIcon(document.fileType);
                const TypeIcon = docType.icon;

                return (
                  <motion.div
                    key={document.id}
                    className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    {/* Document Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {/* File Type Icon */}
                        <div className={`p-3 rounded-2xl ${docType.bgColor} text-white shadow-lg`}>
                          <FileIcon className="w-6 h-6" />
                        </div>

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-lg">{document.fileName}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              docType.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              docType.color === 'green' ? 'bg-green-100 text-green-800' :
                              docType.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              docType.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              <TypeIcon className="w-3 h-3" />
                              <span>{docType.label}</span>
                            </span>
                            <span className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="flex-shrink-0">
                        {document.isVerified ? (
                          <motion.div
                            className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending</span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Document Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Uploaded by</span>
                        </div>
                        <span className="font-medium text-gray-900">{document.uploaderName}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Upload date</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatDate(document.createdAt)}</span>
                      </div>

                      {document.isVerified && document.verifiedBy && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Verified by</span>
                          </div>
                          <span className="font-medium text-green-800">{document.verifiedBy}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <motion.button
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </motion.button>

                      <motion.button
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-800 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </motion.button>

                      {user?.can_approve_reject && (
                        <motion.button
                          className="p-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Documents Summary */}
      <motion.div
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-6 border-2 border-purple-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-3">
          <Paperclip className="w-5 h-5 text-purple-600" />
          <span>Document Summary</span>
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(documentTypes).map(([key, type]) => {
            const count = documents.filter(doc => doc.documentType === key).length;
            const IconComponent = type.icon;

            return (
              <motion.div
                key={key}
                className="text-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + Object.keys(documentTypes).indexOf(key) * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${type.bgColor} text-white flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">{type.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{documents.filter(d => d.isVerified).length}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">{documents.filter(d => !d.isVerified).length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Last upload</div>
              <div className="font-medium text-gray-900">
                {formatDate(documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedDocumentsSection;
