<?php
// Central lead endpoint for WebON / VideoLive / LiveON. PHP 7.4+.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function webon_json($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function webon_clean($value, $maxLen = 4000) {
    if (is_array($value) || is_object($value)) return '';
    $s = trim((string)$value);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s);
    if ($s === null) $s = '';
    if (function_exists('mb_substr')) return mb_substr($s, 0, $maxLen, 'UTF-8');
    return substr($s, 0, $maxLen);
}
function webon_input() {
    $data = $_POST;
    $ctype = strtolower(isset($_SERVER['CONTENT_TYPE']) ? (string)$_SERVER['CONTENT_TYPE'] : '');
    if (!$data && strpos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ? $raw : '', true);
        if (is_array($json)) $data = $json;
    }
    return is_array($data) ? $data : array();
}
function webon_first($data, $keys, $default = '') {
    foreach ($keys as $k) {
        if (array_key_exists($k, $data)) {
            $v = webon_clean($data[$k]);
            if ($v !== '') return $v;
        }
    }
    return $default;
}
function webon_find_array_value($value, $wantedKeys) {
    if (!is_array($value)) return null;
    foreach ($value as $k => $v) {
        $nk = strtolower((string)$k);
        if (in_array($nk, $wantedKeys, true) && !is_array($v) && !is_object($v)) {
            $s = trim((string)$v);
            if ($s !== '') return $s;
        }
        if (is_array($v)) {
            $found = webon_find_array_value($v, $wantedKeys);
            if ($found !== null) return $found;
        }
    }
    return null;
}
function webon_storage_dir() {
    $dir = dirname(__DIR__) . '/private-leads';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return is_dir($dir) ? $dir : '';
}
function webon_append_record($record) {
    $dir = webon_storage_dir();
    if ($dir === '') return false;
    $file = $dir . '/leads.jsonl';
    $line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    return @file_put_contents($file, $line, FILE_APPEND | LOCK_EX) !== false;
}
function webon_uuid() {
    try { $bytes = random_bytes(16); }
    catch (Exception $e) { $bytes = openssl_random_pseudo_bytes(16); }
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
}
function webon_config() {
    $configPath = __DIR__ . '/telegram-config.php';
    if (!is_file($configPath)) return array('', '', false);
    $beforeVars = array_keys(get_defined_vars());
    $returnedConfig = include $configPath;
    $afterVars = get_defined_vars();
    $token = '';
    $chatId = '';
    foreach (array('TELEGRAM_BOT_TOKEN','BOT_TOKEN','TG_BOT_TOKEN','TELEGRAM_TOKEN') as $c) {
        if (defined($c) && trim((string)constant($c)) !== '') { $token = trim((string)constant($c)); break; }
    }
    foreach (array('TELEGRAM_CHAT_ID','CHAT_ID','TG_CHAT_ID','TELEGRAM_TARGET_CHAT_ID') as $c) {
        if (defined($c) && trim((string)constant($c)) !== '') { $chatId = trim((string)constant($c)); break; }
    }
    if (is_array($returnedConfig)) {
        if ($token === '') { $v = webon_find_array_value($returnedConfig, array('token','bot_token','telegram_token','telegram_bot_token')); if ($v !== null) $token = $v; }
        if ($chatId === '') { $v = webon_find_array_value($returnedConfig, array('chat_id','chatid','telegram_chat_id','target_chat_id')); if ($v !== null) $chatId = $v; }
    }
    if ($token === '') {
        foreach (array('WEBON_TELEGRAM_BOT_TOKEN','botToken','bot_token','telegramToken','telegram_token','telegramBotToken','telegram_bot_token','token') as $v) {
            if (isset($afterVars[$v]) && is_scalar($afterVars[$v]) && trim((string)$afterVars[$v]) !== '') { $token = trim((string)$afterVars[$v]); break; }
        }
    }
    if ($chatId === '') {
        foreach (array('WEBON_TELEGRAM_CHAT_ID','chatId','chat_id','telegramChatId','telegram_chat_id','targetChatId','target_chat_id') as $v) {
            if (isset($afterVars[$v]) && is_scalar($afterVars[$v]) && trim((string)$afterVars[$v]) !== '') { $chatId = trim((string)$afterVars[$v]); break; }
        }
    }
    if ($token === '' || $chatId === '') {
        foreach ($afterVars as $name => $value) {
            if (in_array($name, $beforeVars, true) || !is_array($value)) continue;
            if ($token === '') { $v = webon_find_array_value($value, array('token','bot_token','telegram_token','telegram_bot_token')); if ($v !== null) $token = $v; }
            if ($chatId === '') { $v = webon_find_array_value($value, array('chat_id','chatid','telegram_chat_id','target_chat_id')); if ($v !== null) $chatId = $v; }
        }
    }
    if ($token === '' || $chatId === '') {
        $raw = (string)@file_get_contents($configPath);
        if ($token === '' && preg_match('/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/', $raw, $m)) $token = $m[0];
        if ($chatId === '' && preg_match('~chat[_-]?id[^\r\n0-9-]*(-?\d{5,})~i', $raw, $m)) $chatId = $m[1];
    }
    return array($token, $chatId, true);
}
function webon_send_telegram($token, $chatId, $message) {
    if ($token === '' || $chatId === '') return false;
    $apiBase = getenv('WEBON_TELEGRAM_API_BASE');
    if (!$apiBase) $apiBase = 'https://api.telegram.org/bot';
    $apiUrl = rtrim($apiBase, '/') . $token . '/sendMessage';
    $payload = http_build_query(array('chat_id' => $chatId, 'text' => $message), '', '&', PHP_QUERY_RFC3986);
    $http = 0; $body = '';
    if (function_exists('curl_init')) {
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
        $body = (string)curl_exec($ch);
        $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(array('http' => array('method'=>'POST','header'=>"Content-Type: application/x-www-form-urlencoded\r\n",'content'=>$payload,'timeout'=>15,'ignore_errors'=>true)));
        $body = (string)@file_get_contents($apiUrl, false, $ctx);
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $h) if (preg_match('#^HTTP/\S+\s+(\d+)#', $h, $m)) { $http = (int)$m[1]; break; }
        }
    }
    $json = json_decode($body, true);
    return ($http >= 200 && $http < 300 && is_array($json) && isset($json['ok']) && $json['ok'] === true);
}

