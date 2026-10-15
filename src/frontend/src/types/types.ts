export interface Application {
  id: string;
  title: string;
  descriptions: string;
  date: Date;
  project: string;
  status: "Все" | "Новые" | "В обработке" | "Завершенные" | "Отклоненные";
}