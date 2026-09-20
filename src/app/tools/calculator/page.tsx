import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "@/components/Calculator";

export const metadata: Metadata = {
  title: "Калькулятор совместимости: мышь + коврик + глайды — GearLab",
  description:
    "Укажите игру, хват, sens-профиль и бюджет — движок подберёт связку периферии с обоснованием каждого решения и предупреждениями о совместимости.",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Калькулятор совместимости</h1>
      <p className="mb-8 mt-2 max-w-2xl text-dim">
        Rules engine поверх нормализованной базы: матрица «поверхность × материал глайдов»,
        весовые профили и требования к polling rate.{" "}
        <Link href="/tools/sens-calculator" className="text-neon hover:underline">
          → конвертер сенсы
        </Link>
      </p>
      <Calculator />
    </div>
  );
}
