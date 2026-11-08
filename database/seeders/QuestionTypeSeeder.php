<?php

namespace Database\Seeders;

use App\Enums\QuestionTypeKey;
use App\Models\QuestionType;
use Illuminate\Database\Seeder;

class QuestionTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key'         => QuestionTypeKey::Single->value,
                'name'        => 'Один ответ',
                'description' => 'Выберите один правильный ответ из предложенных.',
            ],
            [
                'key'         => QuestionTypeKey::Multiple->value,
                'name'        => 'Несколько ответов',
                'description' => 'Выберите несколько правильных ответов из предложенных.',
            ],
            [
                'key'         => QuestionTypeKey::Ordering->value,
                'name'        => 'Правильный порядок',
                'description' => 'Расставьте предложенные варианты в правильном порядке.',
            ],
            [
                'key'         => QuestionTypeKey::GapFill->value,
                'name'        => 'Заполни пропуски',
                'description' => 'Вставьте пропущенные слова из предложенного набора.',
            ],
        ];

        foreach ($types as $type) {
            QuestionType::updateOrCreate(
                ['key' => $type['key']],
                ['name' => $type['name'], 'description' => $type['description']],
            );
        }
    }
}
