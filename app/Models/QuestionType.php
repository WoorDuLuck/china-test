<?php

namespace App\Models;

use App\Enums\QuestionTypeKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionType extends Model
{
    protected $fillable = ['key', 'name', 'description'];

    protected $casts = [
        'key' => QuestionTypeKey::class,
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'type_id');
    }
}
