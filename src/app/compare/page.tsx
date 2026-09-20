import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareTool } from "@/components/CompareTool";

export const metadata: Metadata = {
  title: "Сравнение игровых устройств: мыши, клавиатуры, коврики, глайды — GearLab",
  description:
    "Интерактивная таблица сравнения до 4 устройств бок о бок: сенсор, вес, клик-латентность, polling rate, Hall Effect, Rapid Trigger, трение ковриков и цена. Лучшие показатели выделены автоматически.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Сравнение устройств</h1>
      <p className="mb-8 mt-2 max-w-2xl text-dim">
        До 4 моделей бок о бок. Лучшее значение в строке подсвечено.
      </p>
      <Suspense fallback={<p className="text-dim">Загрузка…</p>}>
        <CompareTool />
      </Suspense>
    </div>
  );
}
