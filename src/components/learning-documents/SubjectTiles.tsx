import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getLearningDocumentSubjectInfo, learningDocumentSubjects, LearningDocumentSubject } from '@/data/learningDocumentSubjects';

type SubjectTilesProps = {
  activeSubject?: LearningDocumentSubject | null;
  counts?: Partial<Record<LearningDocumentSubject, number>>;
  onSelect: (subject: LearningDocumentSubject) => void;
  onClear?: () => void;
  title: string;
  description: string;
};

export function SubjectTiles({ activeSubject, counts, onSelect, onClear, title, description }: SubjectTilesProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {learningDocumentSubjects.map((subject) => {
          const info = getLearningDocumentSubjectInfo(subject.id);
          const isActive = activeSubject === subject.id;
          return (
            <Button
              key={subject.id}
              type="button"
              variant="outline"
              onClick={() => onSelect(subject.id)}
              className={cn(
                'h-auto flex-col items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                isActive && 'border-primary bg-primary/5 shadow-sm'
              )}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="text-2xl">{info.icon}</div>
                <Badge variant={isActive ? 'default' : 'secondary'}>{counts?.[subject.id] ?? 0}</Badge>
              </div>
              <div className="space-y-1 w-full">
                <p className="font-semibold leading-tight">{info.nameFr}</p>
                <p className="text-xs text-muted-foreground leading-tight">{info.nameAr}</p>
              </div>
            </Button>
          );
        })}
      </div>

      {activeSubject && onClear && (
        <Button type="button" variant="ghost" onClick={onClear} className="px-0">
          Voir toutes les matières
        </Button>
      )}
    </Card>
  );
}