<?php

use App\Mail\ContactMail;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\LocalizationController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('index');
});


Route::post('/send-email', [EmailController::class, 'sendEmail'])->name('send-email');

Route::get("locale/{lange}",[LocalizationController::class, 'setLang'])->name('local.change');

Route::get("/disclaimer",[LocalizationController::class, 'index'])->name('get-disclaimer');

Route::get("/privacy",[LocalizationController::class, 'privacy'])->name('get-privacy');

Route::get("/trademark",[LocalizationController::class, 'trademark'])->name('get-trademark');

Route::get("/developers",[LocalizationController::class, 'developers'])->name('get-developers');