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
    <link rel="stylesheet" type="text/css"
        href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
    <!-- BOOTSTRAP 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Title -->
    <title>StakeChain</title>

    <!-- Favicon -->
    <link rel="icon" href="{{ asset('./img/icons/favicon.png') }}">

    <link href="https://fonts.googleapis.com/css?family=Poppins:200,300,400,500,600,700" rel="stylesheet">

    <!-- Core Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/bootstrap.min.css') }}">
    <!-- <link rel="stylesheet" href="css/animate.css"> -->
    <link rel="stylesheet" href="{{ asset('css/owl.carousel.min.css') }}">
    <link rel="stylesheet" href="{{ asset('css/magnific-popup.css') }}">
    <link rel="stylesheet" href="{{ asset('css/font-awesome.min.css') }}">
    <link rel="stylesheet" href="{{ asset('css/themify-icons.css') }}">

    <!-- Core Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">

    <!-- Responsive Stylesheet -->
    <link rel="stylesheet" href="{{ asset('css/responsive.css') }}">

</head>


<body class="darker">

    <!-- ##### Footer Area End ##### -->

    <!-- ########## All JS ########## -->
    <!-- animation js -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
    AOS.init();
    </script>
    <!-- jQuery js -->
    <script src="{{ asset('js/jquery.min.js') }}"></script>
    <!-- Popper js -->
    <script src="{{ asset('js/popper.min.js') }}"></script>
    <!-- Bootstrap js -->
    <script src="{{ asset('js/bootstrap.min.js') }}"></script>
    <!-- All Plugins js -->
    <script src="{{ asset('js/plugins.js') }}"></script>
    <!-- Parallax js -->
    <script src="{{ asset('js/dzsparallaxer.js') }}"></script>

    <script src="{{ asset('js/jquery.syotimer.min.js') }}"></script>

    <!-- script js -->
    <script src="{{ asset('js/script.js') }}"></script>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="./js/jquery.localizationTool.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js"></script>
    @yield('content')
    @if(Session('status'))
    <script>
    toastr.options = {
        "closeButton": true,
        "progressBar": true
    }
    toastr.success("{{Session('status')}}");
    </script>
    @endif
</body>

<style>
.navbar-dark .navbar-toggler, .navbar-white .navbar-toggler, .navbar-cyan .navbar-toggler {
    background: #030239;
    border-color: #333;
}

    @media(max-width: 430px){
        .custom-width-100 {
    max-width: 80% !important;
    /* height: 600px !important; */
    margin: 0 auto !important;
}
    .welcome-content h1 {
    font-size: 26px !important;
}
.section-padding-100 {
    padding-top: 30px;
    /* padding-bottom: 100px; */
}
.space-op-top {
    padding: 30px 0;
}
.features-padding {
    padding: 30px 0 0 0;
}
.height-inherit{
    margin-top: 60px !important;
    height: inherit;
}
.section-heading {
    margin-bottom: 0;
}
.features-image {
    width: 100%;
    height: inherit;
    margin: 30px 0;
}
.width-adjust-control img {
    width: 100%;
    height: inherit;
    object-fit: contain;
}
.mt-100 {
    margin-top: 10px;
}
.features-image img {
    height: auto;
}
.features-image {
    width: 100%;
    height: auto !important;
    margin: 0 auto;
}
.height-100-on-300{
    height: 100%;
}
.navbar-brand {
    color: #000;
}
.country-drop-down {
    height: 55px;
}
.margin-bottom-0-on-mb{
    margin-bottom: 0 !important;
}
.discord-icon a img,
.telegram-icon a img{
    width: 60px;
    z-index: 999;
}
.modal-content {
    height: 400px;
    /* background-color: transparent; */
}
.padding-side-on-mobile{
    padding: 0 20px;
}
.margin-tb-bt{
    margin: 20px 0 !important;
}
.mt-on-mobile{
    margin-top: 30px !important;
}
}

@media(max-width: 870px){
    .country-drop-down{
        height: 45px;
    }
    .width-on-tab{
        width: 80% !important;
        margin: 0 auto;
    }
    .features-image {
    height: auto !important;
}
.space-op-top {
    padding: 50px 0;
}
.width-on-tab-second{
    width: 60% !important;
}

.reverse-column-on-tab{
    flex-direction: column-reverse;
}
}
</style>



</html>