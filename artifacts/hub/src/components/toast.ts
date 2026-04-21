import { useState, useEffect } from "react";

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let listeners: Array<(t: ToastMessage[]) => void> = [];
let current: ToastMessage[] = [];
let seq = 0;

export function toast(message: string, type: ToastMessage["type"] = "success") {
  const id = seq++;
  current = [...current, { id, message, type }];
  listeners.forEach((fn) => fn(current));
  setTimeout(() => {
    current = current.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(current));
  }, 4000);
}

export function useToasts(): ToastMessage[] {
  const [toasts, setToasts] = useState<ToastMessage[]>(current);
  useEffect(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter((fn) => fn !== setToasts); };
  }, []);
  return toasts;
}
