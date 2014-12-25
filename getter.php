<?php
$address = $_POST['poa-mn'];
$user = $_POST['user-name'];
$password = $_POST['user-password'];
$useHttps = $_POST['use-https'];
$getToken = <<<'token'
<?xml version='1.0'?>
<methodCall>
    <methodName>pem.APS.getUserToken</methodName>
    <params>
        <param>
            <value>
                <struct>
                    <member>
                        <name>user_id</name>
                        <value>
                            <i4>1</i4>
                        </value>
                    </member>
                </struct>
            </value>
        </param>
    </params>
</methodCall>
token;

$getTypes = <<<'token'
token;

$url = 'http'.($useHttps?'s':'')."://${address}:8440/RPC2";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERPWD, "${user}:${password}");
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: text/xml'));
curl_setopt($ch, CURLOPT_POSTFIELDS, $getToken);
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
	echo json_encode(array("code" => $code, "message" => 'Error while getting APS token'));
	http_response_code(500);
	exit(1);
}

preg_match('/<name>aps_token<\/name><value><string>([^<]*)</', $response, $APSToken);

$APSToken = $APSToken[1];

$url = "http://${address}:8080/aps/2/types/";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('APS-Token: '.$APSToken));
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
	echo json_encode(array("code" => $code, "message" => 'Error while requesting APS types'));
	http_response_code(500);
	exit(1);
}

echo $response;
