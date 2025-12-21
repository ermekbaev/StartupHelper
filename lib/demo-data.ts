export const INITIAL_USER_PROFILE = {
  name: 'Иван Петров',
  projectName: 'ИТ-стартап "EcoDelivery"',
  grantAmount: 500000,
  email: 'ivan.petrov@example.com',
  phone: '+7 (999) 123-45-67',
  inn: '1234567890',
  ogrn: '1234567890123',
};

export const INITIAL_CHECKLISTS = [
  {
    id: 1,
    title: 'После открытия ООО',
    tasks: [
      { id: 'task-1', text: 'Открыть расчётный счёт', completed: true },
      { id: 'task-2', text: 'Заказать печать и штамп', completed: true },
      { id: 'task-3', text: 'Создать корпоративный сайт', completed: false },
      { id: 'task-4', text: 'Уведомить фонд об открытии ООО', completed: false },
      { id: 'task-5', text: 'Настроить онлайн-кассу', completed: false },
    ],
  },
  {
    id: 2,
    title: 'При заключении договора',
    tasks: [
      { id: 'contract-1', text: 'Подготовить договор', completed: false },
      { id: 'contract-2', text: 'Получить подписи сторон', completed: false },
      { id: 'contract-3', text: 'Составить акт выполненных работ', completed: false },
      { id: 'contract-4', text: 'Выставить счёт', completed: false },
      { id: 'contract-5', text: 'Сохранить документы в архив', completed: false },
    ],
  },
];

export const INITIAL_SERVICES = [
  { id: 1, name: 'Юридические услуги', amount: 50000, documents: ['Договор', 'Счет', 'Акт'] },
  { id: 2, name: 'Консалтинг', amount: 75000, documents: ['Договор', 'Счет'] },
];

export const INITIAL_EQUIPMENT = [
  { id: 1, name: 'MacBook Pro 14"', amount: 85000, date: '08.01.2024', documents: ['Счет', 'Договор', 'УПД'] },
  { id: 2, name: 'Монитор Dell 27"', amount: 25000, date: '12.01.2024', documents: ['Счет', 'Акт'] },
];

export const INITIAL_EMPLOYEES = [
  {
    id: 1,
    name: 'Иван Петров',
    initials: 'ИП',
    position: 'Генеральный директор',
    hireDate: '01.12.2023',
    militaryStatus: 'updated' as const,
    status: 'active' as const,
    color: 'blue',
  },
  {
    id: 2,
    name: 'Анна Сидорова',
    initials: 'АС',
    position: 'Lead Developer',
    hireDate: '15.12.2023',
    militaryStatus: 'not_applicable' as const,
    status: 'active' as const,
    color: 'purple',
  },
  {
    id: 3,
    name: 'Михаил Козлов',
    initials: 'МК',
    position: 'UI/UX Designer',
    hireDate: '20.12.2023',
    militaryStatus: 'needs_update' as const,
    status: 'active' as const,
    color: 'green',
  },
];

export const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const DOCUMENT_TEMPLATES = [
  { id: 1, title: 'Бизнес-план', description: 'Шаблон и рекомендации по составлению бизнес-плана', icon: 'ri-file-chart-line', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 2, title: 'Развитие стартап-проекта', description: 'Шаблон и рекомендации по развитию стартапа', icon: 'ri-rocket-line', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 3, title: 'Отчет по 1 этапу', description: 'Форма отчета по первому этапу проекта', icon: 'ri-file-paper-line', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { id: 4, title: 'Отчет по 2 этапу', description: 'Форма отчета по второму этапу проекта', icon: 'ri-file-list-line', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 5, title: 'Воинский учет организации', description: 'Формы и рекомендации по ведению воинского учета', icon: 'ri-shield-user-line', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { id: 6, title: 'Трудовой договор', description: 'Шаблон трудового договора с сотрудником', icon: 'ri-file-user-line', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 7, title: 'Приказ о приеме', description: 'Шаблон приказа о приеме на работу', icon: 'ri-file-add-line', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  { id: 8, title: 'Договор услуг', description: 'Шаблон договора на оказание услуг', icon: 'ri-file-shield-line', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { id: 9, title: 'Акт выполненных работ', description: 'Шаблон акта выполненных работ', icon: 'ri-file-check-line', iconBg: 'bg-lime-100', iconColor: 'text-lime-600' },
  { id: 10, title: 'Счет на оплату', description: 'Шаблон счета на оплату', icon: 'ri-file-paper-2-line', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 11, title: 'УПД', description: 'Универсальный передаточный документ', icon: 'ri-file-transfer-line', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 12, title: 'Налоговая декларация', description: 'Шаблоны налоговых деклараций', icon: 'ri-government-line', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
];
