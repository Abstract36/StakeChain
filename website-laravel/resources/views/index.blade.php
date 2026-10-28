@extends('layout.app')

@section('content')
<!-- Preloader -->
<!-- <div id="preloader">
        <div class="preload-content">
            <div id="dream-load"></div>
        </div>
    </div> -->
    
 <div class="position-fix-on-phone">   
<div class="telegram-icon">
    <!-- <a href="#"> <i class="fab fa-telegram"></i></a> -->
    <a href="https://telegram.org/"><img src="{{ asset('./img/icons/Telegram-icon.png') }}" alt="" class="discord-class-icon"></a>
</div>


<div class="discord-icon">
    <!-- <a href="#"> <i class="fab fa-discord"></i></a> -->
    <a href="https://discord.gg/4uvA83j9QU" target="blank"><img
            src="{{ asset('./img/icons/discord-icon.png') }}" alt="" class="discord-class-icon"></a>
</div>
</div>

<!-- ##### Header Area Start ##### -->
<nav class="navbar navbar-expand-lg navbar-white fixed-top" id="banner">
    <div class="container">
        <!-- Brand -->
        <a class="navbar-brand" href="./index.html"><span><img class="logo-image" src="img/icons/favicon.png"
                    alt="logo"></span>@lang('index.stakechain')</a>

        <!-- Toggler/collapsibe Button -->
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsibleNavbar">
            <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navbar links -->
        <div class="collapse navbar-collapse" id="collapsibleNavbar">
            <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                    <a class="nav-link" href="#home">@lang('index.home')</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#about-sec">@lang('index.aboutus')</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#services">@lang('index.feature')</a>
                </li>
                <!-- <li class="nav-item">
                        <a class="nav-link" href="#faq">FAQ</a>
                    </li> -->

                <li class="nav-item">
                    <a class="nav-link" href="#contact">@lang('index.contact')</a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" target="_blank" href="http://app.stakechain.io/">@lang('index.stake')</a>
                </li>

                <div class="dropdown bg-transparent">
                    <button class="country-drop-down dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        @lang('index.select-language')
                    </button>
                    <ul class="dropdown-menu border border-primary bg-transparent back-colour-control" style=" background-color: #23aaea !important;">
                        <li><a class="dropdown-item text-white" href="{{ route('local.change', 'gr' )}}">German</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','fr')}}">French</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','en')}}">English</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','rs')}}">Russion</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','ch')}}">Chinese</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','ab')}}">Arabic</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','tr')}}">Turkish</a></li>
                        <li><a class="dropdown-item text-white" href="{{ route('local.change','sp')}}">Spanish</a></li>
                    </ul>
                </div>

                <!-- <li class="nav-item">
                    <select id="languages" name="languages" class="country-drop-down">
                        <option value="yi">Select Language</option>
                        <option value="yi">
                            <a href="{{ route('local.change', 'gr' )}}">German</a>
                        </option>
                        <option value="yo">
                            <a href="{{ route('local.change','fr')}}">French</a>
                        </option>
                        <option value="zu">
                            <a href="{{ route('local.change','en')}}">English</a>
                        </option>
                    </select>
                </li> -->



                <!-- <li class="lh-55px"><a href="#" class="btn login-btn ml-50">Contact Us</a></li> -->
            </ul>
        </div>
    </div>
</nav>
<!-- ##### Header Area End ##### -->

<!-- ##### Welcome Area Start ##### -->
<section class="hero-section moving section-padding" id="home">
    <div class="moving-bg"></div>
    <!-- Hero Content -->
    <div class="hero-section-content">

        <div class="container ">
            <div class="row align-items-center">
                <!-- Welcome Content -->
                <div class="col-12 col-lg-6 col-md-12">
                    <div class="welcome-content">
                        <div class="promo-section">
                            <h3 class="special-head dark">@lang('index.note')</h3>
                        </div>
                        <h1 class="fadeInUp" data-wow-delay="0.2s">@lang('index.header-text-1') </h1>
                        <p class="w-text fadeInUp" data-wow-delay="0.3s">
                            @lang('index.header-text-2')</p>
                        <div class="dream-btn-group fadeInUp" data-wow-delay="0.4s">
                            <a href="http://app.stakechain.io/dashboard" target='_blank' class="btn more-btn mr-3">@lang('index.header-btn')</a>
                            <!-- <a href="#contact" class="btn more-btn">Get in touch</a> -->
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="dotted mt-30 fadeInUp width-on-tab mt-on-mobile" data-wow-delay="0.5s">
                        <img src="./img/new-images/banner.png" alt="">
                    </div>
                </div>

            </div>
        </div>
    </div>
</section>
<!-- ##### Welcome Area End ##### -->

<div class="clearfix"></div>

