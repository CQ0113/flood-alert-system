<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('client');
})->name('home');

Route::get('/portal', function () {
    return Inertia::render('client');
})->name('portal');

Route::get('/dashboard', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/report', function () {
    return Inertia::render('report');
})->name('report');
