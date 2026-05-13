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
        .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p><strong>{{ $inviter->name }}</strong> has invited you to join {{ $invitation->team ? 'the team' : 'the workspace' }} <strong>{{ $invitation->team ? $invitation->team->name : ($invitation->space ? $invitation->space->name : 'the workspace') }}</strong>.</p>
            <p>Click the button below to accept the invitation and start collaborating.</p>
            <a href="https://managers.29jewellery.com/invitations/accept/{{ $invitation->token }}" class="button">Accept Invitation</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                This invitation will expire in 7 days.
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
