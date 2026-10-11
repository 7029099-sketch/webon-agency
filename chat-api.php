<?php
// WebON Agency private chat bridge. PHP 7.4+. Config must live outside webroot.
// Requires /home/ACCOUNT/webon-chat-config.php with bot_token, chat_id, webhook_secret.
// Telegram webhook: https://webon.agency/chat-api.php?hook=WEBHOOK_SECRET
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond($body, $status=200) { http_response_code($status); echo json_encode($body,JSON_UNESCAPED_UNICODE); exit; }
$configFile=dirname(dirname(__DIR__)).'/webon-chat-config.php';
$config=is_file($configFile)?require $configFile:null;
if(!is_array($config)) $config=[];
$bot=(string)($config['bot_token']??'');
$chat=(string)($config['chat_id']??'');
$secret=(string)($config['webhook_secret']??'');
$ready=$bot!==''&&$chat!==''&&$secret!==''&&function_exists('curl_init');
$storage=dirname(dirname(__DIR__)).'/webon-chat-data';
// Owner-only webhook setup. The private key is submitted via POST, never in a URL.
if(($_SERVER['REQUEST_METHOD']??'')==='POST' && isset($_GET['webhook_admin'])) {
  $input=json_decode((string)file_get_contents('php://input'),true);
  $provided=is_array($input)?(string)($input['setup_key']??''):'';
  if(!$ready || $provided==='' || !hash_equals($secret,$provided)) respond(['ok'=>false,'error'=>'Invalid setup key or incomplete bot settings'],403);
  $action=(string)($input['action']??'status');
  if(!in_array($action,['status','install'],true))respond(['ok'=>false,'error'=>'Unsupported action'],400);
  $method=$action==='install'?'setWebhook':'getWebhookInfo';
  $endpoint='https://api.telegram.org/bot'.$bot.'/'.$method;
  $h=curl_init($endpoint);
  $args=$action==='install'?[
    'url'=>'https://webon.agency/chat-api.php?hook=1',
    'secret_token'=>hash('sha256',$secret),
    'allowed_updates'=>json_encode(['message'])
  ]:[];
  curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($args),CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>15,CURLOPT_SSL_VERIFYPEER=>true]);
  $raw=curl_exec($h);$http=(int)curl_getinfo($h,CURLINFO_HTTP_CODE);curl_close($h);
  $d=is_string($raw)?json_decode($raw,true):null;
  if($http!==200 || !is_array($d) || empty($d['ok'])) respond(['ok'=>false,'error'=>'Telegram API rejected webhook request','telegram_status'=>$http],502);
  if($action==='status') {
    $info=$d['result']??[];
    respond(['ok'=>true,'installed'=>($info['url']??'')==='https://webon.agency/chat-api.php?hook=1','pending_updates'=>$info['pending_update_count']??0,'last_error_message'=>$info['last_error_message']??null]);
  }
  respond(['ok'=>true,'installed'=>true]);
}
if(($_SERVER['REQUEST_METHOD']??'GET')==='GET' && isset($_GET['setup'])) respond(['ok'=>false,'error'=>'Use POST webhook_admin setup'],405);
if(($_SERVER['REQUEST_METHOD']??'')==='POST' && isset($_GET['discover'])) {
  $input=json_decode((string)file_get_contents('php://input'),true);
  $provided=is_array($input)?(string)($input['setup_key']??''):'';
  if($bot==='' || $secret==='' || !hash_equals($secret,$provided) || !function_exists('curl_init')) respond(['ok'=>false,'error'=>'Invalid setup key or bot configuration'],403);
  $h=curl_init('https://api.telegram.org/bot'.$bot.'/getUpdates');
  curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query(['timeout'=>0,'limit'=>100,'allowed_updates'=>json_encode(['message','my_chat_member'])]),CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_SSL_VERIFYPEER=>true]);
  $raw=curl_exec($h);$http=(int)curl_getinfo($h,CURLINFO_HTTP_CODE);curl_close($h);
  $data=is_string($raw)?json_decode($raw,true):null;
  if($http!==200 || !is_array($data) || empty($data['ok']))respond(['ok'=>false,'error'=>'Telegram updates unavailable; webhook may already be active'],502);
  $groups=[];
  foreach(($data['result']??[]) as $update) {
    $m=$update['message']??($update['my_chat_member']??[]);
    $c=$m['chat']??[];
    if(in_array(($c['type']??''),['group','supergroup'],true)) {
      $id=(string)($c['id']??'');
      if($id!=='')$groups[$id]=['id'=>$id,'title'=>(string)($c['title']??''),'type'=>(string)($c['type']??'')];
    }
  }
  respond(['ok'=>true,'groups'=>array_values($groups),'hint'=>count($groups)?'Copy the ID for WebON Agency':'Send /start addressed to the bot inside the group, then retry']);
}
if(($_SERVER['REQUEST_METHOD']??'GET')==='GET' && !isset($_GET['messages'])) respond(['ok'=>true,'ready'=>$ready]);
if(!$ready) respond(['ok'=>false,'error'=>'Chat is not configured'],503);
if(!is_dir($storage) && !@mkdir($storage,0700,true)) respond(['ok'=>false,'error'=>'Chat storage unavailable'],503);
function load_json($path) { if(!is_file($path))return []; $r=json_decode((string)@file_get_contents($path),true);return is_array($r)?$r:[]; }
function save_json($path,$data) { return @file_put_contents($path,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),LOCK_EX)!==false; }
function telegram($token,$args) {
  $h=curl_init('https://api.telegram.org/bot'.$token.'/sendMessage');
  curl_setopt_array($h,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($args),CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_SSL_VERIFYPEER=>true]);
  $r=curl_exec($h);$http=curl_getinfo($h,CURLINFO_HTTP_CODE);curl_close($h);
  $d=is_string($r)?json_decode($r,true):null;
  return $http===200 && is_array($d) && !empty($d['ok'])?$d['result']:false;
}
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($method==='POST' && isset($_GET['hook'])) {
  $header=(string)($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']??'');
  $legacy=hash_equals($secret,(string)$_GET['hook']);
  if(!$legacy && !hash_equals(hash('sha256',$secret),$header))respond(['ok'=>false],403);
  $update=json_decode((string)file_get_contents('php://input'),true);
  $m=is_array($update)?($update['message']??[]):[];
  if((string)($m['chat']['id']??'')!==$chat)respond(['ok'=>true]);
  $reply=(int)($m['reply_to_message']['message_id']??0);
  $text=trim((string)($m['text']??''));
  if($reply && $text!=='') {
    $map=load_json($storage.'/map.json');
    $id=$map[(string)$reply]??'';
    if(preg_match('/^[a-f0-9]{64}$/',$id)) {
      $path=$storage.'/'.$id.'.json';
      $session=load_json($path);
      if($session) {
        $session['messages'][]=['from'=>'agent','text'=>mb_cut($text,2000),'time'=>time()];
        save_json($path,$session);
      }
    }
  }
  respond(['ok'=>true]);
}
function mb_cut($text,$limit){return function_exists('mb_substr')?mb_substr($text,0,$limit,'UTF-8'):substr($text,0,$limit);}
if($method==='GET' && isset($_GET['messages'])) {
  $token=(string)($_GET['session']??'');
  if(!preg_match('/^[a-f0-9]{64}$/',$token))respond(['ok'=>false],400);
  $id=hash('sha256',$token);
  $session=load_json($storage.'/'.$id.'.json');
  if(!$session)respond(['ok'=>false],404);
  respond(['ok'=>true,'messages'=>$session['messages']??[]]);
}
if($method!=='POST')respond(['ok'=>false],405);
$body=json_decode((string)file_get_contents('php://input'),true);
if(!is_array($body))respond(['ok'=>false],400);
$text=trim((string)($body['message']??''));
if($text==='' || strlen($text)>3500)respond(['ok'=>false,'error'=>'Message is required (max 2000 characters)'],422);
if(trim((string)($body['website']??''))!=='')respond(['ok'=>true]);
$token=(string)($body['session']??'');
if($token!==''&&!preg_match('/^[a-f0-9]{64}$/',$token))respond(['ok'=>false],400);
if($token==='')$token=bin2hex(random_bytes(32));
$id=hash('sha256',$token);$path=$storage.'/'.$id.'.json';
$session=load_json($path);
if(!$session)$session=['created'=>time(),'messages'=>[],'last'=>0];
if(count($session['messages'])>=100)respond(['ok'=>false,'error'=>'Conversation limit reached'],429);
if(time()-(int)($session['last']??0)<3)respond(['ok'=>false,'error'=>'Please wait a moment'],429);
$text=mb_cut($text,2000);
$replyTo=(int)($session['telegram_message_id']??0);
$args=['chat_id'=>$chat,'text'=>"💬 WebON Agency chat\nID: ".substr($id,0,10)."\n".$text."\n\nReply to this message to answer on the website."];
if($replyTo)$args['reply_to_message_id']=$replyTo;
$sent=telegram($bot,$args);
if(!$sent)respond(['ok'=>false,'error'=>'Message delivery failed'],502);
$telegramId=(int)($sent['message_id']??0);
if(!$telegramId)respond(['ok'=>false,'error'=>'Telegram message id missing'],502);
$session['messages'][]=['from'=>'visitor','text'=>$text,'time'=>time()];
$session['last']=time();$session['telegram_message_id']=$telegramId;
if(!save_json($path,$session))respond(['ok'=>false,'error'=>'Could not save conversation'],503);
$map=load_json($storage.'/map.json');$map[(string)$telegramId]=$id;
if($replyTo)$map[(string)$replyTo]=$id;
save_json($storage.'/map.json',$map);
respond(['ok'=>true,'session'=>$token,'messages'=>$session['messages']]);
