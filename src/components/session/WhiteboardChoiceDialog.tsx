import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export type WhiteboardMode = "tldraw" | "polypad";

interface WhiteboardChoiceDialogProps {
  open: boolean;
  onSelect: (mode: WhiteboardMode) => void;
  onCancel: () => void;
}

const fr = {
  title: "Choisissez votre tableau blanc",
  subtitle: "Deux outils adaptés à vos besoins pédagogiques",
  tblanc: {
    name: "Tableau Blanc",
    desc: "Outil libre pour dessiner, écrire et annoter",
    advantages: [
      "Dessin et écriture libres",
      "Formes, flèches et annotations",
      "Idéal pour les explications rapides",
      "Export PDF des pages",
    ],
  },
  learnup: {
    name: "learnUpBoard",
    desc: "Tableau mathématique interactif (Polypad)",
    advantages: [
      "Règle, compas, équerre et rapporteur",
      "Constructions géométriques précises",
      "Figurines et tuiles de calcul",
      "Idéal pour les mathématiques",
    ],
  },
  cancel: "Annuler",
};

const ar: typeof fr = {
  title: "اختر لوحتك البيضاء",
  subtitle: "أداتان مناسبتان لاحتياجاتك التعليمية",
  tblanc: {
    name: "اللوحة البيضاء",
    desc: "أداة حرة للرسم والكتابة والتعليق",
    advantages: [
      "رسم وكتابة حران",
      "أشكال وأسهم وتعليقات",
      "مثالية للشروحات السريعة",
      "تصدير الصفحات بصيغة PDF",
    ],
  },
  learnup: {
    name: "learnUpBoard",
    desc: "لوحة رياضيات تفاعلية (Polypad)",
    advantages: [
      "مسطرة، فرجار، مثلث ومنقلة",
      "إنشاءات هندسية دقيقة",
      "مكعبات وبلاطات حسابية",
      "مثالية لمادة الرياضيات",
    ],
  },
  cancel: "إلغاء",
};

export const WhiteboardChoiceDialog: React.FC<WhiteboardChoiceDialogProps> = ({
  open,
  onSelect,
  onCancel,
}) => {
  const { isRTL } = useLanguage();
  const txt = isRTL ? ar : fr;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Title */}
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {txt.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{txt.subtitle}</p>
            </div>

            {/* Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tableau Blanc (tldraw) */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect("tldraw")}
                className="flex flex-col items-start p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Pencil className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-bold">{txt.tblanc.name}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{txt.tblanc.desc}</p>
                <ul className="space-y-1.5">
                  {txt.tblanc.advantages.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </motion.button>

              {/* learnUpBoard (Polypad) */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect("polypad")}
                className="flex flex-col items-start p-5 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-lg font-bold">{txt.learnup.name}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {txt.learnup.desc}
                </p>
                <ul className="space-y-1.5">
                  {txt.learnup.advantages.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </motion.button>
            </div>

            {/* Cancel */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {txt.cancel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
