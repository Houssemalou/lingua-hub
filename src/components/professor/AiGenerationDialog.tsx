import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sparkles, Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AiGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  loading: boolean;
  canGenerate: boolean;
  daysRemaining?: number;
}

export function AiGenerationDialog({
  isOpen, onClose, onConfirm, loading, canGenerate, daysRemaining,
}: AiGenerationDialogProps) {
  const { language, isRTL } = useLanguage();
  const [challengeCount, setChallengeCount] = React.useState(5);

  const labels = {
    fr: {
      title: 'Générer des défis avec l\'IA',
      description: 'L\'IA va analyser votre cours et générer des défis à choix multiples adaptés au contenu.',
      count: 'Nombre de défis',
      generate: 'Générer les défis',
      generating: 'Génération en cours...',
      later: 'Plus tard',
      limitReached: 'Quota quotidien atteint',
      limitMessage: 'Vous avez terminé votre quota de génération pour aujourd\'hui. Revenez ultérieurement.',
      comingSoon: 'Fermer',
    },
    ar: {
      title: 'توليد التحديات بالذكاء الاصطناعي',
      description: 'سيقوم الذكاء الاصطناعي بتحليل درسك وإنشاء تحديات اختيار من متعدد مناسبة للمحتوى.',
      count: 'عدد التحديات',
      generate: 'توليد التحديات',
      generating: 'جاري التوليد...',
      later: 'لاحقاً',
      limitReached: 'تم استنفاد الحصة اليومية',
      limitMessage: 'لقد استنفدت حصتك اليومية من التوليد. عد لاحقاً.',
      comingSoon: 'إغلاق',
    },
  };

  const t = labels[language as keyof typeof labels] || labels.fr;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2 text-xl', isRTL && 'flex-row-reverse')}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-6 h-6 text-primary" />
            </motion.div>
            {t.title}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && 'text-right')}>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        {!canGenerate ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.limitMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="w-full">{t.comingSoon}</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={cn(isRTL && 'text-right block')}>{t.count}</Label>
              <Select
                value={String(challengeCount)}
                onValueChange={(v) => setChallengeCount(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 défis</SelectItem>
                  <SelectItem value="5">5 défis</SelectItem>
                  <SelectItem value="10">10 défis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className={cn('gap-2', isRTL && 'flex-row-reverse')}>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {t.later}
              </Button>
              <Button onClick={() => onConfirm(challengeCount)} disabled={loading}>
                {loading ? (
                  <>{t.generating} <span className="animate-spin ml-2">...</span></>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> {t.generate}</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AiGenerationDialog;
