<html lang="ja">

<head>
    <?php include "./meta.html"; ?>
    <script type="module" crossorigin src="./dist/assets/index-DYvebM4T.js"></script>
    <link rel="stylesheet" crossorigin href="./dist/assets/index-C_qc124y.css">
    <title>藝術たしなみマトリクス</title>
</head>

<body>
    <div style="max-height: 100vh; margin:0 auto;">
        <div id="root"></div>

        <?php
        // allow_url_include が無効な環境向け：cURL で取得して出力
        $url = 'https://cf268321.cloudfree.jp/13jellies/asset/html/footer.html';
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            $resp = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($resp !== false && $code === 200) {
                echo $resp;
            } else {
                echo '<footer>Footer unavailable</footer>';
            }
        } else {
            echo '<footer>Footer unavailable</footer>';
        }
        ?>
        <div>testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest</div>
    </div>
</body>

</html>