<!-- ##### About Us Area Start ##### -->
<div class="about-us-area section-padding-100 clearfix" id="about-sec">

    <div class="section-heading text-center ">
        <!-- Dream Dots -->

        <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.aboutus')</h2>
        <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.about-text')</p>
    </div>

    <div class="container">


        <div class="row align-items-center" data-aos="fade-up">
            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 no-padding-left">
                <div class="welcome-meter fadeInUp" data-wow-delay="0.7s">
                    <!-- <img src="img/core-img/about-1.png" alt=""> -->

                    <div class="vedio-btn-box width-on-tab" data-bs-toggle="modal" href="#exampleModalToggle" role="button">
                        <i class="far fa-play-circle"></i>
                    </div>

                </div>
            </div>

            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant mt-s">
                    <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                        <span class="gradient-text ">@lang('index.about-investor-text')</span>
                    </div>
                    <h4 class="fadeInUp " data-wow-delay="0.3s">@lang('index.about-head-1')</h4>
                    <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.about-head-1-text')</p>
                    <!-- <p class="fadeInUp" data-wow-delay="0.5s">
                            We believe in empowering more traders, in creating more
                            personal connections, in more place, across the globe. We
                            aim to provide with the tools that would help every
                            individual grow in the modern financial structure.</p> -->
                    <a class="btn more-btn mt-30 fadeInUp" data-wow-delay="0.6s" data-bs-toggle="modal"
                        href="#exampleModalToggle" role="button">@lang('index.about-btn-1')</a>
                </div>
            </div>

        </div>



        <div class="row align-items-center space-op-top" data-aos="fade-up">

            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant mt-s">
                    <!-- <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                            <span class="gradient-text ">Decentralized Trading Platform</span>
                        </div> -->
                    <h4 class="fadeInUp" data-wow-delay="0.3s">@lang('index.about-head-2')
                    </h4>

                    <h1 class="core-principle">@lang('index.about-head-2-opt-1')</h1>
                    <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.about-head-2-opt-1-text')</p>

                    <h1 class="core-principle">@lang('index.about-head-2-opt-2')</h1>
                    <p class="fadeInUp" data-wow-delay="0.5s">@lang('index.about-head-2-opt-2-text')</p>

                    <h1 class="core-principle">@lang('index.about-head-2-opt-3')</h1>
                    <p class="fadeInUp" data-wow-delay="0.5s">@lang('index.about-head-2-opt-3-text')</p>


                    <a class="btn more-btn mt-30 fadeInUp" data-wow-delay="0.6s"
                        href="#know-more-public">@lang('index.about-btn-2')</a>
                </div>
            </div>


            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 no-padding-left">
                <div class="welcome-meter height-inherit width-on-tab fadeInUp" data-wow-delay="0.7s">
                    <img src="./img/new-images/earn-award.png" alt="">
                </div>
            </div>

        </div>
    </div>
</div>
<!-- ##### About Us Area End ##### -->

<!-- ##### Our Services Area Start ##### -->
<section class="join-us section-padding-0-100 clearfix features-padding" id="services">
    <div class="container" data-aos="fade-up">
        <div class="row">
            <div class="col-md-12">
                <div class="section-heading text-center">
                    <!-- Dream Dots -->
                    <!-- <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                            <span>Features</span>
                        </div> -->
                    <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.feature-text-head')</h2>
                    <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.feature-text-head-text')
                    </p>
                </div>
            </div>
        </div>

        <div class="row dark-row pt-60">
            <div class="col-12 col-md-6 col-lg-4">
                <div
                    class="contribution-c-wapper has-arrow-right-lg has-arrow-top-md has-arrow-right-md has-arrow-down-sm">
                    <!-- Content -->
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.2s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t orange">1</span>
                        </div>
                        <h6>@lang('index.feature-card-1-head')</h6>
                        <p>@lang('index.feature-card-1-text')</p>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-lg-4 mt-sm-30">
                <div class="contribution-c-wapper has-arrow-right-lg has-arrow-bottom-md has-arrow-down-sm">
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.3s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t pink">2</span>
                        </div>
                        <h6>@lang('index.feature-card-2-head')</h6>
                        <p>@lang('index.feature-card-2-text')
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-lg-4 mt-s">
                <div class="contribution-c-wapper has-arrow-top-md has-arrow-down-sm">
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.4s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t blue">3</span>
                        </div>
                        <h6>@lang('index.feature-card-3-head')</h6>
                        <p>@lang('index.feature-card-3-text')
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-lg-4 hidden-md hidden-sm hidden-xs flex-center-arrow">
                <img src="img/svg/join-bottom.svg" class="arrow-img rotated" alt="">
            </div>
            <div class="col-lg-4 text-center hidden-md hidden-sm hidden-xs">
                <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>@lang('index.feature-card-join')</span>
                </div>
                <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.feature-card-cycle')</h2>
            </div>
            <div class="col-lg-4 hidden-md hidden-sm hidden-xs flex-center-arrow">
                <img src="img/svg/join-bottom.svg" class="arrow-img" alt="">
            </div>

            <div class="col-12 col-md-6 col-lg-4 mt-30">
                <div class="contribution-c-wapper has-arrow-left-lg has-arrow-bottom-md has-arrow-down-sm">
                    <!-- Content -->
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.2s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t green">6</span>
                        </div>
                        <h6>@lang('index.feature-card-4-head')</h6>
                        <p>@lang('index.feature-card-4-text')
                        </p>
                    </div>
                </div>
            </div>


            <div class="col-12 col-md-6 col-lg-4 mt-30">
                <div class="contribution-c-wapper has-arrow-left-lg has-arrow-left-md has-arrow-down-sm">
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.3s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t green">5</span>
                        </div>
                        <h6>@lang('index.feature-card-5-head')</h6>
                        <p>@lang('index.feature-card-5-text')
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-6 col-lg-4 mt-30">
                <div class="contribution-c-wapper ">
                    <div class="service_single_content text-center mb-30 fadeInUp" data-wow-delay="0.4s">
                        <!-- Icon -->
                        <div class="cycle_icon">
                            <span class="gradient-t pink">4</span>
                        </div>
                        <h6>@lang('index.feature-card-6-head')</h6>
                        <p>@lang('index.feature-card-6-text')</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>


