import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ApplicationForm, Project } from "../types/types";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createApplication } from "../storage/db";

function CreateApplicationPage() {
  const { initialized, authenticated, user, login } = useAuth();
  const navigate = useNavigate();

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

  if (!initialized) return null;

  if (!authenticated || !user) {
    return (
      <div className="create-application-page">
        <h1>Оформление заявки</h1>
        <p>Чтобы оставить заявку, нужно войти в аккаунт</p>
        <div className="form-block">
          <button onClick={() => login("/create-application")}>Войти</button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formValue.project || !formValue.title.trim()) return;

    const created = createApplication({
      title: formValue.title,
      project: formValue.project as Project,
      author: { id: user.id, name: user.username },
    });

    if (!created) {
      toast.error("Не удалось сохранить заявку");
      return;
    }

    setFormValue({ title: "", project: "" });
    toast.success("Успешно", {
      description: "Заявка успешно отправлена",
    });

    navigate(`/applications/${created.id}`);
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
            required
          />
          <button type="submit">Оставить заявку</button>
        </form>
      </div>
    </div>
  );
}

export default CreateApplicationPage;