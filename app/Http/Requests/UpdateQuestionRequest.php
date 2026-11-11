<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesQuestion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateQuestionRequest extends FormRequest
{
    use ValidatesQuestion;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge(
            $this->baseRules(),
            $this->rulesByType($this->resolveTypeKey()),
        );
    }

    protected function prepareForValidation(): void
    {
        $this->filterRemovedOptions();
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $this->afterValidate($validator);
            },
        ];
    }
}