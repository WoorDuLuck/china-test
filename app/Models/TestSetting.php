<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestSetting extends Model
{
    protected $fillable = ['distribution'];

    protected $casts = [
        'distribution' => 'array',
    ];

    /**
     * Синглтон: всегда одна актуальная строка.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], ['distribution' => []]);
    }

    /**
     * [{ section_id: 1, count: 2 }, ...]
     */
    public function distribution(): array
    {
        return $this->distribution ?? [];
    }
}
