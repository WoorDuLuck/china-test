<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class PageController extends Controller
{
    public function home()
    {
        return Inertia::render('welcome');
    }

    public function instruction()
    {
        return Inertia::render('instruction');
    }

    public function privacy()
    {
        return Inertia::render('privacy');
    }
}