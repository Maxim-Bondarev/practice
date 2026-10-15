export interface Application {
  id: string;
  title: string;
  descriptions: string;
  date: Date;
  status: "Все" | "Новые" | "В обработке" | "Завершенные" | "Отклоненные";
}