<!-- ##### About Us Area Start ##### -->
<section class="space-op-top about-us-area section-padding-0-100 clearfix pb-0" data-aos="fade-up">

    <div class="container">
        <div class="row align-items-center">

            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant">
                    <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                        <span class="gradient-text ">@lang('index.feature-platform')</span>
                    </div>
                    <h4 class="fadeInUp" data-wow-delay="0.3s">@lang('index.feature-platform-head')</h4>
                    <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.feature-platform-head-text-1')</p>
                    <p class="fadeInUp" data-wow-delay="0.5s">@lang('index.feature-platform-head-text-2')</p>
                    <!-- <a class="btn more-btn mt-30 fadeInUp" data-wow-delay="0.6s" href="#">Read More</a> -->
                </div>
            </div>

            <!-- <img class="supportImg" src="" alt="image"> -->
            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 mt-30 no-padding-left">
                <div class="width-on-tab-second welcome-meter floating-anim fadeInUp image-control-side height-inherit" data-wow-delay="0.7s">
                    <img src="./img/new-images/blockchain.png" alt="">
                </div>
            </div>

        </div>
    </div>
</section>
<!-- ##### About Us Area End ##### -->

<!-- <div class="trust-section section-padding-0-70">
        <div class="section-heading text-center">
            <div class="dream-dots justify-content-center wow fadeInUp" data-wow-delay="0.2s">
                <span>ICO Rating</span>
            </div>
            <h2 class="wow fadeInUp" data-wow-delay="0.3s">We are trusted</h2>
            <p class="wow fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.2s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/1.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">8.9</div>
                            <div class="check-icon"></div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.3s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/2.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">8.9</div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.4s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/3.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">8.9</div>
                            <div class="check-icon"></div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.5s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/4.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">8.9</div>
                            <div class="check-icon"></div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.6s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/5.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">7.4</div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-md-3 col-lg-2">
                    <div class="trust-item text-center wow fadeInUp" data-wow-delay="0.7s">
                        <div class="ico-platform-logo">
                            <img src="img/ico-platforms/6.png" alt="">
                        </div>
                        <div class="check">
                            <div class="value">8.9</div>
                            <div class="check-icon"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div> -->

<!-- ##### Our Services Area Start ##### -->
<section class="our_services_area section-padding-0-0 clearfix space-top-100" id="know-more-public">
    <div class="container">

        <div class="section-heading text-center" data-aos="fade-up">
            <!-- Dream Dots -->
            <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                <span>@lang('index.feature-public')</span>
            </div>
            <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.feature-public-head')
            </h2>
            <p class="m-width-full" data-wow-delay="0.4s">@lang('index.feature-public-head-text')</p>
        </div>


        <div class="row justify-content-center" data-aos="fade-up">
            <div class="col-12 col-md-6 col-lg-4">
                <!-- Content -->
                <div class="margin-bottom-0-on-mb service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image card-image-box">
                        <img src="./img/new-images/feature-1.png" alt="">
                    </div>
                    <h6>@lang('index.feature-public-point-1-head')</h6>
                    <p>@lang('index.feature-public-point-1-text')</p>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-4">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image card-image-box">
                        <img src="./img/new-images/feature-2.png" alt="">
                    </div>
                    <h6>@lang('index.feature-public-point-2-head')</h6>
                    <p class="w-100">@lang('index.feature-public-point-2-text') </p>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-4">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image card-image-box">
                        <img src="./img/new-images/feature-3.png" alt="">
                    </div>
                    <h6>@lang('index.feature-public-point-3-head')</h6>
                    <p>@lang('index.feature-public-point-3-text') </p>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-4">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image card-image-box">
                        <img src="./img/new-images/freature-4.png" alt="">
                    </div>
                    <h6>@lang('index.feature-public-point-4-head')
                    </h6>
                    <p>@lang('index.feature-public-point-4-text') </p>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-4">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image card-image-box">
                        <img src="./img/new-images/feature-5.png" alt="">
                    </div>
                    <h6>@lang('index.feature-public-point-5-head')</h6>
                    <p>@lang('index.feature-public-point-5-text') </p>
                </div>
            </div>


        </div>
    </div>
</section>


<section class="our_services_area section-padding-0-0 clearfix space-op-top">
    <div class="container">

        <div class="section-heading text-center" data-aos="fade-up">
            <!-- Dream Dots -->
            <!-- <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>Public offer</span>
                </div> -->
            <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.provider-head')</h2>
        </div>


        <div class="row" data-aos="fade-up">

            <div class="col-12 col-md-6 col-lg-6">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image margin-tb-bt">
                        <img src="./img/new-images/provider-1.png" alt="">
                    </div>
                    <h6>@lang('index.provider-point-1-head')</h6>
                    <p>@lang('index.provider-point-1-text')</p>
                </div>
            </div>

            <div class="col-12 col-md-6 col-lg-6">
                <!-- Content -->
                <div class="service_single_content text-center mb-50 fadeInUp text-left" data-wow-delay="0.2s">
                    <!-- Icon -->
                    <div class="features-image ">
                        <img src="./img/new-images/provider-2.png" alt="">
                    </div>
                    <h6>@lang('index.provider-point-2-head')</h6>
                    <p>@lang('index.provider-point-2-text') </p>
                </div>
            </div>

        </div>
    </div>
</section>