$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST' && $method !== 'GET') webon_json(array('ok'=>false,'error'=>'Method not allowed'), 405);

list($tgToken, $tgChatId, $configFound) = webon_config();
if ($method === 'GET') {
    webon_json(array(
        'ok'=>true,
        'service'=>'WebON Leads',
        'method'=>'POST',
        'config_found'=>$configFound,
        'telegram_ready'=>($tgToken !== '' && $tgChatId !== ''),
        'storage_ready'=>(webon_storage_dir() !== ''),
        'curl'=>function_exists('curl_init')
    ));
}

$data = webon_input();
if (webon_first($data, array('website')) !== '') webon_json(array('ok'=>true,'spam'=>true));

$eventType = strtolower(webon_first($data, array('event_type','eventType'), 'lead'));
if (!in_array($eventType, array('lead','contact_click'), true)) $eventType = 'lead';
$name = webon_first($data, array('name','leadName'));
$phone = webon_first($data, array('phone','contact','telegram','leadPhone'));
$brandRaw = webon_first($data, array('brand','site','project'), 'WebON');
$brandMap = array('webon'=>'WebON','videolive'=>'VideoLive','liveon'=>'LiveON');
$brandKey = strtolower(preg_replace('/[^a-z0-9]/i', '', $brandRaw));
$brand = isset($brandMap[$brandKey]) ? $brandMap[$brandKey] : 'WebON';
$service = webon_first($data, array('service','service_name'));
$destination = webon_first($data, array('destination','contact_destination'));
$siteType = webon_first($data, array('site_type','siteType','type'));
$budget = webon_first($data, array('budget'));
$deadline = webon_first($data, array('deadline','when'));
$comment = webon_first($data, array('comment','message','task'));
$package = webon_first($data, array('package','plan'));
$packagePrice = webon_first($data, array('package_price','price'));
$page = webon_first($data, array('page','page_url'), isset($_SERVER['HTTP_REFERER']) ? (string)$_SERVER['HTTP_REFERER'] : '');
$landingPage = webon_first($data, array('landing_page'));
$referrer = webon_first($data, array('referrer'), isset($_SERVER['HTTP_REFERER']) ? (string)$_SERVER['HTTP_REFERER'] : '');
$utmSource = webon_first($data, array('utm_source','source'));
$utmMedium = webon_first($data, array('utm_medium','medium'));
$utmCampaign = webon_first($data, array('utm_campaign','campaign'));
$utmTerm = webon_first($data, array('utm_term','term'));
$utmContent = webon_first($data, array('utm_content','content'));
$gclid = webon_first($data, array('gclid'));
$gbraid = webon_first($data, array('gbraid'));
$wbraid = webon_first($data, array('wbraid'));
$msclkid = webon_first($data, array('msclkid'));
$fbclid = webon_first($data, array('fbclid'));
$device = webon_first($data, array('device'));
$userAgent = webon_first($data, array('user_agent'), isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '');
if ($device === '' && $userAgent !== '') {
    if (preg_match('/iPad|Tablet|PlayBook|Silk/i', $userAgent) || (preg_match('/Android/i', $userAgent) && !preg_match('/Mobile/i', $userAgent))) $device = 'tablet';
    elseif (preg_match('/Mobi|Android|iPhone|iPod/i', $userAgent)) $device = 'mobile';
    else $device = 'desktop';
}
$lang = webon_first($data, array('lang'));
$clientTime = webon_first($data, array('client_time'));

