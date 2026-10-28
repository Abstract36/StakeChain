<!DOCTYPE html>
<html lang="zxx">

<head>
    <meta charset="UTF-8">
    <meta name="description" content="">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- animation scroll -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

    <link rel="stylesheet" href="./css/jquery.localizationTool.css">

    <link href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" rel="stylesheet">
    <!-- BOOTSTRAP 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Title -->
    <title>StakeChain</title>

    <!-- Favicon -->
    <link rel="icon" href="./img/icons/favicon.png">

    <link href="https://fonts.googleapis.com/css?family=Poppins:200,300,400,500,600,700" rel="stylesheet">

    <!-- Core Stylesheet -->
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <!-- <link rel="stylesheet" href="css/animate.css"> -->
    <link rel="stylesheet" href="css/owl.carousel.min.css">
    <link rel="stylesheet" href="css/magnific-popup.css">
    <link rel="stylesheet" href="css/font-awesome.min.css">
    <link rel="stylesheet" href="css/themify-icons.css">

    <!-- Core Stylesheet -->
    <link rel="stylesheet" href="css/style.css">

    <!-- Responsive Stylesheet -->
    <link rel="stylesheet" href="css/responsive.css">

</head>


<body class="darker">
 
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
                    <a class="nav-link" href="https://stakechain.io/">@lang('index.home')</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link about-btn-click" href="#about-sec">@lang('index.aboutus')</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link feature-click-btn" href="#services">@lang('index.feature')</a>
                </li>
                <!-- <li class="nav-item">
                        <a class="nav-link" href="#faq">FAQ</a>
                    </li> -->

                <li class="nav-item">
                    <a class="nav-link contact-click-btn" href="#contact">@lang('index.contact')</a>
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
 <div class='main-wraper-disclaimer'>
 <div class='container'>
     <div class='row'>
         <div class='col-md-12'>
             <h1 class='main-text-heading'>@lang('index.disclaimer')</h1>
             <div>
             <p>@lang('index.disclaimer-text-1') 
</p> <br>

<p><strong>@lang('index.disclaimer-text-2-s')</strong>
</p><p>@lang('index.disclaimer-text-2')</p> <br>
<p><i>@lang('index.disclaimer-text-3-i-1') <br> <br>
@lang('index.disclaimer-text-3-i-2')
</i>@lang('index.disclaimer-text-3-i-1')</p> <br>
<p>@lang('index.disclaimer-text-4')</p> <br>
<p><strong>@lang('index.disclaimer-text-5') </strong></p> <br>
</div>
         </div>
     </div>
 </div>
 </div>
 
 
 <!-- ##### Footer Area Start ##### -->
<footer class="footer-area bg-img mt-5" style="background-image: url(img/core-img/pattern.png);">


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
                            <a href="{{route('get-developers')}}" target="_blank">
                                <p>@lang('index.stake-footer-3-head-text-1')</p>
                            </a>
                            <a class="about-btn-click" href="#about-sec">
                                <p>@lang('index.stake-footer-3-head-text-3')</p>
                            </a>
                        </div>
                    </div>
                </div>
                
               <script>
    var x =  document.querySelectorAll('.about-btn-click');
    x.forEach(element => {
        element.addEventListener('click' , function(){
            window.location.assign('https://stakechain.io/#about-sec');
        });
    });
    
    document.querySelector('.feature-click-btn').addEventListener('click' , function(){
            window.location.assign('https://stakechain.io/#services');
        });
          document.querySelector('.contact-click-btn').addEventListener('click' , function(){
            window.location.assign('https://stakechain.io/#contact');
        });
</script>


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
 

    <!-- ##### Footer Area End ##### -->

    <!-- ########## All JS ########## -->
    <!-- animation js -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init();
    </script>
    <!-- jQuery js -->
    <script src="js/jquery.min.js"></script>

    <!-- Popper js -->
    <script src="js/popper.min.js"></script>
    <!-- Bootstrap js -->
    <script src="js/bootstrap.min.js"></script>
    <!-- All Plugins js -->
    <script src="js/plugins.js"></script>
    <!-- Parallax js -->
    <script src="js/dzsparallaxer.js"></script>

    <script src="js/jquery.syotimer.min.js"></script>

    <!-- script js -->
    <script src="js/script.js"></script>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="./js/jquery.localizationTool.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>

</body>

</html>