<!-- ##### About Us Area Start ##### -->
<!-- <section class="smart-contract section-padding-0-70 clearfix space-op-top">

        <div class="container">
            <div class="row ">


                <div class="col-12 col-lg-6 offset-lg-0">
                    <div class="who-we-contant">
                        <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                            <span class="gradient-text ">Smart Contract</span>
                        </div>
                        <h4 class="fadeInUp" data-wow-delay="0.3s">Comprehensive smart contracts.</h4>
                        <p class="fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis at dictum risus, non suscipit arcu. Quisque aliquam posuere tortor, sit amet convallis nunc scelerisque in.</p>
                        <p class="fadeInUp" data-wow-delay="0.5s">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Suscipit ipsa ut quasi adipisci voluptates, voluptatibus aliquid alias beatae reprehenderit incidunt iusto laboriosam.</p>
                        <a class="btn more-btn mt-30 fadeInUp" data-wow-delay="0.6s" href="#">Read More</a>

                    </div>
                </div>
                <div class="col-12 col-lg-6 offset-lg-0 mt-s">
                    <div class="services-block-four v3">
                        <div class="inner-box">
                            <div class="icon-img-box">
                                <img src="img/features/s1.svg" alt="">
                            </div>
                            <h3><a href="#">Cycles and schedules</a></h3>
                            <div class="text">Lorem ipsum dolor sit amet, conse ctetur dolor adipisicing elit.</div>
                        </div>
                    </div>
                    <div class="services-block-four v3">
                        <div class="inner-box">
                            <div class="icon-img-box">
                                <img src="img/features/s2.svg" alt="">
                            </div>
                            <h3><a href="#">Advanced application interface (API)</a></h3>
                            <div class="text">Lorem ipsum dolor sit amet, conse ctetur dolor adipisicing elit.</div>
                        </div>
                    </div>
                    <div class="services-block-four v3">
                        <div class="inner-box">
                            <div class="icon-img-box">
                                <img src="img/features/s3.svg" alt="">
                            </div>
                            <h3><a href="#">Software development kit (SDK)</a></h3>
                            <div class="text">Lorem ipsum dolor sit amet, conse ctetur dolor adipisicing elit.</div>
                        </div>
                    </div>
                    <div class="services-block-four v3">
                        <div class="inner-box">
                            <div class="icon-img-box">
                                <img src="img/features/s4.svg" alt="">
                            </div>
                            <h3><a href="#">Java virtual machine (JVM)</a></h3>
                            <div class="text">Lorem ipsum dolor sit amet, conse ctetur dolor adipisicing elit.</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section> -->
<!-- ##### About Us Area End ##### -->


<!-- <section class="features section-padding-0-100 ">

        <div class="container">
            <div class="section-heading text-center" data-aos="fade-right">
                <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>Try our Platform</span>
                </div>
                <h2 class="fadeInUp" data-wow-delay="0.3s">Our Trading Platform</h2>
                <p class="fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
            </div>
            <div class="row align-items-center" data-aos="fade-left">

                <div class="service-img-wrapper col-lg-5 col-md-12 col-sm-12 no-padding-right">
                    <div class="features-list">
                        <div class="who-we-contant">

                            <h4 class="w-text fadeInUp" data-wow-delay="0.3s">Powerful platform.</h4>
                            <p class="w-text fadeInUp" data-wow-delay="0.4s">We are dedicated to providing professional service with the highest degree of honesty and integrity, and strive to add value to our tax and consulting services.</p>
                        </div>
                        <ul class="list-marked">
                            <li class="text-white"><i class="fa fa-check"></i>Competent Professionals</li>
                            <li class="text-white"><i class="fa fa-check"></i>Affordable Prices</li>
                            <li class="text-white"><i class="fa fa-check"></i>High Successful Recovery</li>
                            <li class="text-white"><i class="fa fa-check"></i>Creative Layout</li>
                        </ul>
                        <a class="btn more-btn mt-30 fadeInUp" data-wow-delay="0.6s" href="#">Read More</a>
                    </div>
                </div>

                <div class="service-img-wrapper col-lg-7 col-md-12 col-sm-12 mt-s">
                    <div class="image-box">
                        <img src="img/core-img/platform.png" class="center-block img-responsive phone-img" alt="">
                        <img src="img/core-img/rings.png" class="center-block img-responsive rings " alt="">
                    </div>
                </div>

            </div>
        </div>
    </section> -->

<!-- <section class="features section-padding-0-70 ">

        <div class="container">
            <div class="section-heading text-center" data-aos="fade-up">
                <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>Token Prices</span>
                </div>
                <h2 class="fadeInUp" data-wow-delay="0.3s">Our Token Prices</h2>
                <p class="fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
            </div>
            <div class="row align-items-center" data-aos="fade-up">
                <div class="col-lg-3 col-sm-6 col-xs-12">
                    <div class="pricing-item ">
                        <h4>Round 1</h4>
                        <h3><strong class="xzc-1-month">0.96$</strong></h3>
                        <span>1 ETH = 500 Token</span>
                        <div class="pricing">15,000,000 Token</div>
                        <label><strong>42% bonus</strong></label>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 col-xs-12">
                    <div class="pricing-item ">
                        <h4>Round 2</h4>
                        <h3><strong class="xzc-1-month">1.25$</strong></h3>
                        <span>1 ETH = 500 Token</span>
                        <div class="pricing">15,000,000 Token</div>
                        <label><strong>35% bonus</strong></label>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 col-xs-12">
                    <div class="pricing-item ">
                        <h4>Round 3</h4>
                        <h3><strong class="xzc-1-month">1.50$</strong></h3>
                        <span>1 ETH = 500 Token</span>
                        <div class="pricing">15,000,000 Token</div>
                        <label><strong>25% bonus</strong></label>
                    </div>
                </div>
                <div class="col-lg-3 col-sm-6 col-xs-12">
                    <div class="pricing-item ">
                        <h4>Round 4</h4>
                        <h3><strong class="xzc-1-month">1.96$</strong></h3>
                        <span>1 ETH = 500 Token</span>
                        <div class="pricing">15,000,000 Token</div>
                        <label><strong>15% bonus</strong></label>
                    </div>
                </div>


            </div>
        </div>
    </section> -->

