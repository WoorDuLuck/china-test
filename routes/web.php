<?php

use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\TestSettingController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
//Route::get('/', function () {return Inertia::render('welcome');})->name('home');

/*
|--------------------------------------------------------------------------
| Публичная часть
|--------------------------------------------------------------------------
*/
Route::controller(PageController::class)->group(function () {
    Route::get('/', 'home')->name('home');
    Route::get('/instruction', 'instruction')->name('instruction');
    Route::get('/privacy', 'privacy')->name('privacy');
});

Route::controller(TestController::class)->group(function () {
    Route::post('/test/start', 'start')->name('test.start');
    Route::get('/test', 'show')->name('test.show');
    Route::post('/test/submit', 'submit')->name('test.submit');
    Route::get('/test/result', 'result')->name('test.result');
    Route::post('/test/reset', 'reset')->name('test.reset');
});

/*
|--------------------------------------------------------------------------
| Админка
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::redirect('/', '/admin/sections');
        Route::resource('sections', SectionController::class)->except(['show']);
        Route::resource('questions', QuestionController::class)->except(['show']);
        Route::get('settings', [TestSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [TestSettingController::class, 'update'])->name('settings.update');
    });

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
