<?php
require_once __DIR__ . '/../../agency-contact-validator.php';
$valid = array(
    'hello@example.com', '@john_doe', '+1 415 555 2671',
    '+44 20 7946 0958', 'https://t.me/valid_user',
    'https://wa.me/14155552671', '+380 97 112 01 13'
);
$invalid = array(
    '', 'foo', '12345', '123456789', '@abc', 'hello@',
    '+11111111111', 'https://evil.t.me/valid_user', 'https://example.com/',
    '0000000000'
);
foreach ($valid as $value) {
    if (!agency_contact_valid($value)) { fwrite(STDERR, "Rejected valid contact: $value\n"); exit(1); }
}
foreach ($invalid as $value) {
    if (agency_contact_valid($value)) { fwrite(STDERR, "Accepted invalid contact: $value\n"); exit(1); }
}
echo 'Agency contact validation: 17 cases passed' . PHP_EOL;