<div class="clearfix"></div>


<!-- <section class="token-distribution section-padding-0-70">
        <div class="container">

            <div class="section-heading text-center" data-aos="fade-up">
                <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>ICO Distribution</span>
                </div>
                <h2 class="fadeInUp" data-wow-delay="0.3s">Our ICO Distribution</h2>
                <p class="fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
            </div>

            <div class="row align-items-center" data-aos="fade-up">
                <div class="col-lg-6 col-sm-12">
                    <div class=" ">
                        <h2 class="text-center mb-30 fadeInUp" data-wow-delay="0.3s">Funds Allocation</h2>
                        <img src="img/core-img/distribution.png" class="center-block" alt="">
                    </div>
                </div>
                <div class="col-lg-6 col-sm-12 mt-s">
                    <h2 class="text-center mb-30 fadeInUp" data-wow-delay="0.3s">Token Distribution</h2>
                    <div class="row">
                        <div class="col-sm-4">
                            <div class="">
                                <img src="img/core-img/graph-11.png" class="center-block" alt="">
                            </div>
                        </div>
                        <div class="col-sm-8">
                            <div class="token-info">
                                <div class="info-wrapper one">
                                    <div class="token-icon">12</div>
                                    <div class="token-descr">Overhead Token Distribution</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper two">
                                    <div class="token-icon">23</div>
                                    <div class="token-descr">Supporting Blockchain </div>
                                </div>
                            </div>

                            <div class="token-info">
                                <div class="info-wrapper four">
                                    <div class="token-icon">08</div>
                                    <div class="token-descr">Engineers and R&D</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper five">
                                    <div class="token-icon">07</div>
                                    <div class="token-descr"> Paltform Operations</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper three">
                                    <div class="token-icon">05</div>
                                    <div class="token-descr">Network Growth Marketing</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper six">
                                    <div class="token-icon">08</div>
                                    <div class="token-descr">Oracle Network Developers</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper seven">
                                    <div class="token-icon">05</div>
                                    <div class="token-descr">Engineers and R&D</div>
                                </div>
                            </div>
                            <div class="token-info">
                                <div class="info-wrapper eight">
                                    <div class="token-icon">27</div>
                                    <div class="token-descr"> Paltform Operations</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section> -->



<!-- ##### Token Info Start ##### -->
<!-- <div class="features2 section-padding-100-70">
        <div class="container">

            <div class="row align-items-center">

                <div class="col-12 col-lg-5 offset-lg-0 col-md-8 offset-md-2 col-sm-10 offset-sm-1">
                    <div class="ico-counter dotted-bg mb-30" data-aos="fade-right">
                        <div class="counter-down">

                            <div class="content">
                                <div class="conuter-header">
                                    <h3 class="w-text text-center">TOKEN SALE ENDS IN</h3>
                                </div>
                                <div class="counterdown-content">

                                    <div class="count-down titled circled text-center">
                                        <div class="simple_timer"></div>
                                    </div>
                                    <div class="ico-progress">
                                        <ul class="list-unstyled list-inline clearfix mb-10">
                                            <li class="title">33m</li>
                                            <li class="strength">75m</li>
                                        </ul>

                                        <div class="current-progress">
                                            <div class="progress-bar has-gradient" style="width: 75%"></div>
                                        </div>
                                        <span class="pull-left">Softcap in 103 days</span>
                                        <span class="pull-right">Token Hardcap</span>
                                    </div>
                                    <div class="text-center">
                                        <a class="btn dream-btn mt-30 fadeInUp" data-wow-delay="0.6s" href="#">Buy More tokens</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-7 col-sm-12" data-aos="fade-left">
                    <div class="col-lg-6 col-md-6 col-sm-12 mt-md-30">
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f1.svg" alt="">
                                </div>
                                <h3><a href="#">Delivery Reports</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f2.svg" alt="">
                                </div>
                                <h3><a href="#">Branded Sender</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f3.svg" alt="">
                                </div>
                                <h3><a href="#">SMS Messaging</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6 col-sm-12 mt-md-30 mt-smy-0">
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f4.svg" alt="">
                                </div>
                                <h3><a href="#">Marketing Plans</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f5.svg" alt="">
                                </div>
                                <h3><a href="#">Seed Routing</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                        <div class="services-block-four v2">
                            <div class="inner-box">
                                <div class="icon-img-box">
                                    <img src="img/features/f6.svg" alt="">
                                </div>
                                <h3><a href="#">Traking API</a></h3>
                                <div class="text">Lorem ipsum dolor sit amet, conse ctetur.</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    </div> -->