if ($eventType === 'lead' && ($name === '' || $phone === '')) webon_json(array('ok'=>false,'error'=>'Name and online contact are required'), 422);

$source = $utmSource; $medium = $utmMedium;
if ($source === '' && ($gclid !== '' || $gbraid !== '' || $wbraid !== '')) { $source='google'; if ($medium==='') $medium='cpc'; }
if ($source === '' && $msclkid !== '') { $source='bing'; if ($medium==='') $medium='cpc'; }
if ($source === '' && $fbclid !== '') { $source='meta'; if ($medium==='') $medium='social'; }
if ($source === '' && $referrer !== '') {
    $host = parse_url($referrer, PHP_URL_HOST);
    if (is_string($host) && $host !== '') {
        $host = strtolower(preg_replace('/^www\./i', '', $host));
        if (preg_match('/(^|\.)google\./i', $host)) { $source='google'; if ($medium==='') $medium='organic'; }
        elseif (strpos($host,'bing.com')!==false) { $source='bing'; if ($medium==='') $medium='organic'; }
        elseif (strpos($host,'yahoo.')!==false) { $source='yahoo'; if ($medium==='') $medium='organic'; }
        elseif ($host==='chatgpt.com' || $host==='chat.openai.com') { $source='chatgpt'; if ($medium==='') $medium='referral'; }
        elseif (substr($host,-13)==='perplexity.ai') { $source='perplexity'; if ($medium==='') $medium='referral'; }
        elseif ($host==='gemini.google.com') { $source='gemini'; if ($medium==='') $medium='referral'; }
        elseif (preg_match('/(^|\.)(facebook.com|instagram.com)$/i',$host)) { $source='meta'; if ($medium==='') $medium='social'; }
        else { $source=$host; if ($medium==='') $medium='referral'; }
    }
}
if ($source === '') $source = 'direct';
if ($medium === '') $medium = 'none';

$id = webon_uuid();
$serverTime = gmdate('c');
$record = array(
    'id'=>$id,'created_at'=>$serverTime,'client_time'=>$clientTime,'event_type'=>$eventType,'brand'=>$brand,
    'name'=>$name,'phone'=>$phone,'service'=>$service,'destination'=>$destination,'site_type'=>$siteType,
    'budget'=>$budget,'deadline'=>$deadline,'comment'=>$comment,'package'=>$package,'package_price'=>$packagePrice,
    'source'=>$source,'medium'=>$medium,'utm_campaign'=>$utmCampaign,'utm_term'=>$utmTerm,'utm_content'=>$utmContent,
    'gclid'=>$gclid,'gbraid'=>$gbraid,'wbraid'=>$wbraid,'msclkid'=>$msclkid,'fbclid'=>$fbclid,
    'device'=>$device,'lang'=>$lang,'landing_page'=>$landingPage,'page'=>$page,'referrer'=>$referrer,
    'user_agent'=>$userAgent,'ip_hash'=>hash('sha256', (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '') . '|webon-leads-v1')
);
$stored = webon_append_record($record);

if ($eventType === 'contact_click') {
    webon_json(array('ok'=>true,'stored'=>$stored,'id'=>$id,'event_type'=>'contact_click'));
}

