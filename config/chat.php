<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Message attachments (per file)
    |--------------------------------------------------------------------------
    |
    | Laravel "max" rule for files is in kilobytes. Default 102400 = 100 MB.
    | Must stay at or below PHP post_max_size / upload_max_filesize on the server.
    |
    */
    'max_attachment_kb' => (int) env('CHAT_MAX_ATTACHMENT_KB', 102400),
];
