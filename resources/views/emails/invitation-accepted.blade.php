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
            <h1>Invitation Accepted</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            @if($user)
                <p><strong>{{ $user->name }}</strong> has accepted your invitation to join {{ $invitation->team ? 'the team' : 'the workspace' }} <strong>{{ $invitation->team ? $invitation->team->name : ($invitation->space ? $invitation->space->name : 'the workspace') }}</strong>.</p>
                <p>They now have access and can start collaborating on projects.</p>
            @else
                <p>Your invitation to <strong>{{ $invitation->email }}</strong> to join {{ $invitation->team ? 'the team' : 'the workspace' }} <strong>{{ $invitation->team ? $invitation->team->name : ($invitation->space ? $invitation->space->name : 'the workspace') }}</strong> has been accepted.</p>
                <p>They will need to register to access the workspace.</p>
            @endif
            @if($invitation->team)
                <a href="{{ config('app.url') }}/teams/{{ $invitation->team->id }}" class="button">View Team</a>
            @elseif($invitation->space)
                <a href="{{ config('app.url') }}/spaces/{{ $invitation->space->id }}" class="button">View Space</a>
            @endif
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