// WebON Agency email delivery: set WEBON_AGENCY_LEAD_EMAIL in hosting environment.
// No mailbox credentials or client-provided values are embedded in the repository.
// Only WebON form leads can use this independent email channel.
if ($brand === 'WebON' && $eventType === 'lead') {
    $emailRecipient = trim((string)getenv('WEBON_AGENCY_LEAD_EMAIL'));
    if ($emailRecipient === '') $emailRecipient = '7029099@gmail.com';
    if ($emailRecipient !== '' && filter_var($emailRecipient, FILTER_VALIDATE_EMAIL)) {
        $emailLines = array(
            'New WebON Agency website enquiry',
            'Lead ID: ' . $id,
            'Name: ' . $name,
            'Contact: ' . $phone,
            'Service: ' . $service,
            'Website type: ' . $siteType,
            'Budget: ' . $budget,
            'Deadline: ' . $deadline,
            'Message: ' . $comment,
            'Package: ' . $package,
            'Source: ' . $source,
            'Medium: ' . $medium,
            'Campaign: ' . $utmCampaign,
            'Term: ' . $utmTerm,
            'GCLID: ' . $gclid,
            'Landing: ' . $landingPage,
            'Page: ' . $page,
            'Created at: ' . $serverTime
        );
        $emailBody = implode("\r\n", array_map(function($line) {
            return preg_replace('/[\r\n]+/', ' ', $line);
        }, $emailLines));
        $emailHeaders = array(
            'From: WebON Leads <no-reply@webon.agency>',
            'Content-Type: text/plain; charset=UTF-8',
            'X-Auto-Response-Suppress: All'
        );
        $emailDelivered = @mail($emailRecipient, 'New WebON Agency Lead ' . $id, $emailBody, implode("\r\n", $emailHeaders));
        if ($emailDelivered) {
            webon_json(array('ok'=>true,'stored'=>$stored,'delivered'=>true,'channel'=>'email','id'=>$id,'service'=>'WebON Leads'));
        }
    }
}
if ($tgToken === '' || $tgChatId === '') webon_json(array('ok'=>false,'stored'=>$stored,'id'=>$id,'error'=>'Telegram configuration is incomplete'), 500);

$brandEmoji = ($brand === 'VideoLive') ? '🔴' : (($brand === 'LiveON') ? '🟡' : '🔵');
$lines = array();
$lines[] = $brandEmoji . ' Новая заявка ' . $brand;
$lines[] = '🆔 ' . $id;
$lines[] = '';
$lines[] = '👤 Имя: ' . $name;
$lines[] = '💬 Online contact: ' . $phone;
if ($service !== '') $lines[] = '🎬 Услуга: ' . $service;
if ($package !== '') $lines[] = '📦 Пакет: ' . $package . ($packagePrice !== '' ? ' · ' . $packagePrice : '');
if ($siteType !== '') $lines[] = '🖥 Какой сайт: ' . $siteType;
if ($budget !== '') $lines[] = '💰 Бюджет: ' . $budget;
if ($deadline !== '') $lines[] = '⏱ Когда нужен: ' . $deadline;
if ($comment !== '') $lines[] = '💬 Задача: ' . $comment;
$lines[] = '';
$lines[] = '📍 Источник: ' . $source;
$lines[] = '📣 Medium: ' . $medium;
if ($utmCampaign !== '') $lines[] = '🎯 Campaign: ' . $utmCampaign;
if ($utmTerm !== '') $lines[] = '🔎 Term: ' . $utmTerm;
if ($utmContent !== '') $lines[] = '🧩 Content: ' . $utmContent;
if ($device !== '') $lines[] = '📱 Устройство: ' . $device;
if ($landingPage !== '') $lines[] = '🚪 Landing: ' . $landingPage;
if ($page !== '') $lines[] = '🌐 Страница: ' . $page;
if ($referrer !== '') $lines[] = '↩️ Referrer: ' . $referrer;
if ($lang !== '') $lines[] = '🌍 Язык: ' . $lang;
$lines[] = '🕒 Время: ' . ($clientTime !== '' ? $clientTime : $serverTime);
$message = implode("\n", $lines);

$delivered = webon_send_telegram($tgToken, $tgChatId, $message);
if (!$delivered) webon_json(array('ok'=>false,'stored'=>$stored,'id'=>$id,'error'=>'Telegram delivery failed'), 502);
webon_json(array('ok'=>true,'stored'=>$stored,'delivered'=>true,'id'=>$id,'service'=>'WebON Leads'));
