import React, { useEffect, useState } from "react";

import { ALL_APPLICATIONS } from "../App";
import type { Application } from "../types/types";
import { toast } from "sonner";

function Moderation() {
  const [applications, setApplications] = useState<Application[]>([
    ...ALL_APPLICATIONS,
  ]);

  useEffect(() =>{
    console.log(applications);
    
  }, [applications])

  const handleAccept = (id: string) => {
    setApplications((prevApps) =>
      prevApps.map((el) => (el.id === id ? { ...el, status: "Новые" } : el)),
    );

    toast.success("Заявка успешно одобрена");
    console.log(applications);
  };

  const handleCancle = (id: string) => {
    setApplications((prevApps) =>
      prevApps.map((el) =>
        el.id === id ? { ...el, status: "Отклоненные" } : el,
      ),
    );

    toast.success("Заявка успешно отклонена");
    console.log(applications);
  };

  const pendingApps = applications.filter(
    (item) => item.status === "На модерации",
  );

  return (
    <div className="moderation">
      <h1>Список поданных заявок</h1>
      {pendingApps.map((item) => (
        <div key={item.id}>
          <h1>{item.title}</h1>
          <span className="status">{item.status}</span>
          <span>{item.date.toLocaleDateString()}</span>
          <button onClick={() => handleAccept(item.id)}>Одобрить 👍</button>
          <button onClick={() => handleCancle(item.id)}>Отклонить 👎</button>
        </div>
      ))}
    </div>
  );
}

export default Moderation;
