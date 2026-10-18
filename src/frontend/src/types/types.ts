export interface Application {
  id: string;
  title: string;
  date: Date;
  project: string;
  status: "Все" | "Новые" | "В обработке" | "Завершенные" | "Отклоненные" | "Мои";
}