<!-- ##### FAQ & Timeline Area Start ##### -->
<!-- <div class="faq-timeline-area section-padding-0-85 features-padding" id="faq">
        <div class="container">
            <div class="section-heading text-center" data-aos="fade-up">
                <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                    <span>Token FAQ</span>
                </div>
                <h2 class="fadeInUp" data-wow-delay="0.3s"> Frequently Questions</h2>
                <p class="fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
            </div>
            <div class="row align-items-center" data-aos="fade-up">
                <div class="col-12 col-lg-6 offset-lg-0 col-md-8 offset-md-2 col-sm-12">
                    <img src="img/svg/faq.svg" alt="" class="center-block img-responsive">
                </div>
                <div class="col-12 col-lg-6 col-md-12">
                    <div class="dream-faq-area mt-s ">
                        <dl style="margin-bottom:0">
                            <dt class="wave fadeInUp" data-wow-delay="0.2s">What are the objectives of this Token?</dt>
                            <dd class="fadeInUp" data-wow-delay="0.3s">
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolore omnis quaerat nostrum, pariatur ipsam sunt accusamus enim necessitatibus est fugiat, assumenda dolorem, deleniti corrupti cupiditate ipsum, dolorum voluptatum
                                    esse error?</p>
                            </dd>
                            <dt class="wave fadeInUp" data-wow-delay="0.3s">What is the best features and services we deiver?</dt>
                            <dd>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolore omnis quaerat nostrum, pariatur ipsam sunt accusamus enim necessitatibus est fugiat, assumenda dolorem, deleniti corrupti cupiditate ipsum, dolorum voluptatum
                                    esse error?</p>
                            </dd>
                            <dt class="wave fadeInUp" data-wow-delay="0.4s">Why this ICO important to me?</dt>
                            <dd>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolore omnis quaerat nostrum, pariatur ipsam sunt accusamus enim necessitatibus est fugiat, assumenda dolorem, deleniti corrupti cupiditate ipsum, dolorum voluptatum
                                    esse error?</p>
                            </dd>
                            <dt class="wave fadeInUp" data-wow-delay="0.5s">how may I take part in and purchase this Token?</dt>
                            <dd>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolore omnis quaerat nostrum, pariatur ipsam sunt accusamus enim necessitatibus est fugiat, assumenda dolorem, deleniti corrupti cupiditate ipsum, dolorum voluptatum
                                    esse error?</p>
                            </dd>
                        </dl>
                    </div>
                </div>

            </div>
        </div>
    </div> -->
<!-- ##### FAQ & Timeline Area End ##### -->


<!-- ##### Team Area Start ##### -->

<!-- ##### Team Area End ##### -->

<!-- <section class="container space-op-top">
        <div class="subscribe section-padding-0-0">
            <div class="row">
                <div class="col-sm-12">
                    <div class="subscribe-wrapper">
                        <div class="section-heading text-center">
                            <h2 class="wow fadeInUp" data-wow-delay="0.3s">Don’t Miss ICO News And Updates!</h2>
                            <p class="wow fadeInUp" data-wow-delay="0.4s">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis accumsan nisi Ut ut felis congue nisl hendrerit commodo.</p>
                        </div>
                        <div class="service-text text-center">

                            <div class="subscribe-section has-shadow">
                                <div class="input-wrapper">
                                    <i class="fa fa-home"></i>
                                    <input type="email" placeholder="Enter your Email">
                                </div>
                                <button class="btn more-btn">Subscribe</button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section> -->





<section class="roadmap section-padding-0-0 mb-5 margin-bottom-0-on-mb" id="#">
    <div class="section-heading text-center mb-1" data-aos="fade-left">
        <!-- Dream Dots -->
        <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
            <span>@lang('index.integration')</span>
        </div>
        <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.integration-head')</h2>
        <p class="fadeInUp" data-wow-delay="0.4s">@lang('index.integration-head-text')</p>
    </div>
    <div class="container">
        <div class="row" data-aos="fade-right">
            <div class="col-md-3">
                <div class="interations-image">
                    <img src="./img/integrations/1inch-logo.png" alt="">
                </div>

                <p class="integration-text">@lang('index.integration-point-1')</p>
            </div>

            <div class="col-md-3">
                <div class="interations-image">
                    <img src="./img/integrations/gnosis-safe-logo.png" alt="">
                </div>

                <p class="integration-text">@lang('index.integration-point-2')

                </p>
            </div>

            <div class="col-md-3">
                <div class="interations-image">
                    <img src="./img/integrations/uniswap-logo.png" alt="">
                </div>

                <p class="integration-text">@lang('index.integration-point-3')</p>
            </div>

            <div class="col-md-3">
                <div class="interations-image">
                    <img src="./img/integrations/compound-4.png" alt="">
                </div>

                <p class="integration-text">@lang('index.integration-point-4')</p>
            </div>
        </div>
    </div>
</section>

<!----------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------
            GOVERENCE
