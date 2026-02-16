import * as React from "react";
import type { ToastActionElement, ToastProps } from "../components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let idCounter = 0;
const generateId = () => (++idCounter).toString();

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = React.useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
      );

      setTimeout(() => remove(id), TOAST_REMOVE_DELAY);
    },
    [remove],
  );

  const update = React.useCallback(
    (id: string, props: Partial<ToasterToast>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...props } : t)),
      );
    },
    [],
  );

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = generateId();

      const newToast: ToasterToast = {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss(id);
        },
      };

      setToasts((prev) => [newToast, ...prev].slice(0, TOAST_LIMIT));

      return {
        id,
        dismiss: () => dismiss(id),
        update: (p: Partial<ToasterToast>) => update(id, p),
      };
    },
    [dismiss, update],
  );

  return { toasts, toast, dismiss };
}
