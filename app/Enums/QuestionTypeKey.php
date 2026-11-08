<?php

namespace App\Enums;

enum QuestionTypeKey: string
{
    case Single   = 'single';
    case Multiple = 'multiple';
    case Ordering = 'ordering';
    case GapFill  = 'gap_fill';

    public function label(): string
    {
        return match ($this) {
            self::Single   => 'Один ответ',
            self::Multiple => 'Несколько ответов',
            self::Ordering => 'Правильный порядок',
            self::GapFill  => 'Заполни пропуски',
        };
    }

    public function maxScore(): float { return 1.0; }
    public function partialScore(): float { return 0.5; }
}
