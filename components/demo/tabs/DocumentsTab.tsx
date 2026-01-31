'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { DOCUMENT_TEMPLATES } from '@/lib/demo-data';
import { useAuth } from '@/contexts/AuthContext';

interface UserDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export function DocumentsTab() {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState<'templates' | 'my-documents'>('templates');
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка документов пользователя
  const fetchDocuments = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'my-documents') {
      fetchDocuments();
    }
  }, [activeSection, token]);

  // Скачивание шаблона
  const handleDownloadTemplate = async (templateId: number) => {
    setDownloadingId(templateId);
    try {
      const response = await fetch(`/api/templates?id=${templateId}&download=true`);
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `template-${templateId}.docx`;

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
            fileName = decodeURIComponent(match[1]);
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.message || 'Файл не найден');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Ошибка при скачивании файла');
    } finally {
      setDownloadingId(null);
    }
  };

  // Загрузка файла пользователя
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Читаем файл как base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: file.name.replace(/\.[^/.]+$/, ''), // Имя без расширения
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            fileData: base64,
          }),
        });

        if (response.ok) {
          setShowUploadModal(false);
          await fetchDocuments();
        } else {
          const data = await response.json();
          alert(data.error || 'Ошибка загрузки файла');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
    }

    // Сбросить input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Скачивание документа пользователя
  const handleDownloadDocument = async (docId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const { document } = data;

        // Декодируем base64 и скачиваем
        const link = window.document.createElement('a');
        link.href = document.fileData;
        link.download = document.fileName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // Удаление документа
  const handleDeleteDocument = async (docId: string) => {
    if (!token || !confirm('Удалить этот документ?')) return;

    try {
      const response = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'ri-file-pdf-line';
    if (fileType.includes('word') || fileType.includes('document')) return 'ri-file-word-line';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'ri-file-excel-line';
    if (fileType.includes('image')) return 'ri-image-line';
    return 'ri-file-line';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 -mx-1 px-1 overflow-x-auto">
        <button
          onClick={() => setActiveSection('templates')}
          className={`pb-2 sm:pb-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeSection === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="ri-file-copy-line mr-1 sm:mr-2"></i>
          Шаблоны
        </button>
        <button
          onClick={() => setActiveSection('my-documents')}
          className={`pb-2 sm:pb-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeSection === 'my-documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <i className="ri-folder-user-line mr-1 sm:mr-2"></i>
          Мои документы
          {userDocuments.length > 0 && (
            <span className="ml-1 sm:ml-2 bg-blue-100 text-blue-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
              {userDocuments.length}
            </span>
          )}
        </button>
      </div>

      {/* Templates Section */}
      {activeSection === 'templates' && (
        <Card>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Шаблоны документов</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Готовые шаблоны для ведения бизнеса. Скачайте и заполните нужные поля.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DOCUMENT_TEMPLATES.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${doc.iconBg} rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
                  <i className={`${doc.icon} ${doc.iconColor} text-lg sm:text-xl`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{doc.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{doc.description}</p>
                <button
                  onClick={() => handleDownloadTemplate(doc.id)}
                  disabled={downloadingId === doc.id}
                  className="text-blue-600 text-xs sm:text-sm font-medium hover:text-blue-700 cursor-pointer flex items-center disabled:opacity-50"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-1 sm:mr-2"></i>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <i className="ri-download-line mr-1 sm:mr-2"></i>
                      Скачать шаблон
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My Documents Section */}
      {activeSection === 'my-documents' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Мои документы</h1>
              <p className="text-sm sm:text-base text-gray-600">Загружайте и храните свои документы</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary text-sm sm:text-base"
            >
              <i className="ri-upload-line mr-1 sm:mr-2"></i>
              Загрузить документ
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : userDocuments.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-folder-open-line text-2xl sm:text-3xl text-gray-400"></i>
              </div>
              <p className="font-medium mb-1 text-sm sm:text-base">Нет загруженных документов</p>
              <p className="text-xs sm:text-sm">Загрузите ваши документы для хранения</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {userDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition gap-2"
                >
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${getFileIcon(doc.fileType)} text-blue-600 text-base sm:text-lg`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownloadDocument(doc.id)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 transition"
                      title="Скачать"
                    >
                      <i className="ri-download-line text-base sm:text-lg"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 transition sm:opacity-0 sm:group-hover:opacity-100"
                      title="Удалить"
                    >
                      <i className="ri-delete-bin-line text-base sm:text-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Загрузить документ"
      >
        <div className="space-y-3 sm:space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-500 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            />
            {isUploading ? (
              <div>
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Загрузка файла...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <i className="ri-upload-cloud-line text-2xl sm:text-3xl text-blue-600"></i>
                </div>
                <p className="text-gray-900 font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                  Нажмите для выбора файла
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  PDF, Word, Excel, изображения (до 5 МБ)
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              onClick={() => setShowUploadModal(false)}
              className="btn btn-secondary flex-1 text-sm sm:text-base"
              disabled={isUploading}
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="legal" />}
    </div>
  );
}
