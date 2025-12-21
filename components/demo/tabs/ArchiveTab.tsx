'use client';

import { useState } from 'react';
import { Card, ProgressBar, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import type { Service, Equipment } from '@/hooks/useDemoStore';

type ArchiveSubTab = 'salary' | 'taxes' | 'services' | 'equipment' | 'other';

interface ArchiveTabProps {
  grantAmount: number;
  services: Service[];
  equipment: Equipment[];
  onAddService: (name: string, amount: number) => void;
  onDeleteService: (id: number) => void;
  onAddServiceDocument: (serviceId: number, docType: string) => void;
  onDeleteServiceDocument: (serviceId: number, docIndex: number) => void;
  onAddEquipment: (name: string, amount: number, date: string) => void;
  onDeleteEquipment: (id: number) => void;
  onAddEquipmentDocument: (equipmentId: number, docType: string) => void;
  onDeleteEquipmentDocument: (equipmentId: number, docIndex: number) => void;
}

const subTabs: { id: ArchiveSubTab; label: string }[] = [
  { id: 'salary', label: 'Заработная плата' },
  { id: 'taxes', label: 'Налоги и взносы' },
  { id: 'services', label: 'Услуги сторонних лиц' },
  { id: 'equipment', label: 'Оборудование' },
  { id: 'other', label: 'Прочие расходы' },
];

export function ArchiveTab({
  grantAmount,
  services,
  equipment,
  onAddService,
  onDeleteService,
  onAddServiceDocument,
  onDeleteServiceDocument,
  onAddEquipment,
  onDeleteEquipment,
  onAddEquipmentDocument,
  onDeleteEquipmentDocument,
}: ArchiveTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ArchiveSubTab>('salary');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [showAddServiceDocModal, setShowAddServiceDocModal] = useState(false);
  const [showAddEquipmentDocModal, setShowAddEquipmentDocModal] = useState(false);

  const totalServicesAmount = services.reduce((sum, s) => sum + s.amount, 0);
  const servicesPercentage = (totalServicesAmount / grantAmount) * 100;
  const totalEquipmentAmount = equipment.reduce((sum, e) => sum + e.amount, 0);

  const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddService(formData.get('serviceName') as string, Number(formData.get('amount')));
    setShowAddServiceModal(false);
  };

  const handleAddEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddEquipment(
      formData.get('equipmentName') as string,
      Number(formData.get('amount')),
      formData.get('date') as string
    );
    setShowAddEquipmentModal(false);
  };

  const handleAddServiceDoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedServiceId) {
      onAddServiceDocument(selectedServiceId, formData.get('docType') as string);
    }
    setShowAddServiceDocModal(false);
    setSelectedServiceId(null);
  };

  const handleAddEquipmentDoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedEquipmentId) {
      onAddEquipmentDocument(selectedEquipmentId, formData.get('docType') as string);
    }
    setShowAddEquipmentDocModal(false);
    setSelectedEquipmentId(null);
  };

  return (
    <Card>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Архив документов</h1>

      {/* Sub Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Salary Tab */}
      {activeSubTab === 'salary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Сотрудников</p>
              <p className="text-2xl font-bold text-blue-600">3</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Трудовых договоров</p>
              <p className="text-2xl font-bold text-green-600">3</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Приказов о приеме</p>
              <p className="text-2xl font-bold text-purple-600">3</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Прогресс документов</span>
              <span className="text-blue-600 font-medium">8/9</span>
            </div>
            <ProgressBar value={88} color="blue" />
          </div>
        </div>
      )}

      {/* Taxes Tab */}
      {activeSubTab === 'taxes' && (
        <div className="space-y-4">
          {['Январь', 'Февраль', 'Март'].map((month, i) => (
            <div key={month} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{month} 2024</h3>
                  <p className="text-sm text-gray-600">НДФЛ: 15 600 ₽ • Взносы: 18 200 ₽</p>
                </div>
                <Badge variant={i === 0 ? 'green' : i === 1 ? 'yellow' : 'gray'}>
                  {i === 0 ? 'Оплачено' : i === 1 ? 'Ожидает' : 'Не сформировано'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Services Tab */}
      {activeSubTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Потрачено на услуги сторонних лиц</p>
              <p className="text-2xl font-bold text-gray-900">{totalServicesAmount.toLocaleString()} ₽</p>
            </div>
            <button onClick={() => setShowAddServiceModal(true)} className="btn btn-primary">
              <i className="ri-add-line"></i>
              Добавить услугу
            </button>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Использовано от лимита (25%)</span>
              <span className={servicesPercentage > 20 ? 'text-orange-600' : 'text-green-600'}>
                {servicesPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={servicesPercentage} max={25} color={servicesPercentage > 20 ? 'orange' : 'green'} />
          </div>

          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-lg font-bold text-blue-600">{service.amount.toLocaleString()} ₽</p>
                  </div>
                  <button onClick={() => onDeleteService(service.id)} className="btn btn-danger p-1">
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.documents.map((doc, i) => (
                    <span key={i} className="badge badge-blue flex items-center gap-1">
                      {doc}
                      <button onClick={() => onDeleteServiceDocument(service.id, i)} className="hover:text-red-600">
                        <i className="ri-close-line text-xs"></i>
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => { setSelectedServiceId(service.id); setShowAddServiceDocModal(true); }}
                    className="badge badge-gray cursor-pointer hover:bg-gray-200"
                  >
                    <i className="ri-add-line"></i> Документ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeSubTab === 'equipment' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Затраты на оборудование</p>
              <p className="text-2xl font-bold text-gray-900">{totalEquipmentAmount.toLocaleString()} ₽</p>
            </div>
            <button onClick={() => setShowAddEquipmentModal(true)} className="btn btn-primary">
              <i className="ri-add-line"></i>
              Добавить оборудование
            </button>
          </div>

          <div className="space-y-4">
            {equipment.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Дата покупки: {item.date}</p>
                    <p className="text-lg font-bold text-blue-600">{item.amount.toLocaleString()} ₽</p>
                  </div>
                  <button onClick={() => onDeleteEquipment(item.id)} className="btn btn-danger p-1">
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.documents.map((doc, i) => (
                    <span key={i} className="badge badge-green flex items-center gap-1">
                      {doc}
                      <button onClick={() => onDeleteEquipmentDocument(item.id, i)} className="hover:text-red-600">
                        <i className="ri-close-line text-xs"></i>
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => { setSelectedEquipmentId(item.id); setShowAddEquipmentDocModal(true); }}
                    className="badge badge-gray cursor-pointer hover:bg-gray-200"
                  >
                    <i className="ri-add-line"></i> Документ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Tab */}
      {activeSubTab === 'other' && (
        <div className="text-center py-12 text-gray-500">
          <i className="ri-folder-line text-4xl mb-2"></i>
          <p>Раздел в разработке</p>
          <p className="text-sm">Здесь будут отображаться прочие расходы</p>
        </div>
      )}

      {/* Add Service Modal */}
      <Modal isOpen={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} title="Добавить услугу">
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название услуги</label>
            <input name="serviceName" type="text" required className="input" placeholder="Название" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽)</label>
            <input name="amount" type="number" required className="input" placeholder="0" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddServiceModal(false)} className="btn btn-secondary flex-1">Отмена</button>
            <button type="submit" className="btn btn-primary flex-1">Добавить</button>
          </div>
        </form>
      </Modal>

      {/* Add Equipment Modal */}
      <Modal isOpen={showAddEquipmentModal} onClose={() => setShowAddEquipmentModal(false)} title="Добавить оборудование">
        <form onSubmit={handleAddEquipment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input name="equipmentName" type="text" required className="input" placeholder="Название" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость (₽)</label>
            <input name="amount" type="number" required className="input" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата покупки</label>
            <input name="date" type="date" required className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddEquipmentModal(false)} className="btn btn-secondary flex-1">Отмена</button>
            <button type="submit" className="btn btn-primary flex-1">Добавить</button>
          </div>
        </form>
      </Modal>

      {/* Add Service Doc Modal */}
      <Modal isOpen={showAddServiceDocModal} onClose={() => { setShowAddServiceDocModal(false); setSelectedServiceId(null); }} title="Добавить документ">
        <form onSubmit={handleAddServiceDoc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип документа</label>
            <select name="docType" className="select" required>
              <option value="">Выберите тип</option>
              <option value="Договор">Договор</option>
              <option value="Счет">Счет</option>
              <option value="Акт">Акт</option>
              <option value="УПД">УПД</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowAddServiceDocModal(false); setSelectedServiceId(null); }} className="btn btn-secondary flex-1">Отмена</button>
            <button type="submit" className="btn btn-primary flex-1">Добавить</button>
          </div>
        </form>
      </Modal>

      {/* Add Equipment Doc Modal */}
      <Modal isOpen={showAddEquipmentDocModal} onClose={() => { setShowAddEquipmentDocModal(false); setSelectedEquipmentId(null); }} title="Добавить документ">
        <form onSubmit={handleAddEquipmentDoc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип документа</label>
            <select name="docType" className="select" required>
              <option value="">Выберите тип</option>
              <option value="Счет">Счет</option>
              <option value="Договор">Договор</option>
              <option value="Акт">Акт</option>
              <option value="УПД">УПД</option>
              <option value="Накладная">Накладная</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowAddEquipmentDocModal(false); setSelectedEquipmentId(null); }} className="btn btn-secondary flex-1">Отмена</button>
            <button type="submit" className="btn btn-primary flex-1">Добавить</button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
