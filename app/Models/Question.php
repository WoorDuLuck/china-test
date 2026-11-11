<?php

namespace App\Models;

use App\Enums\QuestionTypeKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['section_id', 'type_id', 'text', 'image'];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(QuestionType::class, 'type_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('order_position');
    }

    public function typeKey(): ?QuestionTypeKey
    {
        return $this->type?->key;
    }

    /**
     * Для gap_fill: номера пропусков, найденные в тексте.
     * Поддерживаем маркеры {{1}}, {{2}}, {{3}} (рекомендуется)
     * и запасной вариант — последовательности "_____".
     */
    public function gapNumbers(): array
    {
        if ($this->typeKey() !== QuestionTypeKey::GapFill) {
            return [];
        }

        if (preg_match_all('/\{\{(\d+)\}\}/', $this->text, $m)) {
            return array_values(array_unique(array_map('intval', $m[1])));
        }

        // fallback: считаем количество "_____"
        $count = substr_count($this->text, '_____');
        return $count ? range(1, $count) : [];
    }

    /**
     * Правильные ответы (используется сервисом проверки).
     *  - single/multiple: массив id опций с is_correct = true
     *  - ordering: [option_id => order_position]
     *  - gap_fill: [gap_number => option_id]
     */
    public function correctAnswerMap(): array
    {
        return match ($this->typeKey()) {
            QuestionTypeKey::Single, QuestionTypeKey::Multiple =>
                $this->options->where('is_correct', true)->pluck('id')->all(),

            QuestionTypeKey::Ordering =>
                $this->options->mapWithKeys(fn ($o) => [$o->id => (int) $o->order_position])->all(),

            QuestionTypeKey::GapFill =>
                $this->options->mapWithKeys(fn ($o) => [(int) $o->order_position => $o->id])->all(),

            default => [],
        };
    }
}
