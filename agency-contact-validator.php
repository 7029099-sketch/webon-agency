<?php
/** Validate international contacts (email, Telegram, WhatsApp, or phone). */
function agency_contact_valid($raw) {
    $value = trim((string)$raw);
    if ($value === '' || strlen($value) > 254) return false;
    if (filter_var($value, FILTER_VALIDATE_EMAIL)) return true;
    if (preg_match('/^@[A-Za-z][A-Za-z0-9_]{4,31}$/D', $value)) return true;
    if (preg_match('~^https?://(?:www\.)?t\.me/[A-Za-z][A-Za-z0-9_]{4,31}/?$~iD', $value)) return true;
    if (preg_match('~^https?://(?:www\.)?wa\.me/[1-9][0-9]{6,14}/?$~iD', $value)) return true;
    if (!preg_match('/^\+?[0-9()\s.\-]+$/D', $value)) return false;
    $digits = preg_replace('/\D+/', '', $value);
    if (strlen($digits) < 7 || strlen($digits) > 15) return false;
    if (preg_match('/^(\d)\1+$/D', $digits)) return false;
    if (preg_match('/(?:0123456789|1234567890|9876543210|0987654321)/', $digits)) return false;
    if (in_array($digits, array('1234567','12345678','123456789','1234567890','0000000000','1111111111','380991234567'), true)) return false;
    return true;
}
