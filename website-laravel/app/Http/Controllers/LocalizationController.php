<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LocalizationController extends Controller
{
    public function setLang($locale){
        App::setLocale($locale);
        Session::put("locale",$locale);
        return redirect()->back();
    }
    public function index(){
        return view('disclaimer');
    }
    public function privacy(){
        return view('privacy');
    }
    public function trademark(){
        return view('trademark');
    }
    public function developers(){
        return view('developers');
    }
    
}