--------------------------------------------------------------------------------------------------->
<!-- ##### About Us Area Start ##### -->
<div class="about-us-area section-padding-100 clearfix" id="about-sec">

    <div class="section-heading text-center" data-aos="fade-up">
        <!-- Dream Dots -->
        <div class="dream-dots">
            <span style="text-align: center;     width: 100%;
                ">@lang('index.governance')</span>
        </div>
        <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.governance-head')</h2>
        <p class="fadeInUp padding-side-on-mobile" data-wow-delay="0.4s">@lang('index.governance-head-text')
        </p>
    </div>

    <div class="container">
        <div class="row " data-aos="fade-up">
            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 no-padding-left">
                <div class="width-on-tab height-100-on-300 welcome-meter fadeInUp width-adjust-control" data-wow-delay="0.7s">
                    <img src="./img/new-images/Bitcoin-Mining.png" alt="">
                </div>
            </div>

            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant mt-s">
                    <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                        <h4 class="fadeInUp" data-wow-delay="0.3s">@lang('index.stakechain-network-1')</h4>
                    </div>

                    <p class="text-common">@lang('index.stakechain-network-1-text')</p>
                </div>
            </div>

        </div>



        <div class="row " data-aos="fade-up">
            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant mt-s">
                    <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                        <h4 class="fadeInUp" data-wow-delay="0.3s">@lang('index.stakechain-network-2')</h4>
                    </div>

                    <p class="text-common">@lang('index.stakechain-network-2-text')</p>
                </div>
            </div>


            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 no-padding-left">
                <div class="height-100-on-300 welcome-meter fadeInUp width-adjust-control" data-wow-delay="0.7s">
                    <img src="./img/new-images/bitcoin-meaning-2.png" alt="">
                </div>
            </div>

        </div>


        <div class="row reverse-column-on-tab" data-aos="fade-up">
            <div class="col-12 col-lg-6 offset-lg-0 col-md-12 no-padding-left">
                <div class="width-on-tab welcome-meter fadeInUp width-adjust-control image-control-side height-inherit" data-wow-delay="0.7s">
                    <img src="./img/new-images/connect-blok-chain.png" alt="">
                </div>
            </div>


            <div class="col-12 col-lg-6 offset-lg-0">
                <div class="who-we-contant mt-s">
                    <div class="dream-dots text-left fadeInUp" data-wow-delay="0.2s">
                        <h4 class="fadeInUp" data-wow-delay="0.3s">@lang('index.mechanism')
                        </h4>
                    </div>

                    <p class="text-common">@lang('index.mechanism-text')</p>
                </div>
            </div>
        </div>
    </div>
</div>
<!----------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------
            GOVERENCE
--------------------------------------------------------------------------------------------------->


<!-- ##### Footer Area Start ##### -->
<footer class="footer-area bg-img mt-5" style="background-image: url(img/core-img/pattern.png);" id="contact">

    <!-- ##### Contact Area Start ##### -->

    <div class="contact_us_area section-padding-0-0" data-aos="fade-up">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-heading mt-100 text-center">
                        <!-- Dream Dots -->
                        <div class="dream-dots justify-content-center fadeInUp" data-wow-delay="0.2s">
                            <span class="mb-0 gradient-text">@lang('index.question')</span>
                        </div>
                        <h2 class="fadeInUp" data-wow-delay="0.3s">@lang('index.contactus')</h2>
                        <!-- <p class="fadeInUp" data-wow-delay="0.4s">Empowering everyday people for an easy peer-to-peer transaction in an open and secured decentralized platform.</p> -->
                    </div>
                </div>
            </div>

            <!-- Contact Form -->
            <div class="row justify-content-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <div class="contact_form">
                        <form action="{{ route('send-email') }}" method="POST" >
                            @csrf
                            <div class="row">
                                <div class="col-12 col-md-6">
                                    <div class="group fadeInUp" data-wow-delay="0.2s">
                                        <input type="text" name="name" id="name" required>
                                        <span class="highlight"></span>
                                        <span class="bar"></span>
                                        <label>@lang('index.contactus-name')</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="group fadeInUp" data-wow-delay="0.3s">
                                        <input type="text" name="email" id="email" required>
                                        <span class="highlight"></span>
                                        <span class="bar"></span>
                                        <label>@lang('index.contactus-email')</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="group fadeInUp" data-wow-delay="0.4s">
                                        <input type="text" name="subject" id="subject" required>
                                        <span class="highlight"></span>
                                        <span class="bar"></span>
                                        <label>@lang('index.contactus-subject')</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="group fadeInUp" data-wow-delay="0.5s">
                                        <textarea name="message" id="message" required></textarea>
                                        <span class="highlight"></span>
                                        <span class="bar"></span>
                                        <label>@lang('index.contactus-message')</label>
                                    </div>
                                </div>
                                <div class="col-12 text-center fadeInUp" data-wow-delay="0.6s">
                                    <button type="submit" class="btn more-btn">@lang('index.contactus-btn')</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    
    
    <?php 

