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
  // Общие чек-листы (без категории)
  {
    title: 'После открытия ООО/ИП',
    category: null,
    tasks: [
      { text: 'Открыть расчётный счёт в банке', completed: false },
      { text: 'Заказать печать и штамп организации', completed: false },
      { text: 'Уведомить фонд об открытии юр. лица', completed: false },
      { text: 'Получить коды статистики (Росстат)', completed: false },
      { text: 'Зарегистрироваться в ФСС и ПФР', completed: false },
    ],
  },
  {
    title: 'Запуск проекта',
    category: null,
    tasks: [
      { text: 'Составить детальный бизнес-план', completed: false },
      { text: 'Определить ключевые метрики успеха', completed: false },
      { text: 'Создать MVP продукта', completed: false },
      { text: 'Провести первичное тестирование', completed: false },
      { text: 'Подготовить презентацию для инвесторов', completed: false },
    ],
  },
  // Кадровые чек-листы (HR)
  {
    title: 'Приём нового сотрудника',
    category: 'HR' as const,
    tasks: [
      { text: 'Получить документы от кандидата', completed: false },
      { text: 'Составить трудовой договор', completed: false },
      { text: 'Издать приказ о приёме на работу', completed: false },
      { text: 'Внести запись в трудовую книжку', completed: false },
      { text: 'Оформить личную карточку Т-2', completed: false },
      { text: 'Провести инструктаж по охране труда', completed: false },
    ],
  },
  {
    title: 'Увольнение сотрудника',
    category: 'HR' as const,
    tasks: [
      { text: 'Получить заявление об увольнении', completed: false },
      { text: 'Издать приказ об увольнении', completed: false },
      { text: 'Внести запись в трудовую книжку', completed: false },
      { text: 'Произвести окончательный расчёт', completed: false },
      { text: 'Выдать справки (2-НДФЛ, 182н)', completed: false },
    ],
  },
  {
    title: 'Воинский учёт',
    category: 'HR' as const,
    tasks: [
      { text: 'Назначить ответственного за воинский учёт', completed: false },
      { text: 'Завести карточки учёта на сотрудников', completed: false },
      { text: 'Уведомить военкомат о приёме/увольнении', completed: false },
      { text: 'Провести сверку данных с военкоматом', completed: false },
    ],
  },
  // Финансовые чек-листы (FINANCE)
  {
    title: 'Ежемесячная отчётность',
    category: 'FINANCE' as const,
    tasks: [
      { text: 'Собрать первичные документы за месяц', completed: false },
      { text: 'Сверить остатки по расчётному счёту', completed: false },
      { text: 'Подготовить отчёт о расходах для фонда', completed: false },
      { text: 'Рассчитать и уплатить налоги', completed: false },
      { text: 'Выплатить заработную плату сотрудникам', completed: false },
    ],
  },
  {
    title: 'Квартальная отчётность',
    category: 'FINANCE' as const,
    tasks: [
      { text: 'Подготовить декларацию по УСН/ОСНО', completed: false },
      { text: 'Сдать отчёт в ФСС (4-ФСС)', completed: false },
      { text: 'Сдать отчёт в ПФР (СЗВ-М, СЗВ-СТАЖ)', completed: false },
      { text: 'Подготовить финансовый отчёт для гранта', completed: false },
      { text: 'Провести инвентаризацию расходов', completed: false },
    ],
  },
  {
    title: 'При заключении договора',
    category: 'FINANCE' as const,
    tasks: [
      { text: 'Проверить контрагента (выписка ЕГРЮЛ)', completed: false },
      { text: 'Подготовить и согласовать договор', completed: false },
      { text: 'Получить подписи сторон', completed: false },
      { text: 'Выставить/получить счёт на оплату', completed: false },
      { text: 'Составить акт выполненных работ', completed: false },
      { text: 'Сохранить документы в архив', completed: false },
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
  { id: 5, title: 'Воинский учет организации', description: 'Формы и рекомендации по ведению воинского учета', icon: 'ri-shield-user-line', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { id: 6, title: 'Трудовой договор', description: 'Шаблон трудового договора с сотрудником', icon: 'ri-file-user-line', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 7, title: 'Приказ о приеме', description: 'Шаблон приказа о приеме на работу', icon: 'ri-file-add-line', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { id: 8, title: 'Договор услуг', description: 'Шаблон договора на оказание услуг', icon: 'ri-file-shield-line', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 9, title: 'Акт выполненных работ', description: 'Шаблон акта выполненных работ', icon: 'ri-file-check-line', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 10, title: 'Счет на оплату', description: 'Шаблон счета на оплату', icon: 'ri-file-paper-2-line', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
];
