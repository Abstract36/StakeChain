<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800;900&display=swap">
    {{-- <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800;900&display=swap');

        body {
            font-family: 'Poppins', sans-serif !important;
            background-color: LightGray;
        }
    </style> --}}
</head>
<body style="font-family: 'Poppins', sans-serif !important;">
    <div style="max-width: 540px;margin: 0 auto;">
        <div style="text-align: center;margin-top: 18px;margin-bottom: 18px;">
            <img src="https://stakechain.io/img/icons/favicon.png">
        </div>
        <div style="padding: 48px;background-color: LightGray;">
            <h4 style="font-size: 16px;font-weight: 600;color: #626262;margin-top: 0px;
			margin-bottom: 0px;">Hello</h4>
            <p style="color: #626262;font-size: 14px;">You have a new contact email from website.</p>
            <table class="table" style="width: 100%">
                <tr>
                    <th>
                        <h4 style="color: #ff5850;margin-top: 0px;margin-bottom:8px; width:30%; text-align:left">Name:
                        </h4>
                    </th>
                    <td style="color: #626262;font-size: 14px;">{{ $data['name'] }}</td>
                </tr>
                <tr>
                    <th>
                        <h4 style="color: #ff5850;margin-top: 0px;margin-bottom:8px; width:30%; text-align:left">Email:
                        </h4>
                    </th>
                    <td style="color: #626262;font-size: 14px;">{{ $data['email'] }}</td>
                </tr>
            </table>
            <h4 style="color: #ff5850;margin-top: 0px;margin-bottom:8px; ">Description:</h4>
            <p style="color: #626262;font-size: 14px;">{{ $data['message'] }}</p>
            <hr style="border-color: #ffffff57;margin-top: 32px;margin-bottom: 32px;">
            <p style="color: #626262;font-size: 14px;">Thanks,</p>
            <p style="color: #626262;font-size: 14px;margin-bottom: 0px;">The Support Team</p>
        </div>
        <div style="margin-top:22px;">
            <div style="padding-left: 18px;padding-right: 18px;text-align: center;margin-top: 12px;">
                <small style="color:rgba(38, 50, 56);font-size: 12px;">Use of our service and website is subject to our
                    <a href="https://stakechain.io/privacy" style="color: #7367f0;">Terms of Use</a> and <a
                        href="https://stakechain.io/privacy" style="color: #7367f0;">Privacy
                        Policy</a>.</small>
                <div class="">
                    <small><a href="https://stakechain.io/" style="color: #7367f0;">stakechain.io</a></small>
                </div>
            </div>
        </div>
    </div>
</body>
</html>