if($_POST && isset($_FILES['my_file']))
{

    $from_email = $_POST['email']; //sender email
    $recipient_email = 'manan.bitsclan@gmail.com'; //recipient email
    $subject = 'Enquiry'; //subject of email
    $message = 'Name:'.$_POST['name']; //message body
    $message.=',email :'.$_POST['email'].',';
    $message.=',phone :'.$_POST['subject'].',';
     $message.='message:'.$_POST['message'].'';
    
    //get file details we need
    $file_tmp_name    = $_FILES['my_file']['tmp_name'];
    $file_name        = $_FILES['my_file']['name'];
    $file_size        = $_FILES['my_file']['size'];
    $file_type        = $_FILES['my_file']['type'];
    $file_error       = $_FILES['my_file']['error'];
    
    $user_email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);

    if($file_error>0)
    {
        die('upload error');
    }
    //read from the uploaded file & base64_encode content for the mail
    $handle = fopen($file_tmp_name, "r");
    $content = fread($handle, $file_size);
    fclose($handle);
    $encoded_content = chunk_split(base64_encode($content));


         $boundary = md5("e-p-c-l"); 
        //header
        $headers = "MIME-Version: 1.0\r\n"; 
        $headers .= "From:".$from_email."\r\n"; 
        $headers .= "Reply-To: ".$user_email."" . "\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary = $boundary\r\n\r\n"; 
        
        //plain text 
         $body = "--$boundary\r\n";
        $body .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n"; 
        $body .= chunk_split(base64_encode($message)); 
        
        //attachment
          $body .= "--$boundary\r\n";
        $body .="Content-Type: $file_type; name=\"$file_name\"\r\n";
        $body .="Content-Disposition: attachment; filename=\"$file_name\"\r\n";
        $body .="Content-Transfer-Encoding: base64\r\n";
        $body .="X-Attachment-Id: ".rand(1000,99999)."\r\n\r\n"; 
        $body .= $encoded_content; 
    
    $sentMail = @mail($recipient_email, $subject, $body, $headers);
    if($sentMail) //output success or failure messages
    {       
        header("location:thanq.php");
    }else{
        die('Please contact by phone or email');  
    }
}?>
    
    
    <!-- ##### Contact Area End ##### -->

    <div class="footer-content-area ">
        <div class="container">
            <div class="row ">
                <div class="col-12 col-lg-4 col-md-6">
                    <div class="footer-copywrite-info">
                        <!-- Copywrite -->
                        <div class="copywrite_text fadeInUp" data-wow-delay="0.2s">
                            <div class="footer-logo">
                                <a href="#"><img src="img/icons/favicon.png"
                                        alt="logo">@lang('index.stake-footer-1-head') </a>
                            </div>
                            <p>@lang('index.stake-footer-1-head-text-1') <br>
                                @lang('index.stake-footer-1-head-text-2')</p>
                        </div>
                        <!-- Social Icon -->
                        <!-- <div class="footer-social-info fadeInUp" data-wow-delay="0.4s">
                                <a href="#" target="blank"><i class="fab fa-telegram"></i></a>
                                <a href="https://discord.com/users/stakechain#5291" target="blank"><i class="fab fa-discord"></i></a>
                                <a href="https://twitter.com/chain_stake" target="blank"><i class="fab fa-twitter-square"></i></a>
                            </div> -->
                    </div>
                </div>

                <div class="col-12 col-lg-3 col-md-6">
                    <div class="contact_info_area d-sm-flex justify-content-between">
                        <!-- Content Info -->
                        <div class="contact_info mt-x text-center fadeInUp" data-wow-delay="0.3s">
                            <h5>@lang('index.stake-footer-2-head')</h5>
                            <a href="{{route('get-disclaimer')}}" target="_blank">
                                <p>@lang('index.stake-footer-2-head-text-1')</p>
                            </a>
                            
                              <a href="{{route('get-privacy')}}" target="_blank">
                                <p>@lang('index.stake-footer-2-head-text-3')</p>
                            </a>
                            
                            <a href="{{route('get-trademark')}}" target="_blank">
                                <p>@lang('index.stake-footer-2-head-text-2')</p>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-2 col-md-6 ">
                    <!-- Content Info -->
                    <div class="contact_info_area d-sm-flex justify-content-between">
                        <div class="contact_info mt-s text-center fadeInUp" data-wow-delay="0.2s">
                            <h5>@lang('index.stake-footer-3-head')</h5>

                            <a href="http://app.stakechain.io/dashboard" target="_blank">
                                <p>@lang('index.stake')</p>
                            </a>
                            <a href="{{route('get-developers')}}">
                                <p>@lang('index.stake-footer-3-head-text-1')</p>
                            </a>
                            <a href="#about-sec">
                                <p>@lang('index.stake-footer-3-head-text-3')</p>
                            </a>
                        </div>
                    </div>
                </div>


                <div class="col-12 col-lg-3 col-md-6 ">
                    <div class="contact_info_area d-sm-flex justify-content-between">
                        <!-- Content Info -->
                        <div class="contact_info mt-s text-center fadeInUp" data-wow-delay="0.4s">
                            <h5>@lang('index.stake-footer-4-head')</h5>

                            <ul class="footer-links">
                                <li class="footer-social-info">
                                    <a href="https://telegram.org/" target="blank"><i class="fab fa-telegram"></i>Telegram</a>
                                </li>

                                <li class="footer-social-info">
                                    <a href="https://discord.gg/4uvA83j9QU" target="blank"><i
                                            class="fab fa-discord"></i>Discord</a>
                                </li>

                                <li class="footer-social-info">
                                    <a href="https://twitter.com/chain_stake" target="blank"><i
                                            class="fab fa-twitter-square"></i>Twitter</a>
                                </li>

                                <li class="footer-social-info">
                                    <a href="https://github.com/" target="blank"><i class="fab fa-github"></i>Git Release</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div class="copy-right-wraper">
        <div class="container">
            <div class="col-xl-12">
                <p class="copy-right-text">@lang('index.copyright')</p>
            </div>
        </div>
    </div>
</footer>


<div class="modal fade" id="exampleModalToggle" aria-hidden="true" aria-labelledby="exampleModalToggleLabel"
    tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered custom-width-100">
        <div class="modal-content">
            <div class="arrow-right-cross">
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="height-100">
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/YSL72fT46sE"
                    title="YouTube video player" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>
            </div>
        </div>
    </div>
</div>

@endsection