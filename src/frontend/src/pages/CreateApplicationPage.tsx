import React, { useState, type FormEvent } from "react";
import type { Application, ApplicationForm } from "../types/types";
import { ALL_APPLICATIONS } from "../App";
import { toast } from "sonner";

import Chat from "../components/Chat";

function CreateApplicationPage() {
  const [formValue, setFormValue] = useState<ApplicationForm>({
    title: "",
    project: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormValue((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newApplication: Application = {
      id: new Date().toString(),
      title: formValue.title,
      date: new Date(),
      project: formValue.project,
      status: "На модерации",
    };
    console.log(formValue);
    ALL_APPLICATIONS.push(newApplication);
    setFormValue({ title: "", project: "" });

    toast.success("Успешно", {
      description: "Заявка успешно отправлена",
    });
  };

  return (
    <div className="create-application-page">
      <h1>Оформление заявки</h1>
      <p>Опишите проблему и мы свяжемся с вами в течении рабочего дня</p>
      <div className="form-block">
        <form onSubmit={handleSubmit}>
          <label>Проект</label>
          <select
            value={formValue.project}
            onChange={handleChange}
            name="project"
            id="project-select"
            required
          >
            <option value="">Выберите проект</option>
            <option value="1X">1X</option>
            <option value="Music">Music</option>
            <option value="Delivery">Delivery</option>
          </select>
          <label>Описание проблемы</label>
          <textarea
            value={formValue.title}
            onChange={handleChange}
            name="title"
            placeholder="Опишите проблему"
          />
          <button type="submit">Оставить заявку</button>
        </form>
      </div>
      <Chat />
    </div>
  );
}

export default CreateApplicationPage;
