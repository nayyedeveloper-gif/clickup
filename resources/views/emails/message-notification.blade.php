<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; margin: 20px 0; }
        .message { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $isMention ? 'You were mentioned' : 'New Message' }}</h1>
        </div>
        <div class="content">
            <p>Hello {{ $user->name }},</p>
            @if($isDirect ?? false)
                <p><strong>{{ $messageModel->sender->name }}</strong> sent you a direct message.</p>
            @elseif($isMention)
                <p>You were mentioned in a message in <strong>{{ $channel->name }}</strong>.</p>
            @else
                <p>You have a new message in <strong>{{ $channel->name }}</strong>.</p>
            @endif
            <div class="message">
                <p><strong>{{ $messageModel->sender->name }}:</strong></p>
                <p>{{ $messageModel->content }}</p>
                <p style="font-size: 12px; color: #666;">{{ \Carbon\Carbon::parse($messageModel->created_at)->format('F j, Y g:i A') }}</p>
            </div>
            @if($isDirect ?? false)
                <a href="{{ config('app.url') }}/messages?user={{ $messageModel->sender_id }}" class="button">Open conversation</a>
            @else
                <a href="{{ config('app.url') }}/channels/{{ $channel->id }}" class="button">View Message</a>
            @endif
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
